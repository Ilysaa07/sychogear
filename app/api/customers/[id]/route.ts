import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

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
    if (error.code === 'P2002') {
      return NextResponse.json({ success: false, error: "Email sudah digunakan oleh customer lain" }, { status: 400 });
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
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    
    // Check if customer has orders
    const orderCount = await prisma.order.count({
      where: { customerId: id }
    });
    
    if (orderCount > 0) {
      return NextResponse.json(
        { success: false, error: "Tidak dapat menghapus customer yang memiliki riwayat order. Hapus order mereka terlebih dahulu." },
        { status: 400 }
      );
    }

    await prisma.customer.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Gagal menghapus customer" },
      { status: 500 }
    );
  }
}
