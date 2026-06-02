import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";
import { createSlug } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        images: { orderBy: { position: "asc" } },
        variants: true,
        flashSale: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    console.error("Get product error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil data produk" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const { id } = await params;
    const body = await request.json();
    const slug = createSlug(body.name);

    await prisma.productImage.deleteMany({ where: { productId: id } });
    await prisma.productVariant.deleteMany({ where: { productId: id } });

    const product = await prisma.product.update({
      where: { id },
      data: {
        name: body.name,
        slug,
        description: body.description,
        price: body.price,
        salePrice: body.salePrice || null,
        categoryId: body.categoryId,
        featured: body.featured || false,
        isNew: body.isNew || false,
        isActive: body.isActive ?? true,
        ppnRate: body.ppnRate || 0,
        pph23Rate: body.pph23Rate || 0,
        discountRate: body.discountRate || 0,
        showTaxDetails: body.showTaxDetails || false,
        images: {
          create: (body.images || [])
            .filter((img: { url: string }) => img.url)
            .map((img: { url: string; alt?: string }, i: number) => ({
              url: img.url,
              alt: img.alt || body.name,
              position: i,
            })),
        },
        variants: {
          create: (body.variants || []).map(
            (v: { size: string; stock: number }) => ({
              size: v.size,
              stock: v.stock,
            })
          ),
        },
      },
      include: {
        category: true,
        images: { orderBy: { position: "asc" } },
        variants: true,
        flashSale: true,
      },
    });

    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    console.error("Update product error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengupdate produk" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const { id } = await params;
    await prisma.product.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete product error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal menghapus produk" },
      { status: 500 }
    );
  }
}
