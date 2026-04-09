import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://sychogear.com";
  
  // Example implementation for Video Lookbook Sitemap 
  // This helps indexing if you embed .mp4 or .mov files on your PDPs or Lookbook pages
  let products: any[] = [];
  try {
    // Assuming for the future you might add a 'videoUrl' field to Product 
    // or parse it from description/features. For now we pull basic items.
    products = await prisma.product.findMany({
      select: {
        slug: true,
        name: true,
        description: true,
        images: true, // We will use the first image as the video thumbnail fallback
        updatedAt: true
      },
      take: 10, // Limit to featured items that might have videos
    });
  } catch (error) {
    console.error("Sitemap videos generation error:", error);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
  ${products.map(product => {
    // Simulate finding a video. If your schema adds raw video hosting, replace this logic.
    // We only output a video tag if we pretend one exists, or leave it blank gracefully.
    // For production readiness, let's assume NO video exists until you actually upload one.
    // A placeholder structure:
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
