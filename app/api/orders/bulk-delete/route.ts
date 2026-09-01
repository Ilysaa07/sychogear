import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const { ids } = await request.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: "No order IDs provided" },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      // Delete associated payments first
      await tx.payment.deleteMany({
        where: { orderId: { in: ids } },
      });
      // Delete orders
      await tx.order.deleteMany({
        where: { id: { in: ids } },
      });
    });

    return NextResponse.json({ success: true, count: ids.length });
  } catch (error) {
    console.error("Bulk delete orders error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete orders" },
      { status: 500 }
    );
  }
}
