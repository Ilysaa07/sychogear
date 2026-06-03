import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";

export async function PUT(request: Request, context: any) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const { id } = await context.params;
    const body = await request.json();

    const rate = await prisma.internationalShippingRate.update({
      where: { id },
      data: {
        baseRate: Number(body.baseRate),
        nextKgRate: Number(body.nextKgRate),
      }
    });

    return NextResponse.json({ success: true, data: rate });
  } catch (error) {
    console.error("Failed to update shipping rate:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update shipping rate" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, context: any) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const { id } = await context.params;

    await prisma.internationalShippingRate.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete shipping rate:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete shipping rate" },
      { status: 500 }
    );
  }
}
