import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

const ALLOWED_KEYS = [
  "heroImages",
  "heroTitle",
  "heroSubtitle",
  "heroTagline",
  "heroShowContent",
  "heroShowButtons",
  "promoActive",
  "promoImage",
  "promoTitle",
  "promoSubtitle",
  "promoLinkUrl",
  "promoLinkText",
];

// GET /api/settings — public
export async function GET() {
  try {
    const settings = await (prisma as any).siteSettings.findMany();
    const map: Record<string, string> = {};
    for (const s of settings) {
      map[s.key] = s.value;
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
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    // Revalidate home page and store pages to reflect settings changes immediately
    revalidatePath("/");
    revalidatePath("/(store)", "layout");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update settings:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
