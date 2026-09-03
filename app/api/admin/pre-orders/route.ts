import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get("search");
    const campaignId = searchParams.get("campaignId");
    
    let whereClause: any = {};
    if (search) {
      whereClause = {
        OR: [
          { customerName: { contains: search, mode: "insensitive" } },
          { preOrderNumber: { contains: search, mode: "insensitive" } },
          { whatsapp: { contains: search } }
        ]
      };
    }
    if (campaignId) {
      whereClause.campaignId = campaignId;
    }

    const preOrders = await prisma.preOrder.findMany({
      where: whereClause,
      include: {
        items: true,
      },
      orderBy: { orderDate: "desc" }
    });

    return NextResponse.json({ success: true, data: preOrders });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Failed to fetch pre-orders" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      preOrderNumber, customerName, whatsapp, address, orderDate, notes, bankName, bankAccountName,
      dpPercentage, totalAmount, dpAmount, isPaid, dpProofUrl, fullProofUrl, status, receiptNumber, items, campaignId
    } = body;
    
    const newPreOrder = await prisma.preOrder.create({
      data: {
        campaignId,
        preOrderNumber,
        customerName,
        whatsapp,
        address,
        orderDate: new Date(orderDate),
        notes,
        bankName,
        bankAccountName,
        dpPercentage,
        totalAmount,
        dpAmount,
        isPaid,
        dpProofUrl,
        fullProofUrl,
        status,
        receiptNumber,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId || null,
            customName: item.customName,
            customImage: item.customImage,
            size: item.size,
            quantity: item.quantity,
            price: item.price
          }))
        }
      },
      include: { items: true }
    });
    
    return NextResponse.json(newPreOrder, { status: 201 });
  } catch (error: any) {
    console.error("POST PreOrder error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
