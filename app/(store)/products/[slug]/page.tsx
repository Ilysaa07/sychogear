import { notFound } from "next/navigation";
import { productRepository } from "@/repositories/product.repository";
import ProductDetailClient from "@/components/store/ProductDetailClient";
import ProductCard from "@/components/store/ProductCard";
import Sidebar from "@/components/store/Sidebar";
import TranslatedText from "@/components/store/TranslatedText";
import { stripHtml } from "@/lib/utils";
import { cache } from "react";
import type { Metadata } from "next";
import type { ProductWithRelations } from "@/types";

interface Props {
  params: Promise<{ slug: string }>;
}

// cache() memoize hasil per-request — generateMetadata dan page component
// yang sama-sama memanggil findBySlug untuk slug yang sama hanya akan
// melakukan 1 query DB, bukan 2.
const getProduct = cache(async (slug: string) =>
  productRepository.findBySlug(slug)
);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://sychogear.com";
  
  if (!product) return { title: "Product Not Found" };

  const productUrl = `${baseUrl}/products/${slug}`;
  const imageUrl = product.images[0]?.url || `${baseUrl}/images/og-image.jpg`;

  const cleanDescription = stripHtml(product.description).slice(0, 160);

  return {
    title: product.name,
    description: cleanDescription,
    alternates: {
      canonical: productUrl,
    },
    openGraph: {
      title: `${product.name} | SYCHOGEAR`,
      description: cleanDescription,
      url: productUrl,
      images: [{ url: imageUrl }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description: cleanDescription,
      images: [imageUrl],
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProduct(slug);  // reuses cached result, no extra DB query

  if (!product) notFound();

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://sychogear.com";
  
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "image": product.images.map(img => img.url),
    "description": product.description,
    "sku": product.id,
    "brand": {
      "@type": "Brand",
      "name": "SYCHOGEAR",
      "url": baseUrl
    },
    "offers": {
      "@type": "Offer",
      "url": `${baseUrl}/products/${product.slug}`,
      "priceCurrency": "IDR",
      "price": product.salePrice || product.price,
      "availability": product.variants.some(v => v.stock > 0) 
        ? "https://schema.org/InStock" 
        : "https://schema.org/OutOfStock",
    }
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": baseUrl
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Products",
        "item": `${baseUrl}/products`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": product.name,
        "item": `${baseUrl}/products/${product.slug}`
      }
    ]
  };

  const relatedProducts = await productRepository.findRelated(
    product.categoryId,
    product.id,
    4
  );

  return (
    <div className="relative min-h-screen bg-void pt-0 pb-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      
      <div className="container-main flex flex-col md:flex-row gap-8 md:gap-16 -mt-4">
        {/* ─── Sidebar Categories ─── */}
        <Sidebar />

        <div className="flex-1 min-w-0">
          <ProductDetailClient product={product} />

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <section className="mt-32 pt-16 border-t border-salt/5">
              <div className="mb-10 text-center">
                <p className="text-[10px] tracking-[0.4em] uppercase text-brand-500 mb-2 font-medium">
                  <TranslatedText tKey="product.explore" />
                </p>
                <h2 className="text-3xl md:text-5xl font-semibold uppercase tracking-[0.1em] text-white">
                  <TranslatedText tKey="product.youMayAlsoLike" />
                </h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {relatedProducts.map((p: ProductWithRelations) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
