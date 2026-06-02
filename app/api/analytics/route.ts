import { NextResponse } from "next/server";
import { analyticsService } from "@/services/analytics.service";
import { requireAdmin } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const stats = await analyticsService.getDashboardStats();
    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    console.error("Get analytics error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil data analytics" },
      { status: 500 }
    );
  }
}
