import { productRepository } from "@/repositories/product.repository";
import { orderRepository } from "@/repositories/order.repository";
import { customerRepository } from "@/repositories/customer.repository";
import { couponRepository } from "@/repositories/coupon.repository";
import { prisma } from "@/lib/prisma";
import { createInvoice } from "@/lib/xendit";
import { generateOrderNumber } from "@/lib/utils";
import type { CartItem } from "@/types";

export const paymentService = {
  async createOrder(data: {
    customer: { email: string; name: string; phone: string; address: string };
    items: CartItem[];
    couponCode?: string;
  }) {
    // Find or create customer
    const customer = await customerRepository.findOrCreate(data.customer);

    // Calculate totals
    let subtotal = 0;
    const orderItems = data.items.map((item) => {
      const price = item.salePrice ?? item.price;
      subtotal += price * item.quantity;
      return {
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        price,
        size: item.size,
      };
    });

    // Apply coupon
    let discount = 0;
    let couponId: string | undefined;

    if (data.couponCode) {
      const couponResult = await couponRepository.validateCoupon(
        data.couponCode,
        subtotal
      );
      if (couponResult.valid && couponResult.coupon) {
        discount = couponResult.discount || 0;
        couponId = couponResult.coupon.id;
        await couponRepository.incrementUsage(couponResult.coupon.id);
      }
    }

    const total = subtotal - discount;
    const orderNumber = generateOrderNumber();

    // Create order
    const order = await orderRepository.create({
      orderNumber,
      customerId: customer.id,
      subtotal,
      discount,
      total,
      couponId,
      items: orderItems,
    });

    // Create Xendit invoice
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const invoice = await createInvoice({
      externalId: order.orderNumber,
      amount: total,
      payerEmail: customer.email,
      description: `Order ${order.orderNumber} - SYCHOGEAR`,
      customerName: customer.name,
      customerPhone: customer.phone || undefined,
      successRedirectUrl: `${appUrl}/payment/success?order=${order.orderNumber}`,
      failureRedirectUrl: `${appUrl}/payment/failed?order=${order.orderNumber}`,
      items: data.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.salePrice ?? item.price,
      })),
    });

    // Save payment record
    await prisma.payment.create({
      data: {
        orderId: order.id,
        externalId: invoice.external_id,
        invoiceUrl: invoice.invoice_url,
        amount: total,
        xenditId: invoice.id,
      },
    });

    return {
      order,
      invoiceUrl: invoice.invoice_url,
      orderNumber: order.orderNumber,
    };
  },

  async handleWebhook(data: {
    external_id: string;
    status: string;
    payment_method: string;
    paid_at: string;
    id: string;
  }) {
    const payment = await prisma.payment.findUnique({
      where: { externalId: data.external_id },
      include: { order: { include: { items: true } } },
    });

    if (!payment) throw new Error("Payment not found");

    const statusMap: Record<string, string> = {
      PAID: "PAID",
      EXPIRED: "EXPIRED",
      FAILED: "FAILED",
    };

    const newStatus = statusMap[data.status] || payment.status;

    // Update payment
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: newStatus as "PAID" | "EXPIRED" | "FAILED",
        method: data.payment_method,
        paidAt: data.paid_at ? new Date(data.paid_at) : null,
      },
    });

    // Update order status
    await orderRepository.updateStatus(payment.orderId, newStatus);

    // If paid, decrease stock
    if (data.status === "PAID") {
      for (const item of payment.order.items) {
        await productRepository.decreaseStock(item.variantId, item.quantity);
      }
    }

    return { success: true };
  },
};
