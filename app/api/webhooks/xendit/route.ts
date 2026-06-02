import { NextResponse } from "next/server";
import { paymentService } from "@/services/payment.service";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * POST /api/webhooks/xendit
 *
 * Menerima callback dari Xendit untuk event:
 *   - invoice.paid    → konfirmasi pembayaran, kurangi stok
 *   - invoice.expired → expire order
 *
 * Setup di Xendit Dashboard:
 *   URL: https://sychogear.vercel.app/api/webhooks/xendit
 *   Token: isi XENDIT_WEBHOOK_TOKEN di env vars
 */
export async function POST(request: Request) {
  try {
    // 1. Validasi webhook token — gunakan timing-safe comparison untuk cegah timing attack
    const callbackToken = request.headers.get("x-callback-token") || "";
    const expectedToken = process.env.XENDIT_WEBHOOK_TOKEN || "";

    if (!expectedToken) {
      console.error("[Xendit Webhook] XENDIT_WEBHOOK_TOKEN not configured");
      return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
    }

    // timingSafeEqual mencegah attacker mengukur waktu response untuk menebak token
    const { timingSafeEqual } = await import("crypto");
    const tokenMatches = callbackToken.length === expectedToken.length &&
      timingSafeEqual(Buffer.from(callbackToken), Buffer.from(expectedToken));

    if (!tokenMatches) {
      console.error("[Xendit Webhook] Invalid callback token");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    console.log("[Xendit Webhook] Received event:", body.event || body.status, "| external_id:", body.external_id);

    // Xendit Invoice webhook payload shape:
    // { event?: "invoice.paid" | "invoice.expired", status: "PAID" | "EXPIRED", external_id: "INV-...", id: "..." }
    const externalId: string = body.external_id;
    const status: string = (body.event || body.status || "").toUpperCase();

    if (!externalId) {
      return NextResponse.json({ error: "Missing external_id" }, { status: 400 });
    }

    // 2. Handle paid event
    if (status === "INVOICE.PAID" || status === "PAID") {
      try {
        // Gunakan database-level idempotency: hanya proses jika payment masih PENDING
        // Ini mencegah double-processing jika Xendit mengirim webhook dua kali secara concurrent
        const updated = await prisma.payment.updateMany({
          where: {
            externalId,
            status: "PENDING", // hanya update jika belum diproses
          },
          data: { xenditId: body.id || null },
        });

        // Jika tidak ada row yang diupdate, webhook ini sudah pernah diproses
        if (updated.count === 0) {
          console.log("[Xendit Webhook] Already processed (idempotent skip):", externalId);
          return NextResponse.json({ success: true, message: "Already processed" });
        }

        await paymentService.confirmPayment(externalId);
        console.log("[Xendit Webhook] Order confirmed:", externalId);
      } catch (err: any) {
        // If already PAID, swallow the error — webhook may be delivered twice
        if (err?.message === "Order is not UNPAID") {
          console.log("[Xendit Webhook] Order already processed:", externalId);
          return NextResponse.json({ success: true, message: "Already processed" });
        }
        throw err;
      }
    }

    // 3. Handle expired event
    else if (status === "INVOICE.EXPIRED" || status === "EXPIRED") {
      try {
        await paymentService.expireOrder(externalId);
        console.log("[Xendit Webhook] Order expired:", externalId);
      } catch (err: any) {
        if (err?.message === "Order cannot be expired") {
          console.log("[Xendit Webhook] Order already expired/processed:", externalId);
          return NextResponse.json({ success: true, message: "Already processed" });
        }
        throw err;
      }
    }

    // 4. Other events — acknowledge and ignore
    else {
      console.log("[Xendit Webhook] Unhandled event status:", status);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Xendit Webhook] Error:", error);
    // Return 200 to prevent Xendit from retrying on our app errors
    // Only return non-200 for auth failures (handled above)
    return NextResponse.json(
      { success: false, error: "Internal error" },
      { status: 500 }
    );
  }
}
