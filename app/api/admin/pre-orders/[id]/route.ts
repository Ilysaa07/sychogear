import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const preOrder = await prisma.preOrder.findUnique({
      where: { id },
      include: { items: true }
    });
    
    if (!preOrder) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(preOrder);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    
    const { 
      preOrderNumber, customerName, whatsapp, address, orderDate, notes, bankName, bankAccountName,
      dpPercentage, totalAmount, dpAmount, isPaid, dpProofUrl, fullProofUrl, status, receiptNumber, items
    } = body;
    
    // Update main order
    const updatedPreOrder = await prisma.preOrder.update({
      where: { id },
      data: {
        preOrderNumber, customerName, whatsapp, address, orderDate: new Date(orderDate), notes, bankName, bankAccountName,
        dpPercentage, totalAmount, dpAmount, isPaid, dpProofUrl, fullProofUrl, status, receiptNumber
      }
    });
    
    // Update items if provided
    if (items && Array.isArray(items)) {
      // Simplest way is to delete and recreate items
      await prisma.preOrderItem.deleteMany({ where: { preOrderId: id } });
      await prisma.preOrderItem.createMany({
        data: items.map((item: any) => ({
          preOrderId: id,
          productId: item.productId || null,
          customName: item.customName,
          customImage: item.customImage,
          size: item.size,
          quantity: item.quantity,
          price: item.price
        }))
      });
    }
    
    const finalPO = await prisma.preOrder.findUnique({
      where: { id },
      include: { items: true }
    });
    
    return NextResponse.json(finalPO);
  } catch (error: any) {
    console.error("PUT PreOrder error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.preOrder.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
