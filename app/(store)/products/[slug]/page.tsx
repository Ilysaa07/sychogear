import { notFound } from "next/navigation";
import { productRepository } from "@/repositories/product.repository";
import ProductDetailClient from "@/components/store/ProductDetailClient";
import ProductCard from "@/components/store/ProductCard";
import type { Metadata } from "next";
import type { ProductWithRelations } from "@/types";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await productRepository.findBySlug(slug);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://sychogear.com";
  
  if (!product) return { title: "Product Not Found" };

  const productUrl = `${baseUrl}/products/${slug}`;
  const imageUrl = product.images[0]?.url || `${baseUrl}/images/og-image.jpg`;

  return {
    title: product.name,
    description: product.description.slice(0, 160),
    alternates: {
      canonical: productUrl,
    },
    openGraph: {
      title: `${product.name} | SYCHOGEAR`,
      description: product.description.slice(0, 160),
      url: productUrl,
      images: [{ url: imageUrl }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description: product.description.slice(0, 160),
      images: [imageUrl],
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const product = await productRepository.findBySlug(slug);

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
      "name": "SYCHOGEAR"
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
    <div className="container-main pt-32 pb-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <ProductDetailClient product={product} />

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="mt-32 pt-16 border-t border-white/5">
          <div className="mb-10 text-center">
            <p className="text-[10px] tracking-[0.4em] uppercase text-brand-500 mb-2 font-medium">
              Explore More
            </p>
            <h2 className="text-3xl md:text-5xl font-semibold uppercase tracking-[0.1em] text-white">
              You May Also Like
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
  );
}
