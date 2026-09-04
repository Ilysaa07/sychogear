import ProductsClient from "@/components/store/ProductsClient";
import { productRepository } from "@/repositories/product.repository";
import type { Metadata } from "next";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "SYCHOGEAR | Premium Streetwear Brand",
  description: "SYCHOGEAR is a premium streetwear brand offering a curated collection of avant-garde fashion and clothing. Explore the official store.",
  openGraph: {
    title: "SYCHOGEAR | Premium Streetwear Brand",
    description: "SYCHOGEAR is a premium streetwear brand offering a curated collection of avant-garde fashion and clothing. Explore the official store.",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://sychogear.com",
    images: [{ url: "/images/og-image.jpg" }],
  }
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string }>;
}) {
  const resolvedParams = await searchParams;
  const category = resolvedParams.category || "";
  const page = Number(resolvedParams.page) || 1;

  // Fetch products on the server! 
  // Googlebot will see the rendered HTML instantly.
  const { data: initialProducts, totalPages } = await productRepository.findMany({
    category,
    page,
    limit: 12,
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://sychogear.com";
  
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${baseUrl}/#website`,
        "url": baseUrl,
        "name": "SYCHOGEAR",
        "description": "SYCHOGEAR is a premium streetwear brand.",
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", position: 1, name: "Home", item: baseUrl },
        ],
      }
    ]
  };

  return (
    <>
      <h1 className="sr-only">SYCHOGEAR - Premium Streetwear Brand</h1>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <ProductsClient
        initialProducts={initialProducts}
        totalPages={totalPages}
        currentPage={page}
      />
    </>
  );
}
