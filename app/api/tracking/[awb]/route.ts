import { NextResponse } from "next/server";
import { buildTrackingResult } from "@/lib/biteshipService";

export const dynamic = "force-dynamic";

/**
 * GET /api/tracking/[awb]
 * Returns Lion Parcel direct tracking URL. Free, no external API.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ awb: string }> }
) {
  try {
    const { awb } = await params;

    if (!awb || awb.length < 4) {
      return NextResponse.json(
        { success: false, error: "Invalid tracking number" },
        { status: 400 }
      );
    }

    const result = buildTrackingResult(awb.trim().toUpperCase());
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("[Tracking] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to build tracking info" },
      { status: 500 }
    );
  }
}
