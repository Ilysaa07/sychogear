import { NextResponse } from "next/server";
import { customerRepository } from "@/repositories/customer.repository";
import { requireAdmin } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const customers = await customerRepository.findAll();
    return NextResponse.json({ success: true, data: customers });
  } catch (error) {
    console.error("Get customers error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil data customer" },
      { status: 500 }
    );
  }
}
