import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { orderRepository } from "@/repositories/order.repository";
import { paymentService } from "@/services/payment.service";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    if (!body.status && !body.customer) {
      return NextResponse.json(
        { success: false, error: "Status or customer data is required" },
        { status: 400 }
      );
    }

    if (body.status) {
      const validStatuses = [
        "UNPAID", "PAID", "PROCESSING", "SHIPPED", 
        "DELIVERED", "CANCELLED", "EXPIRED", "FAILED"
      ];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 });
      }
    }

    let order;
    const { prisma } = await import("@/lib/prisma");

    // Handle customer details update
    if (body.customer) {
      // Find the order to get the customerId
      const existingOrder = await orderRepository.findById(id);
      if (!existingOrder) {
        return NextResponse.json({ success: false, error: "Order tidak ditemukan" }, { status: 404 });
      }
      
      // Update customer record
      await prisma.customer.update({
        where: { id: existingOrder.customerId },
        data: {
          name: body.customer.name,
          email: body.customer.email,
          phone: body.customer.phone,
          address: body.customer.address,
        },
      });
      // Fetch fresh order
      order = await orderRepository.findById(id);
    }

    if (!body.status) {
      return NextResponse.json({ success: true, data: order });
    }

    if (body.status === "PAID" && body.force) {
      // Admin override: force-confirm even if order is not UNPAID.
      // Useful to recover orders stuck in a partial-failure state.
      const existingOrder = await orderRepository.findById(id) as any;
      if (!existingOrder) {
        return NextResponse.json({ success: false, error: "Order tidak ditemukan" }, { status: 404 });
      }
      order = await prisma.$transaction(async (tx) => {
        const paid = await tx.order.update({
          where: { id: existingOrder.id },
          data: { status: "PAID" },
        });
        for (const item of existingOrder.items) {
          const variant = await tx.productVariant.findUnique({
            where: { id: item.variantId },
            select: { stock: true },
          });
          // Only decrement if stock is still available (skip if already decremented)
          if (variant && variant.stock >= item.quantity) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: { stock: { decrement: item.quantity } },
            });
          }
        }
        if (existingOrder.payment) {
          await tx.payment.update({
            where: { id: existingOrder.payment.id },
            data: { status: "PAID", paidAt: new Date() },
          });
        }
        return paid;
      });
    } else if (body.status === "PAID") {
      const existingOrder = await orderRepository.findById(id);
      if (!existingOrder) {
        return NextResponse.json({ success: false, error: "Order tidak ditemukan" }, { status: 404 });
      }
      const result = await paymentService.confirmPayment(existingOrder.invoiceNumber);
      order = result.order;
    } else {
      order = await orderRepository.updateStatus(id, body.status);
    }

    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    console.error("Update order status error:", error);
    // Return 400 for known business logic errors, 500 for unexpected ones
    const msg = error instanceof Error ? error.message : "";
    if (msg === "Order not found") {
      return NextResponse.json({ success: false, error: "Order tidak ditemukan" }, { status: 404 });
    }
    if (msg === "Order is not UNPAID") {
      return NextResponse.json(
        { success: false, error: "Order sudah dikonfirmasi atau sudah expired. Refresh halaman untuk melihat status terbaru." },
        { status: 400 }
      );
    }
    if (msg === "Order cannot be expired") {
      return NextResponse.json(
        { success: false, error: "Order tidak bisa di-expire karena statusnya bukan UNPAID." },
        { status: 400 }
      );
    }
    if (msg.includes("Stok tidak mencukupi")) {
      return NextResponse.json({ success: false, error: msg }, { status: 400 });
    }
    return NextResponse.json(
      { success: false, error: "Gagal mengupdate status order" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { prisma } = await import("@/lib/prisma");

    // Perform cascade delete safely
    await prisma.$transaction(async (tx) => {
      // Payment table lacks onDelete: Cascade, so delete it first if it exists
      await tx.payment.deleteMany({
        where: { orderId: id }
      });
      
      await tx.order.delete({
        where: { id },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete order error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal menghapus order" },
      { status: 500 }
    );
  }
}
