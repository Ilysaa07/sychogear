import { productRepository } from "@/repositories/product.repository";
import { orderRepository } from "@/repositories/order.repository";
import { customerRepository } from "@/repositories/customer.repository";
import { couponRepository } from "@/repositories/coupon.repository";
import { prisma } from "@/lib/prisma";
import { generateOrderNumber } from "@/lib/utils";
import { ManualTransferProvider } from "@/lib/paymentProvider";
import { emailService } from "@/lib/emailService";
import type { CartItem } from "@/types";

const paymentProvider = new ManualTransferProvider();

export const paymentService = {
  async createOrder(data: {
    customer: { email: string; name: string; phone: string; address: string };
    items: CartItem[];
    couponCode?: string;
  }) {
    // Find or create customer
    const customer = await customerRepository.findOrCreate(data.customer);

    // Calculate totals and taxes
    let subtotal = 0;
    let totalTaxPpn = 0;
    let totalTaxPph23 = 0;
    let totalProductDiscount = 0;

    // Bug #3 fix: validate stock before creating order
    for (const item of data.items) {
      const variant = await prisma.productVariant.findUnique({
        where: { id: item.variantId },
        select: { stock: true },
      });
      if (!variant || variant.stock < item.quantity) {
        throw new Error(`Stok tidak mencukupi untuk produk ${item.name} (ukuran ${item.size})`);
      }
    }

    const itemsWithDetails = await Promise.all(data.items.map(async (item) => {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        select: { ppnRate: true, pph23Rate: true, discountRate: true } as any
      });

      const price = item.salePrice ?? item.price;
      const discountRate = product ? (product as any).discountRate : 0;

      // Bug #1 fix: tax must be calculated on discounted price, not original price
      const discountedPrice = price * (1 - discountRate / 100);
      const discountedTotal = discountedPrice * item.quantity;
      const originalTotal = price * item.quantity;

      const ppnAmount = product ? (discountedTotal * ((product as any).ppnRate / 100)) : 0;
      const pph23Amount = product ? (discountedTotal * ((product as any).pph23Rate / 100)) : 0;
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
    }));

    // Apply coupon (on subtotal after product discounts?)
    // Usually coupons are applied to the total or subtotal. 
    // Let's keep it on subtotal for now as before.
    const subtotalAfterProductDiscount = subtotal - totalProductDiscount;
    let couponDiscount = 0;
    let couponId: string | undefined;

    if (data.couponCode) {
      // Bug #2 fix: wrap validation + increment in a single DB transaction
      // to prevent race conditions where two simultaneous checkouts both pass
      // the usage limit check before either increments the counter.
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

        let discount = 0;
        if (coupon.discountType === "PERCENTAGE") {
          discount = (subtotalAfterProductDiscount * coupon.discountValue) / 100;
          if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
        } else {
          discount = coupon.discountValue;
        }

        // Atomically increment usage count within the same transaction
        await tx.coupon.update({
          where: { id: coupon.id },
          data: { usageCount: { increment: 1 } },
        });

        return { valid: true as const, coupon, discount };
      });

      if (couponResult.valid && couponResult.coupon) {
        couponDiscount = couponResult.discount || 0;
        couponId = couponResult.coupon.id;
      }
    }

    const uniqueCode = Math.floor(100 + Math.random() * 900); // 3 digit code
    
    // total = subtotalAfterProductDiscount - couponDiscount + PPN + PPH23
    const total = subtotalAfterProductDiscount - couponDiscount + totalTaxPpn + totalTaxPph23;
    const totalWithCode = total + uniqueCode;
    const invoiceNumber = generateOrderNumber().replace("SG-", "INV-");
    
    // Set expiry 15 minutes from now
    const expiredAt = new Date();
    expiredAt.setMinutes(expiredAt.getMinutes() + 15);

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
      expiredAt,
      items: itemsWithDetails,
    });

    // Create payment via provider
    const paymentResult = await paymentProvider.createPayment({
      invoiceNumber,
      amount: totalWithCode,
      customerEmail: customer.email,
      customerName: customer.name,
    });

    // Save payment record (optional, kept for compatibility/history if needed)
    await prisma.payment.create({
      data: {
        orderId: order.id,
        externalId: paymentResult.externalId,
        invoiceUrl: `/order-success/${invoiceNumber}`,
        amount: totalWithCode,
        status: "PENDING", // PENDING in old payment model mapped to UNPAID in order model
      },
    });

    // Send Invoice Email via Brevo
    await emailService.sendInvoiceEmail({
      to: customer.email,
      customerName: customer.name,
      invoiceNumber,
      totalAmount: totalWithCode,
      expiredAt,
    }).catch(err => console.error("Failed sending email:", err));

    // Send Admin Notification via Brevo
    await emailService.sendAdminNotification({
      invoiceNumber,
      customerName: customer.name,
      customerEmail: customer.email,
      totalAmount: totalWithCode,
      items: data.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        size: item.size,
        price: item.salePrice ?? item.price,
      })),
    }).catch(err => console.error("Failed sending admin notification:", err));

    return {
      order,
      invoiceUrl: `/order-success/${invoiceNumber}`,
      invoiceNumber,
    };
  },

  async confirmPayment(invoiceNumber: string) {
    const order = await orderRepository.findByInvoiceNumber(invoiceNumber) as any;
    if (!order) throw new Error("Order not found");
    if (order.status !== "UNPAID") throw new Error("Order is not UNPAID");

    // Update order status
    await orderRepository.updateStatus(order.id, "PAID");

    // Decrease stock
    for (const item of order.items) {
      await productRepository.decreaseStock(item.variantId, item.quantity);
    }

    // Update payment record if exists
    if (order.payment) {
      await prisma.payment.update({
        where: { id: order.payment.id },
        data: {
          status: "PAID",
          paidAt: new Date(),
        },
      });
    }

    // Send confirmation email
    await emailService.sendConfirmationEmail({
      to: order.customerEmail,
      customerName: order.customerName,
      invoiceNumber: order.invoiceNumber,
    }).catch(err => console.error("Failed sending email:", err));

    return { success: true, order };
  },

  async expireOrder(invoiceNumber: string) {
    const order = await orderRepository.findByInvoiceNumber(invoiceNumber) as any;
    if (!order) throw new Error("Order not found");
    if (order.status !== "UNPAID") throw new Error("Order cannot be expired");

    // Update order status
    await orderRepository.updateStatus(order.id, "EXPIRED");

    // Update payment record if exists
    if (order.payment) {
      await prisma.payment.update({
        where: { id: order.payment.id },
        data: { status: "EXPIRED" },
      });
    }

    // Send expired email
    await emailService.sendExpiredEmail({
      to: order.customerEmail,
      customerName: order.customerName,
      invoiceNumber: order.invoiceNumber,
    }).catch(err => console.error("Failed sending email:", err));

    return { success: true, order };
  }
};
