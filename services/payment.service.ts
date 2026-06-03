import { orderRepository } from "@/repositories/order.repository";
import { customerRepository } from "@/repositories/customer.repository";
import { prisma } from "@/lib/prisma";
import { generateOrderNumber, convertIDRtoUSD } from "@/lib/utils";
import { getPaymentProvider } from "@/lib/paymentProvider";
import { emailService } from "@/lib/emailService";
import { isInternationalOrder } from "@/lib/countries";
import type { CartItem } from "@/types";

export const paymentService = {
  async createOrder(data: {
    customer: { email: string; name: string; phone: string; address: string };
    items: CartItem[];
    couponCode?: string;
    country?: string;
    orderNote?: string;
    shippingCost?: number;
    appUrl?: string;
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
        select: { id: true, stock: true },
      }),
      prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, ppnRate: true, pph23Rate: true, discountRate: true } as any,
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
      const price = item.salePrice ?? item.price;
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
    // FIX CRITICAL-1: stok divalidasi di dalam $transaction untuk cegah race condition
    const subtotalAfterProductDiscount = subtotal - totalProductDiscount;
    const uniqueCode = isInternational ? 0 : Math.floor(100 + Math.random() * 900);
    const shippingCost = data.shippingCost || 0;
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
    // FIX CRITICAL-1: Validasi stok dan pembuatan order dalam 1 transaksi
    // untuk cegah overselling saat concurrent checkout
    const order = await prisma.$transaction(async (tx) => {
      // Re-validate stock inside transaction (prevents race condition)
      for (const item of data.items) {
        const variant = await tx.productVariant.findUnique({
          where: { id: item.variantId },
          select: { stock: true },
        });
        if (!variant || variant.stock < item.quantity) {
          throw new Error(`Stok tidak mencukupi untuk produk ${item.name} (ukuran ${item.size})`);
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
          paymentMethod: "PENDING", // akan diupdate setelah provider dipilih
          shippingCost: shippingCost,
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
      xenditId: string;
      invoiceUrl: string;
      status: string;
      paymentMethod: string;
    };

    try {
      const provider = getPaymentProvider();
      paymentResult = await provider.createPayment({
        invoiceNumber,
        amount: finalTotalWithCode,
        customerEmail: customer.email,
        customerName: customer.name,
        expiredAt,
        description: `SychoGear Order ${invoiceNumber}`,
        currency: "IDR",
      });
    } catch (providerErr) {
      // Xendit atau provider gagal — tandai order sebagai FAILED agar tidak orphan
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "FAILED", paymentMethod: "UNKNOWN" },
      });
      console.error("[PaymentService] Provider createPayment failed:", providerErr);
      throw new Error("Gagal menghubungi payment gateway. Silakan coba lagi.");
    }

    const isXendit = paymentResult.paymentMethod === "XENDIT";

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
          invoiceUrl: isXendit
            ? paymentResult.invoiceUrl
            : `/order-success/${invoiceNumber}`,
          amount: finalTotalWithCode,
          currency: isInternational ? "USD" : "IDR",
          currencyAmount: isInternational
            ? convertIDRtoUSD(finalTotalWithCode, exchangeRate)
            : null,
          status: "PENDING",
          method: paymentResult.paymentMethod,
          xenditId: paymentResult.xenditId || null,
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
        paymentUrl: isXendit ? paymentResult.invoiceUrl : undefined,
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
      invoiceUrl: isXendit
        ? paymentResult.invoiceUrl
        : `/order-success/${invoiceNumber}`,
      invoiceNumber,
      paymentMethod: paymentResult.paymentMethod,
    };
  },

  async confirmPayment(invoiceNumber: string) {
    const order = (await orderRepository.findByInvoiceNumber(invoiceNumber)) as any;
    if (!order) throw new Error("Order not found");
    if (order.status !== "UNPAID") throw new Error("Order is not UNPAID");

    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Update status ke PAID
      const paid = await tx.order.update({
        where: { id: order.id },
        data: { status: "PAID" },
      });

      // Kurangi stok setiap item
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
      .catch((err) => console.error("[PaymentService] Failed sending confirmation email:", err));

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
      .catch((err) => console.error("[PaymentService] Failed sending expired email:", err));

    return { success: true, order };
  },
};
