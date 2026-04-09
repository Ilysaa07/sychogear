import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://sychogear.com";
  
  const staticPages = [
    { loc: baseUrl, changefreq: 'daily', priority: '1.0' },
    { loc: `${baseUrl}/products`, changefreq: 'daily', priority: '0.9' },
    { loc: `${baseUrl}/links`, changefreq: 'daily', priority: '0.9' },
    { loc: `${baseUrl}/cart`, changefreq: 'monthly', priority: '0.3' },
    { loc: `${baseUrl}/order-status`, changefreq: 'monthly', priority: '0.3' }
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticPages.map(page => `
  <url>
    <loc>${page.loc}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('')}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
