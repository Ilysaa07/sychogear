import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { orderRepository } from "@/repositories/order.repository";
import { paymentService } from "@/services/payment.service";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const { id } = await params;
    const body = await request.json();

    if (!body.status && !body.customer && !body.trackingNumber) {
      return NextResponse.json(
        { success: false, error: "Status, customer data, or tracking number is required" },
        { status: 400 }
      );
    }
    let order;
    const existingOrder = await orderRepository.findById(id) as any;
    if (!existingOrder) {
      return NextResponse.json({ success: false, error: "Order tidak ditemukan" }, { status: 404 });
    }

    // Prepare tracking number and courier if provided
    let trackingNumberToSave = existingOrder.trackingNumber;
    let courierToSave = existingOrder.courier;

    if (body.trackingNumber !== undefined || body.courier !== undefined) {
      trackingNumberToSave = body.trackingNumber !== undefined ? (body.trackingNumber?.trim() || null) : existingOrder.trackingNumber;
      courierToSave = body.courier !== undefined ? (body.courier?.trim() || null) : existingOrder.courier;
      
      // Auto-update status to SHIPPED if tracking number is set and current status is PAID/PROCESSING
      if (trackingNumberToSave && !body.status) {
        if (existingOrder.status === "PAID" || existingOrder.status === "PROCESSING") {
          body.status = "SHIPPED";
        }
      }
    }

    // Handle customer details update
    if (body.customer) {
      await prisma.customer.update({
        where: { id: existingOrder.customerId },
        data: {
          name: body.customer.name,
          email: body.customer.email,
          phone: body.customer.phone,
          address: body.customer.address,
        },
      });
    }

    if (body.status) {
      const validStatuses = [
        "UNPAID", "PAID", "PROCESSING", "SHIPPED", 
        "DELIVERED", "CANCELLED", "EXPIRED", "FAILED"
      ];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 });
      }

      const RESTORE_STATUSES = ["CANCELLED", "EXPIRED", "FAILED"];
      const PREVIOUS_WAS_RESTORED = RESTORE_STATUSES.includes(existingOrder.status);
      const NEW_IS_RESTORED = RESTORE_STATUSES.includes(body.status);

      if (body.status === "PAID" && existingOrder.status === "UNPAID") {
        // Use paymentService to also trigger emails
        const result = await paymentService.confirmPayment(existingOrder.invoiceNumber);
        order = await prisma.order.update({
          where: { id },
          data: { trackingNumber: trackingNumberToSave, courier: courierToSave }
        });
      } else {
        order = await prisma.$transaction(async (tx) => {
          const result = await tx.order.updateMany({
            where: { id: existingOrder.id, status: existingOrder.status },
            data: { status: body.status, trackingNumber: trackingNumberToSave, courier: courierToSave },
          });

          if (result.count === 0) throw new Error("Status order telah berubah oleh proses lain");

          // Restore stock if transitioning to cancelled/expired/failed
          if (!PREVIOUS_WAS_RESTORED && NEW_IS_RESTORED) {
            for (const item of existingOrder.items) {
              await tx.productVariant.update({
                where: { id: item.variantId },
                data: { stock: { increment: item.quantity } },
              });
            }
          }
          
          // Re-decrement stock if transitioning FROM cancelled/expired/failed TO active
          if (PREVIOUS_WAS_RESTORED && !NEW_IS_RESTORED) {
            for (const item of existingOrder.items) {
              const vResult = await tx.productVariant.updateMany({
                where: { id: item.variantId, stock: { gte: item.quantity } },
                data: { stock: { decrement: item.quantity } }
              });
              if (vResult.count === 0) throw new Error(`Stok tidak mencukupi untuk memulihkan pesanan`);
            }
          }

          if (body.status === "PAID" && existingOrder.payment && existingOrder.status !== "PAID") {
            await tx.payment.update({
              where: { id: existingOrder.payment.id },
              data: { status: "PAID", paidAt: new Date() },
            });
          }

          return { ...existingOrder, status: body.status, trackingNumber: trackingNumberToSave, courier: courierToSave };
        });
      }
    } else if (body.trackingNumber !== undefined || body.courier !== undefined) {
      // Only tracking/courier update, no status changerequested (and not auto-triggered)
      order = await prisma.order.update({
        where: { id },
        data: { trackingNumber: trackingNumberToSave, courier: courierToSave }
      });
    } else {
      // Must be customer update only
      order = await orderRepository.findById(id);
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
    const authError = await requireAdmin();
    if (authError) return authError;

    const { id } = await params;

    return NextResponse.json(
      { success: false, error: "Pesanan tidak dapat dihapus permanen. Ubah status menjadi CANCELLED." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Delete order error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal menghapus order" },
      { status: 500 }
    );
  }
}
