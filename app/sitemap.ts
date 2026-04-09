import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://sychogear.com").replace(/\/$/, "");

  try {
    // 1. Static Pages
    const staticPages: MetadataRoute.Sitemap = [
      { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
      { url: `${baseUrl}/products`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
      { url: `${baseUrl}/links`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    ];

    // 2. Dynamic Products
    const products = await prisma.product.findMany({
      select: {
        slug: true,
        updatedAt: true,
      },
    });

    const productEntries: MetadataRoute.Sitemap = products.map((product) => ({
      url: `${baseUrl}/products/${product.slug}`,
      lastModified: product.updatedAt ? new Date(product.updatedAt) : new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    // Combine everything into one monolithic master sitemap
    return [...staticPages, ...productEntries];
  } catch (error) {
    console.error("Critical Sitemap Error:", error);
    // Hard fallback to ensure sitemap.xml still exists even if the DB connection dies
    return [
      { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    ];
  }
}
