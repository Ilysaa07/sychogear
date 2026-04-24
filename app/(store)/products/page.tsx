"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { useCurrency } from "@/components/store/CurrencyProvider";
import Image from "next/image";
import type { ProductWithRelations } from "@/types";
import ProductCard from "@/components/store/ProductCard";

const CATEGORIES = ["All", "Outerwear", "Tops", "Bottoms", "Accessories"];

export default function ProductsPage() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://sychogear.com";
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: baseUrl },
      { "@type": "ListItem", position: 2, name: "Archive", item: `${baseUrl}/products` },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Suspense
        fallback={
          <div className="min-h-screen bg-[#111512] flex items-center justify-center pt-20">
            <p className="font-syne font-bold uppercase tracking-widest text-ash text-sm">Loading...</p>
          </div>
        }
      >
        <ProductsContent />
      </Suspense>
    </>
  );
}

function ProductsContent() {
  const { formatPrice } = useCurrency();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [products, setProducts] = useState<ProductWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);

  const category = searchParams.get("category") || "";
  const page = Number(searchParams.get("page")) || 1;

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (category && category !== "All") params.set("category", category);
        params.set("page", String(page));
        const { data } = await axios.get(`/api/products?${params}`);
        if (data.success) { setProducts(data.data); setTotalPages(data.totalPages); }
      } catch { setProducts([]); }
      finally { setLoading(false); }
    };
    fetchProducts();
  }, [category, page]);

  const updateCategory = (cat: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (cat === "All") {
      params.delete("category");
    } else {
      params.set("category", cat);
    }
    params.set("page", "1");
    router.push(`/products?${params}`);
  };

  const updatePage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`/products?${params}`);
  };

  return (
    <div className="relative min-h-screen bg-[#111512]" style={{ paddingTop: "100px" }}>
      
      {/* ─── Supreme-style Minimalist Navigation ─── */}
      <nav className="container-main mb-12">
        <div className="flex flex-wrap items-center gap-6 font-dm-mono text-xs uppercase tracking-widest">
          {CATEGORIES.map((cat) => {
            const isActive = category === cat || (!category && cat === "All");
            return (
              <button
                key={cat}
                onClick={() => updateCategory(cat)}
                className={`transition-colors duration-200 ${
                  isActive ? "text-salt font-bold border-b border-salt pb-0.5" : "text-ash hover:text-salt"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </nav>

      {/* ─── Giant Feed (Concept A) ─── */}
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 mb-32">
        {loading ? (
          <div className="flex flex-col gap-24">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="w-full aspect-[4/5] bg-dim animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex justify-center py-32 text-center">
            <p className="font-dm-mono text-sm text-ash uppercase tracking-widest">No products found in the archive.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-32">
            {products.map((product, idx) => {
              const isOnSale = product.flashSale?.isActive && product.flashSale.salePrice;
              const displayPrice = isOnSale ? product.flashSale!.salePrice : product.salePrice || product.price;
              const finalPrice = product.discountRate > 0 ? displayPrice * (1 - product.discountRate / 100) : displayPrice;

              return (
                <div key={product.id} className="w-full relative group">
                  {/* Top info */}
                  <div className="flex justify-between items-end mb-4 px-2">
                    <h2 className="font-syne font-bold text-3xl sm:text-5xl uppercase tracking-tight text-salt">
                      {product.name}
                    </h2>
                    <span className="font-dm-mono text-lg text-ash">
                      {String(idx + 1 + (page - 1) * 10).padStart(2, "0")}
                    </span>
                  </div>

                  {/* Giant Image */}
                  <Link href={`/products/${product.slug}`} className="block w-full relative aspect-[4/5] sm:aspect-square overflow-hidden bg-abyss border border-ember transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-[1.02]">
                    <Image
                      src={product.images[0]?.url || "/placeholder.svg"}
                      alt={product.name}
                      fill
                      sizes="(max-width: 1024px) 100vw, 1024px"
                      className="object-cover filter brightness-90 contrast-110 grayscale-[10%] group-hover:grayscale-0 transition-all duration-700"
                    />
                    
                    {/* Hover Call to action overlay */}
                    <div className="absolute inset-0 bg-[#111512]/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-500 backdrop-blur-sm">
                      <span className="font-syne font-bold text-3xl text-salt uppercase tracking-[0.3em] border-b-2 border-salt pb-2">
                        View Details
                      </span>
                    </div>

                    {/* Badges */}
                    <div className="absolute top-6 left-6 z-10 flex gap-2">
                      {product.isNew && <span className="bg-salt text-void font-syne font-bold text-xs px-4 py-2 uppercase tracking-widest leading-none">New</span>}
                      {isOnSale && <span className="bg-signal text-void font-syne font-bold text-xs px-4 py-2 uppercase tracking-widest leading-none">Sale</span>}
                    </div>
                  </Link>

                  {/* Bottom info */}
                  <div className="flex justify-between items-start mt-6 px-2">
                    <p className="font-dm-mono text-sm text-ash max-w-sm leading-relaxed">
                      {product.category.name} // The archive selection.
                    </p>
                    <p className="font-dm-mono text-2xl text-salt">
                      {formatPrice(finalPrice)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && !loading && (
          <div className="flex items-center justify-center gap-4 mt-20">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
              const isActive = page === p;
              return (
                <button
                  key={p}
                  onClick={() => updatePage(p)}
                  className={`font-dm-mono text-xs uppercase tracking-widest transition-colors ${
                    isActive ? "text-salt font-bold border-b border-salt pb-0.5" : "text-ash hover:text-salt"
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
