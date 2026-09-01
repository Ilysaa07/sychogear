import { NextResponse } from "next/server";
import { searchDestination } from "@/lib/shipping";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || query.length < 3) {
      return NextResponse.json({ success: true, data: [] });
    }

    const areas = await searchDestination(query);
    return NextResponse.json({ success: true, data: areas });
  } catch (error: any) {
    console.error("[Coverage API Error]:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
