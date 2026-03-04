import { NextResponse } from "next/server";
import { analyticsService } from "@/services/analytics.service";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

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
