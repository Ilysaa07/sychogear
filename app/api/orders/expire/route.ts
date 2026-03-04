import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { paymentService } from "@/services/payment.service";

export const dynamic = "force-dynamic";

// This endpoint should be called by a cron job (e.g., Vercel Cron)
// It finds all UNPAID orders that have passed their expiredAt time.
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    // Optional: Secure with CRON_SECRET if provided
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    
    // Find expired UNPAID orders
    const expiredOrders = await prisma.order.findMany({
      where: {
        status: "UNPAID",
        expiredAt: { lte: now },
      },
      select: { invoiceNumber: true },
    });

    const results = [];
    for (const order of expiredOrders) {
      try {
        await paymentService.expireOrder(order.invoiceNumber);
        results.push({ invoiceNumber: order.invoiceNumber, success: true });
      } catch (err) {
        console.error(`Failed to expire order ${order.invoiceNumber}:`, err);
        results.push({ invoiceNumber: order.invoiceNumber, success: false });
      }
    }

    return NextResponse.json({
      success: true,
      processed: expiredOrders.length,
      details: results,
    });
  } catch (error) {
    console.error("Cron expire error:", error);
    return NextResponse.json(
      { success: false, error: "Cron job failed" },
      { status: 500 }
    );
  }
}
