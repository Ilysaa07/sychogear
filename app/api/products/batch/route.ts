import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { NextRequest } from "next/server";

// Cache 30 detik — cukup fresh untuk validasi stok di cart,
// tidak perlu force-dynamic karena ini bukan data real-time kritis.
export const revalidate = 30;

/**
 * GET /api/products/batch?ids=id1&ids=id2&ids=id3
 *
 * Menggantikan pola N+1 di cart-store.syncItemPrices() yang sebelumnya
 * melakukan 1 fetch per product. Endpoint ini mengambil semua produk
 * yang dibutuhkan dalam 1 DB query.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const ids = searchParams.getAll("ids").filter(Boolean);

    if (ids.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Batasi maksimal 20 produk per request untuk mencegah abuse
    const safeIds = ids.slice(0, 20);

    const products = await prisma.product.findMany({
      where: { id: { in: safeIds } },
      select: {
        id: true,
        price: true,
        salePrice: true,
        discountRate: true,
        ppnRate: true,
        pph23Rate: true,
        isActive: true,
        variants: {
          select: { id: true, stock: true, size: true },
        },
        flashSale: {
          select: { isActive: true, salePrice: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: products });
  } catch (error) {
    console.error("[products/batch] GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
