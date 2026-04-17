import { productRepository } from "@/repositories/product.repository";
import { orderRepository } from "@/repositories/order.repository";
import { customerRepository } from "@/repositories/customer.repository";
import { prisma } from "@/lib/prisma";
import { generateOrderNumber, convertIDRtoUSD } from "@/lib/utils";
import { ManualTransferProvider } from "@/lib/paymentProvider";
import { emailService } from "@/lib/emailService";
import { isInternationalOrder, getCountryByCode } from "@/lib/countries";
import type { CartItem } from "@/types";

const manualTransferProvider = new ManualTransferProvider();

export const paymentService = {
  async createOrder(data: {
    customer: { email: string; name: string; phone: string; address: string };
    items: CartItem[];
    couponCode?: string;
    country?: string;
    appUrl?: string;
  }) {
    const country = data.country || "ID";
    const isInternational = isInternationalOrder(country);
    const paymentMethod = "MANUAL_TRANSFER";

    // Find or create customer
    const customer = await customerRepository.findOrCreate(data.customer);

    // Validate stock before creating order
    for (const item of data.items) {
      const variant = await prisma.productVariant.findUnique({
        where: { id: item.variantId },
        select: { stock: true },
      });
      if (!variant || variant.stock < item.quantity) {
        throw new Error(`Stok tidak mencukupi untuk produk ${item.name} (ukuran ${item.size})`);
      }
    }

    // Fetch settings from DB — single flat rate for both shipping and tax
    let shippingCost = 0;
    let internationalTaxRate = 0; // % applied to ALL international orders
    let exchangeRate = Number(process.env.IDR_TO_USD_RATE) || 16000;

    try {
      const settings = await (prisma as any).siteSettings.findMany({
        where: {
          key: {
            in: [
              "shippingZones",
              "internationalTaxEnabled",
              "internationalTaxRate",
              "idrToUsdRate",
            ],
          },
        },
      });

      const settingsMap: Record<string, string> = {};
      for (const s of settings) {
        settingsMap[s.key as string] = s.value as string;
      }

      if (isInternational) {
        // Region-based shipping rate
        const countryInfo = getCountryByCode(country);
        const defaultZones: Record<string, number> = {
          "Southeast Asia": 150000,
          "East Asia": 200000,
          "South Asia": 250000,
          "Middle East": 300000,
          "Oceania": 350000,
          "Europe": 400000,
          "Americas": 450000,
        };

        if (countryInfo) {
          if (settingsMap.shippingZones) {
            try {
              const zones = JSON.parse(settingsMap.shippingZones);
              if (zones && typeof zones[countryInfo.region] === "number") {
                shippingCost = zones[countryInfo.region];
              } else {
                shippingCost = defaultZones[countryInfo.region] ?? 0;
              }
            } catch (e) {
              console.error("Failed to parse shipping zones in payment service", e);
              shippingCost = defaultZones[countryInfo.region] ?? 0;
            }
          } else {
            shippingCost = defaultZones[countryInfo.region] ?? 0;
          }
        }

        // Global PPN rate — same for ALL countries
        const taxEnabled =
          settingsMap.internationalTaxEnabled !== "false"; // default true
        if (taxEnabled) {
          internationalTaxRate = settingsMap.internationalTaxRate ? parseFloat(settingsMap.internationalTaxRate) || 11 : 11;
        }
      }

      if (settingsMap.idrToUsdRate) {
        exchangeRate = parseFloat(settingsMap.idrToUsdRate) || 16000;
      }
    } catch (err) {
      console.warn("[PaymentService] Failed to fetch settings:", err);
    }

    // Calculate subtotals and taxes per item
    let subtotal = 0;
    let totalTaxPpn = 0;
    let totalTaxPph23 = 0;
    let totalProductDiscount = 0;

    const itemsWithDetails = await Promise.all(
      data.items.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { ppnRate: true, pph23Rate: true, discountRate: true } as any,
        });

        const price = item.salePrice ?? item.price;
        const discountRate = product ? (product as any).discountRate : 0;

        // Tax calculated on discounted price
        const discountedPrice = price * (1 - discountRate / 100);
        const discountedTotal = discountedPrice * item.quantity;
        const originalTotal = price * item.quantity;

        let ppnAmount = 0;
        let pph23Amount = 0;

        if (isInternational) {
          // Single global PPN rate for all international orders
          ppnAmount = Math.round(discountedTotal * (internationalTaxRate / 100));
          // No PPH23 for international
        } else {
          // Domestic: use per-product tax configuration
          ppnAmount = product
            ? Math.round(discountedTotal * ((product as any).ppnRate / 100))
            : 0;
          pph23Amount = product
            ? Math.round(discountedTotal * ((product as any).pph23Rate / 100))
            : 0;
        }

        const discountAmount = originalTotal - discountedTotal;

        subtotal += originalTotal;
        totalTaxPpn += ppnAmount;
        totalTaxPph23 += pph23Amount;
        totalProductDiscount += discountAmount;

        return {
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          price,
          size: item.size,
          ppnAmount,
          pph23Amount,
          discountAmount,
        };
      })
    );

    // Apply coupon on subtotal after product discounts
    const subtotalAfterProductDiscount = subtotal - totalProductDiscount;
    let couponDiscount = 0;
    let couponId: string | undefined;

    if (data.couponCode) {
      const couponResult = await prisma.$transaction(async (tx) => {
        const coupon = await tx.coupon.findUnique({ where: { code: data.couponCode } });
        if (!coupon) return { valid: false as const, error: "Kupon tidak ditemukan" };
        if (!coupon.isActive) return { valid: false as const, error: "Kupon tidak aktif" };
        if (coupon.expiresAt && coupon.expiresAt < new Date())
          return { valid: false as const, error: "Kupon sudah kadaluarsa" };
        if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit)
          return { valid: false as const, error: "Kupon sudah mencapai batas penggunaan" };
        if (subtotalAfterProductDiscount < coupon.minPurchase)
          return {
            valid: false as const,
            error: `Minimal pembelian Rp ${coupon.minPurchase.toLocaleString()}`,
          };

        let discount = 0;
        if (coupon.discountType === "PERCENTAGE") {
          discount = (subtotalAfterProductDiscount * coupon.discountValue) / 100;
          if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
        } else {
          discount = coupon.discountValue;
        }

        await tx.coupon.update({
          where: { id: coupon.id },
          data: { usageCount: { increment: 1 } },
        });

        return { valid: true as const, coupon, discount };
      });

      if (!couponResult.valid) {
        throw new Error(couponResult.error || "Kupon tidak valid");
      }

      if (couponResult.coupon) {
        couponDiscount = couponResult.discount || 0;
        couponId = couponResult.coupon.id;
      }
    }

    // Unique code only for domestic (3-digit suffix for bank transfer matching)
    const uniqueCode = isInternational ? 0 : Math.floor(100 + Math.random() * 900);

    // Total = (subtotal - productDiscount - couponDiscount) + tax + shipping + uniqueCode
    const total =
      subtotalAfterProductDiscount -
      couponDiscount +
      totalTaxPpn +
      totalTaxPph23 +
      shippingCost;
    const totalWithCode = total + uniqueCode;
    const invoiceNumber = generateOrderNumber().replace("SG-", "INV-");

    // Expiry: 15 min domestic, 24 hrs international
    const expiredAt = new Date();
    expiredAt.setMinutes(expiredAt.getMinutes() + (isInternational ? 1440 : 15));

    // Create order
    const order = await orderRepository.create({
      invoiceNumber,
      customerName: customer.name,
      customerEmail: customer.email,
      customerId: customer.id,
      subtotal,
      taxPpn: totalTaxPpn,
      taxPph23: totalTaxPph23,
      totalDiscount: totalProductDiscount,
      discount: couponDiscount,
      uniqueCode,
      totalWithCode,
      total,
      couponId,
      country,
      paymentMethod,
      shippingCost,
      expiredAt,
      items: itemsWithDetails,
    });

    // All orders: Manual Transfer flow
    const paymentResult = await manualTransferProvider.createPayment({
      invoiceNumber,
      amount: totalWithCode,
      customerEmail: customer.email,
      customerName: customer.name,
    });

    // Save payment record
    await prisma.payment.create({
      data: {
        orderId: order.id,
        externalId: paymentResult.externalId,
        invoiceUrl: `/order-success/${invoiceNumber}`,
        amount: totalWithCode,
        currency: isInternational ? "USD" : "IDR",
        currencyAmount: isInternational
          ? convertIDRtoUSD(totalWithCode, exchangeRate)
          : null,
        status: "PENDING",
        method: "MANUAL_TRANSFER",
      },
    });

    // Send invoice email
    await emailService
      .sendInvoiceEmail({
        to: customer.email,
        customerName: customer.name,
        invoiceNumber,
        totalAmount: totalWithCode,
        expiredAt,
        isInternational,
        amountUSD: isInternational
          ? convertIDRtoUSD(totalWithCode, exchangeRate)
          : undefined,
        country,
      })
      .catch((err) => console.error("Failed sending email:", err));

    // Send admin notification
    await emailService
      .sendAdminNotification({
        invoiceNumber,
        customerName: customer.name,
        customerEmail: customer.email,
        totalAmount: totalWithCode,
        country,
        paymentMethod: "MANUAL_TRANSFER",
        amountUSD: isInternational
          ? convertIDRtoUSD(totalWithCode, exchangeRate)
          : undefined,
        items: data.items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          size: item.size,
          price: item.salePrice ?? item.price,
        })),
      })
      .catch((err) => console.error("Failed sending admin notification:", err));

    return {
      order,
      invoiceUrl: `/order-success/${invoiceNumber}`,
      invoiceNumber,
      paymentMethod: "MANUAL_TRANSFER",
    };
  },

  async confirmPayment(invoiceNumber: string) {
    const order = (await orderRepository.findByInvoiceNumber(invoiceNumber)) as any;
    if (!order) throw new Error("Order not found");
    if (order.status !== "UNPAID") throw new Error("Order is not UNPAID");

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const paid = await tx.order.update({
        where: { id: order.id },
        data: { status: "PAID" },
      });

      for (const item of order.items) {
        const variant = await tx.productVariant.findUnique({
          where: { id: item.variantId },
          select: { stock: true },
        });
        if (!variant || variant.stock < item.quantity) {
          throw new Error(`Stok tidak mencukupi untuk varian ${item.variantId}`);
        }
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      if (order.payment) {
        await tx.payment.update({
          where: { id: order.payment.id },
          data: { status: "PAID", paidAt: new Date() },
        });
      }

      return paid;
    });

    await emailService
      .sendConfirmationEmail({
        to: order.customerEmail,
        customerName: order.customerName,
        invoiceNumber: order.invoiceNumber,
      })
      .catch((err) => console.error("Failed sending confirmation email:", err));

    return { success: true, order: updatedOrder };
  },

  async expireOrder(invoiceNumber: string) {
    const order = (await orderRepository.findByInvoiceNumber(invoiceNumber)) as any;
    if (!order) throw new Error("Order not found");
    if (order.status !== "UNPAID") throw new Error("Order cannot be expired");

    await orderRepository.updateStatus(order.id, "EXPIRED");

    if (order.payment) {
      await prisma.payment.update({
        where: { id: order.payment.id },
        data: { status: "EXPIRED" },
      });
    }

    await emailService
      .sendExpiredEmail({
        to: order.customerEmail,
        customerName: order.customerName,
        invoiceNumber: order.invoiceNumber,
      })
      .catch((err) => console.error("Failed sending email:", err));

    return { success: true, order };
  },
};
