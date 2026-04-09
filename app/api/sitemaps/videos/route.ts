import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://sychogear.com";
  
  let products: any[] = [];
  try {
    products = await prisma.product.findMany({
      select: {
        slug: true,
        name: true,
        description: true,
        updatedAt: true
      },
      take: 10, 
    });
  } catch (error) {
    console.error("Video sitemap generation error:", error);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
  ${products.map(product => {
    // This remains a template for future video functionality
    return `<!-- 
    <url>
      <loc>${baseUrl}/products/${product.slug}</loc>
      <video:video>
        <video:thumbnail_loc>${baseUrl}/images/og-image.jpg</video:thumbnail_loc>
        <video:title><![CDATA[${product.name} Lookbook]]></video:title>
        <video:description><![CDATA[${product.description.substring(0, 100)}...]]></video:description>
        <video:content_loc>${baseUrl}/videos/${product.slug}.mp4</video:content_loc>
        <video:publication_date>${new Date(product.updatedAt).toISOString()}</video:publication_date>
        <video:family_friendly>yes</video:family_friendly>
      </video:video>
    </url>
    -->`;
  }).join('')}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
