import { NextResponse } from "next/server";
import { productRepository } from "@/repositories/product.repository";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createSlug } from "@/lib/utils";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filters = {
      category: searchParams.get("category") || undefined,
      size: searchParams.get("size") || undefined,
      minPrice: searchParams.get("minPrice")
        ? Number(searchParams.get("minPrice"))
        : undefined,
      maxPrice: searchParams.get("maxPrice")
        ? Number(searchParams.get("maxPrice"))
        : undefined,
      sort: (searchParams.get("sort") as "latest" | "price-asc" | "price-desc") || undefined,
      page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : 12,
      search: searchParams.get("search") || undefined,
    };

    const result = await productRepository.findMany(filters);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Get products error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil data produk" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const slug = createSlug(body.name);

    const product = await prisma.product.create({
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
        images: {
          create: (body.images || []).map((img: { url: string; alt?: string }, i: number) => ({
            url: img.url,
            alt: img.alt || body.name,
            position: i,
          })),
        },
        variants: {
          create: (body.variants || []).map((v: { size: string; stock: number }) => ({
            size: v.size,
            stock: v.stock,
          })),
        },
      },
      include: {
        category: true,
        images: true,
        variants: true,
        flashSale: true,
      },
    });

    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    console.error("Create product error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal membuat produk" },
      { status: 500 }
    );
  }
}
