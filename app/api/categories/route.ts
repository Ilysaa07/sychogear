import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Bug #5 fix: categories rarely change, use ISR cache (1 min) instead of force-dynamic
export const revalidate = 60;

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" }
    });
    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}
