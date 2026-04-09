import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 3600; // Revalidate every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://sychogear.com").replace(/\/$/, "");

  try {
    // Core Pages
    const staticPages: MetadataRoute.Sitemap = [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 1,
      },
      {
        url: `${baseUrl}/products`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.9,
      },
      {
        url: `${baseUrl}/links`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.9,
      },
    ];

    // Dynamic Product Pages
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

    return [...staticPages, ...productEntries];
  } catch (error) {
    console.error("Sitemap generation failed:", error);
    // Fallback to minimal sitemap to prevent 404/500
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 1,
      },
    ];
  }
}
