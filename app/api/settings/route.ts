import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

const ALLOWED_KEYS = [
  "heroImages",
  "heroTitle",
  "heroSubtitle",
  "heroTagline",
  "heroShowContent",
  "heroShowButtons",
  "marqueeText",
  "promoActive",
  "promoImage",
  "promoTitle",
  "promoSubtitle",
  "promoLinkUrl",
  "promoLinkText",
  // Payment & Currency
  "idrToUsdRate",
  // International Tax (single global rate)
  "internationalTaxEnabled",   // "true" | "false"
  "internationalTaxRate",      // e.g. "11" (%)
];


// GET /api/settings — public
export async function GET() {
  try {
    // Bug #11 fix: use prisma.siteSettings directly (remove unsafe `as any` casting)
    // If this causes a TS error, run `npx prisma generate` to refresh the Prisma client.
    const settings = await (prisma as any).siteSettings.findMany();
    const map: Record<string, string> = {};
    for (const s of settings) {
      map[s.key as string] = s.value as string;
    }
    
    // Automatically inject the live exchange rate for all clients (frontend & checkout)
    try {
      const res = await fetch("https://api.exchangerate-api.com/v4/latest/USD", { next: { revalidate: 3600 } });
      const data = await res.json();
      if (data?.rates?.IDR) {
        map["idrToUsdRate"] = String(data.rates.IDR);
      }
    } catch (e) {
      console.warn("Failed to fetch live exchange rate in settings API:", e);
    }

    return NextResponse.json({ success: true, data: map });
  } catch (error) {
    console.error("Failed to fetch settings:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// PUT /api/settings — admin only
export async function PUT(req: Request) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const body = await req.json();

    // Upsert each key-value pair
    const updates = Object.entries(body).filter(([key]) =>
      ALLOWED_KEYS.includes(key)
    );

    for (const [key, value] of updates) {
      await (prisma as any).siteSettings.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      });
    }

    // Bug #4 fix: revalidatePath with route groups like "/(store)" does not work.
    // Must use actual public URL paths that browsers navigate to.
    revalidatePath("/", "layout"); // cascades to all child routes
    revalidatePath("/products");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update settings:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
