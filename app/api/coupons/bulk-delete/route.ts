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
        { success: false, error: "No coupon IDs provided" },
        { status: 400 }
      );
    }

    await prisma.coupon.deleteMany({
      where: { id: { in: ids } },
    });

    return NextResponse.json({ success: true, count: ids.length });
  } catch (error) {
    console.error("Bulk delete coupons error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete coupons" },
      { status: 500 }
    );
  }
}
