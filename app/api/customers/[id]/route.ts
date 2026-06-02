import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";

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

    const updated = await prisma.customer.update({
      where: { id },
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone || null,
        address: body.address || null,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { success: false, error: "Email sudah digunakan oleh customer lain" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Gagal mengupdate customer" },
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

    const orderCount = await prisma.order.count({ where: { customerId: id } });
    if (orderCount > 0) {
      return NextResponse.json(
        { success: false, error: "Tidak dapat menghapus customer yang memiliki riwayat order." },
        { status: 400 }
      );
    }

    await prisma.customer.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Gagal menghapus customer" },
      { status: 500 }
    );
  }
}
