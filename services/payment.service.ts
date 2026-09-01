import { orderRepository } from "@/repositories/order.repository";
import { customerRepository } from "@/repositories/customer.repository";
import { prisma } from "@/lib/prisma";
import { generateOrderNumber, convertIDRtoUSD } from "@/lib/utils";
import { getPaymentProvider } from "@/lib/paymentProvider";
import { emailService } from "@/lib/emailService";
import { isInternationalOrder } from "@/lib/countries";
import { getShippingCosts } from "@/lib/shipping";
import type { CartItem } from "@/types";

export const paymentService = {
  async createOrder(data: {
    customer: { email: string; name: string; phone: string; address: string };
    items: CartItem[];
    couponCode?: string;
    country?: string;
    orderNote?: string;
    shippingCost?: number;
    paymentMethod?: string;
    appUrl?: string;
    subdistrictId?: string;
    shippingService?: string;
  }) {
    const country = data.country || "ID";
    const isInternational = isInternationalOrder(country);

    // ── 1. Find or create customer ──────────────────────────────────────────
    const customer = await customerRepository.findOrCreate(data.customer);

    // ── 2. Fetch settings (tax, exchange rate) ──────────────────────────────
    let internationalTaxRate = 0;
    
    // Automatically use real-time exchange rate for checkouts
    let exchangeRate = await import("@/lib/utils").then(m => m.getLiveExchangeRate(16000));

    try {
      const settings = await (prisma as any).siteSettings.findMany({
        where: { key: { in: ["internationalTaxRate"] } },
      });
      const settingsMap: Record<string, string> = {};
      for (const s of settings) settingsMap[s.key as string] = s.value as string;
      if (isInternational) {
        internationalTaxRate = settingsMap.internationalTaxRate
          ? parseFloat(settingsMap.internationalTaxRate) || 11 : 11;
      }
    } catch (err) {
      console.warn("[PaymentService] Failed to fetch settings:", err);
    }

    // ── 3. Fetch products & variants in batch ───────────────────────────────
    const variantIds = data.items.map((i) => i.variantId);
    const productIds = data.items.map((i) => i.productId);

    const [variantsFromDb, productsFromDb] = await Promise.all([
      prisma.productVariant.findMany({
        where: { id: { in: variantIds } },
        select: { id: true, stock: true, productId: true },
      }),
      prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, ppnRate: true, pph23Rate: true, discountRate: true, weight: true, flashSale: true } as any,
      }),
    ]);

    const variantMap = new Map(variantsFromDb.map((v: any) => [v.id, v]));
    const productMap = new Map(productsFromDb.map((p: any) => [p.id, p]));

    // ── 4. Calculate totals ─────────────────────────────────────────────────
    let subtotal = 0;
    let totalTaxPpn = 0;
    let totalTaxPph23 = 0;
    let totalProductDiscount = 0;

    const itemsWithDetails = data.items.map((item) => {
      const product = productMap.get(item.productId);
      const now = new Date();
      const fs = (product as any)?.flashSale;
      const isFlashSaleActive = fs && fs.isActive && now >= fs.startDate && now <= fs.endDate;
      const price = isFlashSaleActive ? fs.salePrice : ((product as any)?.salePrice ?? (product as any)?.price ?? 0);
      const discountRate = product ? (product as any).discountRate : 0;
      const discountedPrice = price * (1 - discountRate / 100);
      const discountedTotal = discountedPrice * item.quantity;
      const originalTotal = price * item.quantity;
      const ppnAmount = isInternational
        ? Math.round(discountedTotal * (internationalTaxRate / 100))
        : 0;
      const discountAmount = originalTotal - discountedTotal;

      subtotal += originalTotal;
      totalTaxPpn += ppnAmount;
      totalProductDiscount += discountAmount;

      return {
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        price,
        size: item.size,
        ppnAmount,
        pph23Amount: 0,
        discountAmount,
      };
    });

    // ── 5. Validate stock + coupon + create order — all in one transaction ──
    const subtotalAfterProductDiscount = subtotal - totalProductDiscount;
    const uniqueCode = 0; // Removed random unique code since we use DOKU (automated payment gateway)
    let shippingCost = 0;
    if (data.subdistrictId && data.shippingService) {
      const originAreaId = process.env.RAJAONGKIR_ORIGIN_ID;
      if (!originAreaId) throw new Error("Server configuration error: RAJAONGKIR_ORIGIN_ID is missing");
      let totalWeight = 0;
      for (const item of data.items) {
        const product = productMap.get(item.productId);
        totalWeight += item.quantity * ((product as any)?.weight || 300);
      }
      const ratesResponse = await getShippingCosts(originAreaId, data.subdistrictId, totalWeight);
      const selectedRate = ratesResponse.find((r: any) => 
        r.service_code === data.shippingService || r.service_name === data.shippingService
      );
      if (!selectedRate) throw new Error(`Invalid shipping service selected: ${data.shippingService}`);
      shippingCost = selectedRate.price;
    }

    const total =
      subtotalAfterProductDiscount + totalTaxPpn + totalTaxPph23 + uniqueCode + shippingCost;
    const totalWithCode = total;
    const invoiceNumber = generateOrderNumber().replace("SG-", "INV-");
    const expiredAt = new Date();
    expiredAt.setMinutes(expiredAt.getMinutes() + (isInternational ? 1440 : 15));

    // Resolve coupon discount (masih di luar tx, hanya read)
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
          return { valid: false as const, error: `Minimal pembelian Rp ${coupon.minPurchase.toLocaleString()}` };

        let discount = coupon.discountType === "PERCENTAGE"
          ? (subtotalAfterProductDiscount * coupon.discountValue) / 100
          : coupon.discountValue;
        if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);

        await tx.coupon.update({
          where: { id: coupon.id },
          data: { usageCount: { increment: 1 } },
        });

        return { valid: true as const, coupon, discount };
      });

      if (!couponResult.valid) throw new Error(couponResult.error || "Kupon tidak valid");
      if (couponResult.coupon) {
        couponDiscount = couponResult.discount || 0;
        couponId = couponResult.coupon.id;
      }
    }

    const finalTotal = total - couponDiscount;
    const finalTotalWithCode = finalTotal;

    // ── Atomic: validate stock + create order ───────────────────────────────
    const aggregatedMap = data.items.reduce((acc, item) => {
      if (!acc[item.variantId]) acc[item.variantId] = { ...item, quantity: 0 };
      acc[item.variantId].quantity += item.quantity;
      return acc;
    }, {} as Record<string, any>);
    const aggregatedItems = Object.values(aggregatedMap);

    const order = await prisma.$transaction(async (tx) => {
      // Re-validate stock inside transaction (prevents race condition)
      for (const item of aggregatedItems) {
        const variantData = variantMap.get(item.variantId);
        if (!variantData || (variantData as any).productId !== item.productId) {
           throw new Error(`Invalid variant data for product ${item.name}`);
        }
        const result = await tx.productVariant.updateMany({
          where: { id: item.variantId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } }
        });
        if (result.count === 0) {
          throw new Error(`Stok tidak mencukupi untuk produk ${item.name}`);
        }
      }

      // Create order
      return tx.order.create({
        data: {
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
          totalWithCode: finalTotalWithCode,
          total: finalTotal,
          couponId,
          country,
          notes: data.orderNote,
          paymentMethod: data.paymentMethod || "PENDING",
          shippingCost: shippingCost,
          subdistrictId: data.subdistrictId,
          courier: data.shippingService,
          expiredAt,
          items: {
            create: itemsWithDetails,
          },
        },
        include: {
          items: { include: { product: { include: { images: { take: 1 } } }, variant: true } },
          payment: true,
          customer: true,
          coupon: true,
        },
      });
    });

    // ── 6. Create payment via provider ──────────────────────────────────────
    // FIX MEDIUM-1: Jika Xendit gagal, tandai order sebagai FAILED (bukan orphan)
    let paymentResult: {
      externalId: string;
      paymentGatewayId: string;
      invoiceUrl?: string;
      paymentCode?: string;
      status: string;
      paymentMethod: string;
    };

    try {
      const provider = getPaymentProvider();

      // Build line items for payment provider (DOKU summary breakdown)
      const providerLineItems = itemsWithDetails.map(item => ({
        id: item.productId,
        name: `${data.items.find(i => i.variantId === item.variantId)?.name || 'Item'} (${item.size})`,
        price: item.price - (item.discountAmount / item.quantity),
        quantity: item.quantity
      }));
      if (shippingCost > 0) providerLineItems.push({ id: "SHIPPING", name: "Shipping Cost", price: shippingCost, quantity: 1 });
      if (totalTaxPpn > 0) providerLineItems.push({ id: "TAX_PPN", name: "Tax (PPN)", price: totalTaxPpn, quantity: 1 });
      if (totalTaxPph23 > 0) providerLineItems.push({ id: "TAX_PPH23", name: "Tax (PPh23)", price: totalTaxPph23, quantity: 1 });
      if (couponDiscount > 0) providerLineItems.push({ id: "DISCOUNT", name: `Discount (${data.couponCode})`, price: -couponDiscount, quantity: 1 });

      paymentResult = await provider.createPayment({
        invoiceNumber,
        amount: finalTotalWithCode,
        customerEmail: customer.email,
        customerName: customer.name,
        expiredAt,
        description: `SychoGear Order ${invoiceNumber}`,
        currency: "IDR",
        paymentMethod: data.paymentMethod,
        lineItems: providerLineItems,
      });
    } catch (providerErr) {
      await prisma.$transaction(async (tx) => {
        const result = await tx.order.updateMany({
          where: { id: order.id, status: "UNPAID" },
          data: { status: "FAILED", paymentMethod: "UNKNOWN" }
        });
        if (result.count === 1) {
          for (const item of aggregatedItems) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: { stock: { increment: item.quantity } }
            });
          }
        }
      });
      console.error("[PaymentService] Provider createPayment failed:", providerErr);
      throw new Error("Gagal menghubungi payment gateway. Silakan coba lagi.");
    }

    const isDoku = paymentResult.paymentMethod === "DOKU";

    // ── 7. Update order paymentMethod + save payment record ─────────────────
    await prisma.$transaction([
      prisma.order.update({
        where: { id: order.id },
        data: { paymentMethod: paymentResult.paymentMethod },
      }),
      prisma.payment.create({
        data: {
          orderId: order.id,
          externalId: paymentResult.externalId,
          invoiceUrl: paymentResult.invoiceUrl || null,
          paymentCode: paymentResult.paymentCode || null,
          amount: finalTotalWithCode,
          currency: isInternational ? "USD" : "IDR",
          currencyAmount: isInternational
            ? convertIDRtoUSD(finalTotalWithCode, exchangeRate)
            : null,
          status: "PENDING",
          method: paymentResult.paymentMethod,
          paymentGatewayId: paymentResult.paymentGatewayId || null,
        },
      }),
    ]);

    // ── 8. Send emails (fire-and-forget) ────────────────────────────────────
    await emailService
      .sendInvoiceEmail({
        to: customer.email,
        customerName: customer.name,
        invoiceNumber,
        totalAmount: finalTotalWithCode,
        expiredAt,
        isInternational,
        amountUSD: isInternational
          ? convertIDRtoUSD(finalTotalWithCode, exchangeRate)
          : undefined,
        country,
        paymentUrl: isDoku ? paymentResult.invoiceUrl : undefined,
      })
      .catch((err) => console.error("[PaymentService] Failed sending invoice email:", err));

    await emailService
      .sendAdminNotification({
        invoiceNumber,
        customerName: customer.name,
        customerEmail: customer.email,
        totalAmount: finalTotalWithCode,
        country,
        paymentMethod: paymentResult.paymentMethod,
        amountUSD: isInternational
          ? convertIDRtoUSD(finalTotalWithCode, exchangeRate)
          : undefined,
        items: data.items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          size: item.size,
          price: item.salePrice ?? item.price,
        })),
      })
      .catch((err) => console.error("[PaymentService] Failed sending admin notification:", err));

    return {
      order,
      invoiceUrl: paymentResult.invoiceUrl,
      paymentCode: paymentResult.paymentCode,
      invoiceNumber,
      paymentMethod: paymentResult.paymentMethod,
    };
  },

  async confirmPayment(invoiceNumber: string) {
    const order = (await orderRepository.findByInvoiceNumber(invoiceNumber)) as any;
    if (!order) throw new Error("Order not found");
    if (order.status === "PAID") return { success: true, already_processed: true, order };
    if (order.status !== "UNPAID") throw new Error(`Invalid state transition: ${order.status} -> PAID`);

    const txResult = await prisma.$transaction(async (tx) => {
      const result = await tx.order.updateMany({
        where: { id: order.id, status: "UNPAID" },
        data: { status: "PAID" },
      });

      if (result.count === 0) {
        const latest = await tx.order.findUnique({ where: { id: order.id } });
        if (latest?.status === "PAID") return { already_processed: true, order: latest };
        throw new Error(`Invalid state transition: ${latest?.status} -> PAID`);
      }

      if (order.payment) {
        await tx.payment.update({
          where: { id: order.payment.id },
          data: { status: "PAID", paidAt: new Date() },
        });
      }

      return { updated: true };
    });

    if (txResult.already_processed) return { success: true, already_processed: true, order: txResult.order };
    const updatedOrder = await orderRepository.findByInvoiceNumber(invoiceNumber) as any;

    await emailService
      .sendConfirmationEmail({
        to: order.customerEmail,
        customerName: order.customerName,
        invoiceNumber: order.invoiceNumber,
      })
      .catch((err) => console.error("[PaymentService] Failed sending confirmation email:", err));

    // If this is a domestic order with a subdistrictId, we could create an order in Komerce here if needed.
    // However, since we are moving away from automatic biteship order creation,
    // admins will handle shipping orders outside of the system, or via a separate process.
    if (updatedOrder.subdistrictId && updatedOrder.courier) {
      // Optional: Add logic to process shipping if using an integrated 3PL
      console.log(`Order ${updatedOrder.id} ready for shipping to subdistrict ${updatedOrder.subdistrictId} via ${updatedOrder.courier}`);
    }

    return { success: true, order: updatedOrder };
  },

  async expireOrder(invoiceNumber: string) {
    const order = (await orderRepository.findByInvoiceNumber(invoiceNumber)) as any;
    if (!order) throw new Error("Order not found");
    if (order.status === "EXPIRED" || order.status === "CANCELLED") return { success: true, already_processed: true, order };
    if (order.status !== "UNPAID") throw new Error(`Cannot expire order in status: ${order.status}`);

    const txResult = await prisma.$transaction(async (tx) => {
      const result = await tx.order.updateMany({
        where: { id: order.id, status: "UNPAID" },
        data: { status: "EXPIRED" }
      });
      
      if (result.count === 1) {
        for (const item of order.items) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { increment: item.quantity } },
          });
        }

        if (order.payment) {
          await tx.payment.update({
            where: { id: order.payment.id },
            data: { status: "EXPIRED" },
          });
        }
        return { updated: true };
      }
      return { already_processed: true };
    });

    if (txResult.already_processed) return { success: true, already_processed: true, order };

    await emailService
      .sendExpiredEmail({
        to: order.customerEmail,
        customerName: order.customerName,
        invoiceNumber: order.invoiceNumber,
      })
      .catch((err) => console.error("[PaymentService] Failed sending expired email:", err));

    return { success: true, order };
  },
};
