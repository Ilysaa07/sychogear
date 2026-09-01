import { NextResponse } from "next/server";
import { getShippingCosts } from "@/lib/shipping";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { destinationAreaId, subdistrictId, items } = body;

    const destId = subdistrictId || destinationAreaId;

    if (!destId) {
      return NextResponse.json({ success: false, error: "Missing destination subdistrict ID" }, { status: 400 });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: "Missing items" }, { status: 400 });
    }

    const originAreaId = process.env.RAJAONGKIR_ORIGIN_ID || "123"; // Replace with your actual origin ID

    // Calculate total weight (assuming 300g per item if not specified)
    const totalWeight = items.reduce((acc, item) => acc + (item.quantity * 300), 0);

    const rates = await getShippingCosts(originAreaId, destId, totalWeight);

    return NextResponse.json({ success: true, data: rates });
  } catch (error: any) {
    console.error("[Rates API Error]:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
