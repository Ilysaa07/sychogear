import ProductsClient from "@/components/store/ProductsClient";
import { productRepository } from "@/repositories/product.repository";

export const dynamic = 'force-dynamic';

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
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: baseUrl },
    ],
  };

  return (
    <>
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
