import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { deleteFileAction } from "@/app/actions/upload";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const { ids } = await request.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: "No product IDs provided" },
        { status: 400 }
      );
    }

    // Retrieve images to delete from Supabase storage
    const products = await prisma.product.findMany({
      where: { id: { in: ids } },
      include: { images: true },
    });

    for (const product of products) {
      for (const img of product.images) {
        if (img.url) {
          try {
            await deleteFileAction(img.url);
          } catch (e) {
            console.error(`Failed to delete image from storage: ${img.url}`, e);
          }
        }
      }
    }

    // Products delete will cascade to variants and images in Prisma 
    // due to onDelete: Cascade in the schema
    await prisma.product.deleteMany({
      where: { id: { in: ids } },
    });

    return NextResponse.json({ success: true, count: ids.length });
  } catch (error) {
    console.error("Bulk delete products error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete products" },
      { status: 500 }
    );
  }
}
