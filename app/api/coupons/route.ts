import { NextResponse } from "next/server";
import { couponRepository } from "@/repositories/coupon.repository";
import { auth } from "@/lib/auth";
import { couponSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const coupons = await couponRepository.findAll();
    return NextResponse.json({ success: true, data: coupons });
  } catch (error) {
    console.error("Get coupons error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil data kupon" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = couponSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const coupon = await couponRepository.create({
      ...validation.data,
      expiresAt: validation.data.expiresAt ? new Date(validation.data.expiresAt) : null,
    });

    return NextResponse.json({ success: true, data: coupon });
  } catch (error) {
    console.error("Create coupon error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal membuat kupon" },
      { status: 500 }
    );
  }
}
