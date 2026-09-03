import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const campaign = await prisma.preOrderCampaign.findUnique({
      where: { id },
      include: {
        product: true,
      }
    });

    if (!campaign) {
      return NextResponse.json({ success: false, error: "Campaign not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: campaign });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Failed to fetch campaign" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    await prisma.preOrderCampaign.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Failed to delete campaign" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, productId, endDate, bannerUrl, isActive } = body;

    const campaign = await prisma.preOrderCampaign.update({
      where: { id },
      data: {
        name,
        product: productId ? { connect: { id: productId } } : { disconnect: true },
        endDate: endDate ? new Date(endDate) : null,
        bannerUrl: bannerUrl || null,
        isActive: isActive !== undefined ? isActive : true,
      }
    });

    return NextResponse.json({ success: true, data: campaign });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Failed to update campaign" }, { status: 500 });
  }
}
