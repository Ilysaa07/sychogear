import { NextResponse } from "next/server";
import { orderRepository } from "@/repositories/order.repository";
import { auth } from "@/lib/auth";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const filters = {
      status: searchParams.get("status") || undefined,
      page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : 20,
    };

    const result = await orderRepository.findMany(filters);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Get orders error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil data order" },
      { status: 500 }
    );
  }
}
