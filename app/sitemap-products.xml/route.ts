import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://sychogear.com";
  
  let products: any[] = [];
  try {
    products = await prisma.product.findMany({
      select: {
        slug: true,
        updatedAt: true,
      },
    });
  } catch (error) {
    console.error("Sitemap products generation error:", error);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${products.map(product => `
  <url>
    <loc>${baseUrl}/products/${product.slug}</loc>
    <lastmod>${product.updatedAt ? new Date(product.updatedAt).toISOString() : new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('')}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
