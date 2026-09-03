import { NextResponse } from "next/server";
import { orderRepository } from "@/repositories/order.repository";
import { orderStatusSchema } from "@/lib/validations";
import { verifyTurnstileToken } from "@/lib/turnstile";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, invoiceNumber, turnstileToken } = body;

    const turnstileCheck = await verifyTurnstileToken(turnstileToken);
    if (!turnstileCheck.success) {
      return NextResponse.json(
        { success: false, error: turnstileCheck.error },
        { status: 403 }
      );
    }

    const validation = orderStatusSchema.safeParse({ email, invoiceNumber });

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const order = await orderRepository.findByEmailAndInvoiceNumber(
      validation.data.email,
      validation.data.invoiceNumber
    );

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    console.error("Order status error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil status order" },
      { status: 500 }
    );
  }
}
