import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { code, subtotal } = await request.json();

    if (!code) {
      return NextResponse.json(
        { success: false, error: "Kode kupon wajib diisi" },
        { status: 400 }
      );
    }

    if (subtotal === undefined || subtotal < 0) {
      return NextResponse.json(
        { success: false, error: "Subtotal tidak valid" },
        { status: 400 }
      );
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon) {
      return NextResponse.json(
        { success: false, error: "Kupon tidak ditemukan" },
        { status: 404 }
      );
    }

    if (!coupon.isActive) {
      return NextResponse.json(
        { success: false, error: "Kupon tidak aktif" },
        { status: 400 }
      );
    }

    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      return NextResponse.json(
        { success: false, error: "Kupon sudah kadaluarsa" },
        { status: 400 }
      );
    }

    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return NextResponse.json(
        { success: false, error: "Kupon sudah mencapai batas penggunaan" },
        { status: 400 }
      );
    }

    if (subtotal < coupon.minPurchase) {
      return NextResponse.json(
        { success: false, error: `Minimal pembelian untuk kupon ini adalah Rp ${coupon.minPurchase.toLocaleString("id-ID")}` },
        { status: 400 }
      );
    }

    // Calculate discount
    let discount = 0;
    if (coupon.discountType === "PERCENTAGE") {
      discount = (subtotal * coupon.discountValue) / 100;
      if (coupon.maxDiscount) {
        discount = Math.min(discount, coupon.maxDiscount);
      }
    } else {
      discount = coupon.discountValue;
    }

    // Don't discount more than the subtotal itself (though subtotal should already be greater than minPurchase)
    discount = Math.min(discount, subtotal);

    return NextResponse.json({
      success: true,
      data: {
        id: coupon.id,
        code: coupon.code,
        discountAmount: discount,
      },
    });
  } catch (error) {
    console.error("Coupon validation error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal memvalidasi kupon" },
      { status: 500 }
    );
  }
}
