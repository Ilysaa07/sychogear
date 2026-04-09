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
        name: true,
        images: true,
      },
    });
  } catch (error) {
    console.error("Image sitemap generation error:", error);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  ${products.map(product => {
    let imagesArr: any[] = [];
    try {
      imagesArr = typeof product.images === 'string' ? JSON.parse(product.images) : product.images || [];
    } catch {
      imagesArr = [];
    }

    if (!imagesArr || imagesArr.length === 0) return '';

    return `
  <url>
    <loc>${baseUrl}/products/${product.slug}</loc>
    ${imagesArr.map((img: any) => {
      const imgUrl = typeof img === 'string' ? img : img.url;
      return `
    <image:image>
      <image:loc>${imgUrl.startsWith('http') ? imgUrl : `${baseUrl}${imgUrl}`}</image:loc>
      <image:title><![CDATA[${product.name}]]></image:title>
    </image:image>`;
    }).join('')}
  </url>`;
  }).join('')}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
