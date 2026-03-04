import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const invoiceNumber = searchParams.get("invoiceNumber");

  if (!invoiceNumber) {
    return NextResponse.json({ error: "Invoice number is required" }, { status: 400 });
  }

  try {
    const order = await prisma.order.findFirst({
      where: { invoiceNumber },
      select: { status: true }
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, status: order.status });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
