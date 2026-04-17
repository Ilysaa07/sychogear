import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * POST /api/shipping/rates
 * Body: { country: "SG" }
 * Returns admin-configured flat international shipping rate.
 * No external API — free and unlimited.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const country = (body.country || "ID").toUpperCase();

    if (country === "ID") {
      return NextResponse.json({
        success: true,
        data: { price: 0, etd: "2–5 hari", isFree: true },
      });
    }

    // Find country region
    const { getCountryByCode } = await import("@/lib/countries");
    const countryInfo = getCountryByCode(country);
    let shippingPrice = 0;

    if (countryInfo) {
      const defaultZones: Record<string, number> = {
        "Southeast Asia": 150000,
        "East Asia": 200000,
        "South Asia": 250000,
        "Middle East": 300000,
        "Oceania": 350000,
        "Europe": 400000,
        "Americas": 450000,
      };

      try {
        const setting = await (prisma as any).siteSettings.findUnique({
          where: { key: "shippingZones" },
        });
        if (setting?.value) {
          const zones = JSON.parse(setting.value);
          if (zones && typeof zones[countryInfo.region] === "number") {
            shippingPrice = zones[countryInfo.region];
          } else {
            shippingPrice = defaultZones[countryInfo.region] ?? 0;
          }
        } else {
          shippingPrice = defaultZones[countryInfo.region] ?? 0;
        }
      } catch (e) {
        console.error("Failed to parse shipping zones", e);
        shippingPrice = defaultZones[countryInfo.region] ?? 0;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        price: shippingPrice,
        etd: "3–14 days",
        isFree: shippingPrice === 0,
      },
    });
  } catch (error) {
    console.error("[Shipping Rates] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get shipping rate" },
      { status: 500 }
    );
  }
}
