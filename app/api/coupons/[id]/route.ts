import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { couponRepository } from "@/repositories/coupon.repository";

export const dynamic = "force-dynamic";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const { id } = await params;
    const body = await request.json();

    const coupon = await couponRepository.update(id, {
      code: body.code,
      discountType: body.discountType,
      discountValue: body.discountValue,
      minPurchase: body.minPurchase || 0,
      maxDiscount: body.maxDiscount || null,
      usageLimit: body.usageLimit || null,
      isActive: body.isActive ?? true,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
    });

    return NextResponse.json({ success: true, data: coupon });
  } catch (error) {
    console.error("Update coupon error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengupdate kupon" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const { id } = await params;
    await couponRepository.delete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete coupon error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal menghapus kupon" },
      { status: 500 }
    );
  }
}
