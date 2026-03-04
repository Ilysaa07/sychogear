import { NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/xendit";
import { paymentService } from "@/services/payment.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    // Verify webhook signature
    const webhookToken = request.headers.get("x-callback-token");
    if (!webhookToken || !verifyWebhookSignature(webhookToken)) {
      return NextResponse.json(
        { success: false, error: "Invalid webhook signature" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { external_id, status, payment_method, paid_at, id } = body;

    if (!external_id || !status) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    await paymentService.handleWebhook({
      external_id,
      status,
      payment_method,
      paid_at,
      id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { success: false, error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
