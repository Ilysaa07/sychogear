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
  if (!product) return { title: "Product Not Found" };

  return {
    title: product.name,
    description: product.description.slice(0, 160),
    openGraph: {
      title: product.name,
      description: product.description.slice(0, 160),
      images: product.images[0]?.url ? [product.images[0].url] : [],
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const product = await productRepository.findBySlug(slug);

  if (!product) notFound();

  const relatedProducts = await productRepository.findRelated(
    product.categoryId,
    product.id,
    4
  );

  return (
    <div className="container-main pt-32 pb-12">
      <ProductDetailClient product={product} />

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="mt-20 pt-12 border-t border-white/5">
          <h2 className="text-2xl font-bold tracking-tight mb-8">
            You May Also Like
          </h2>
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
