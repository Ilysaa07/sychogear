import { NextResponse } from "next/server";
import { customerRepository } from "@/repositories/customer.repository";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

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
