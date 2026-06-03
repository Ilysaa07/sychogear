import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";

export async function GET() {
  try {
    const rates = await prisma.internationalShippingRate.findMany({
      orderBy: { countryCode: "asc" }
    });
    return NextResponse.json({ success: true, data: rates });
  } catch (error) {
    console.error("Failed to fetch shipping rates:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch shipping rates" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const body = await request.json();
    
    // Check if rate for country already exists
    const existing = await prisma.internationalShippingRate.findUnique({
      where: { countryCode: body.countryCode }
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: `Rate for country ${body.countryCode} already exists.` },
        { status: 400 }
      );
    }

    const rate = await prisma.internationalShippingRate.create({
      data: {
        countryCode: body.countryCode,
        baseRate: Number(body.baseRate),
        nextKgRate: Number(body.nextKgRate),
      }
    });

    return NextResponse.json({ success: true, data: rate });
  } catch (error) {
    console.error("Failed to create shipping rate:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create shipping rate" },
      { status: 500 }
    );
  }
}
