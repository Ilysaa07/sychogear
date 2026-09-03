import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const campaigns = await prisma.preOrderCampaign.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        product: true,
        _count: {
          select: { preOrders: true }
        }
      }
    });
    return NextResponse.json({ success: true, data: campaigns });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Failed to fetch campaigns" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, productId, endDate, bannerUrl } = body;
    
    if (!name) {
      return NextResponse.json({ success: false, error: "Name is required" }, { status: 400 });
    }

    const campaign = await prisma.preOrderCampaign.create({
      data: {
        name,
        productId: productId || null,
        endDate: endDate ? new Date(endDate) : null,
        bannerUrl: bannerUrl || null,
      }
    });

    return NextResponse.json({ success: true, data: campaign });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Failed to create campaign" }, { status: 500 });
  }
}
