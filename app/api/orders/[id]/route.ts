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

    if (!body.status) {
      return NextResponse.json(
        { success: false, error: "Status is required" },
        { status: 400 }
      );
    }

    const validStatuses = [
      "UNPAID",
      "PAID",
      "PROCESSING",
      "SHIPPED",
      "DELIVERED",
      "CANCELLED",
      "EXPIRED",
      "FAILED",
    ];

    if (!validStatuses.includes(body.status)) {
      return NextResponse.json(
        { success: false, error: "Invalid status" },
        { status: 400 }
      );
    }

    let order;
    if (body.status === "PAID") {
      const existingOrder = await orderRepository.findById(id);
      if (!existingOrder) {
        return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
      }
      const result = await paymentService.confirmPayment(existingOrder.invoiceNumber);
      order = result.order;
    } else {
      order = await orderRepository.updateStatus(id, body.status);
    }

    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    console.error("Update order status error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengupdate status order" },
      { status: 500 }
    );
  }
}
