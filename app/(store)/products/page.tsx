"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { useCurrency } from "@/components/store/CurrencyProvider";
import Image from "next/image";
import QuickViewModal from "@/components/store/QuickViewModal";
import type { ProductWithRelations } from "@/types";

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
          <div className="min-h-screen bg-void flex items-center justify-center pt-20">
            <p className="font-dm-mono uppercase tracking-widest text-ash text-xs">Loading Archive...</p>
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
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [quickViewProduct, setQuickViewProduct] = useState<ProductWithRelations | null>(null);

  const category = searchParams.get("category") || "";
  const page = Number(searchParams.get("page")) || 1;

  // Fetch categories once
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await axios.get("/api/categories");
        if (data.success) {
          setCategories(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    };
    fetchCategories();
  }, []);

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
    <div className="relative min-h-screen bg-void pt-32 pb-24">
      {/* Quick View Modal */}
      <QuickViewModal product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />
      
      {/* ─── Archive Header & Navigation ─── */}
      <div className="container-main mb-16 md:mb-24 flex flex-col md:flex-row justify-between items-start md:items-end gap-8 border-b border-ember pb-8">
        <div>
          <h1 className="font-syne font-bold text-4xl md:text-6xl text-salt uppercase tracking-tight mb-4">
            Archive Unit
          </h1>
          <p className="font-dm-mono text-xs text-ash tracking-widest uppercase">
            Collection — 01 // {products.length > 0 ? "Data Loaded" : "No Data"}
          </p>
        </div>

        <nav className="flex flex-wrap items-center gap-4 md:gap-6 font-dm-mono text-[10px] uppercase tracking-widest">
          {[{ name: "All" }, ...categories].map((catObj) => {
            const cat = catObj.name;
            const isActive = category === cat || (!category && cat === "All");
            return (
              <button
                key={cat}
                onClick={() => updateCategory(cat)}
                className={`transition-colors duration-200 ${
                  isActive ? "text-salt" : "text-ash hover:text-salt"
                }`}
              >
                [ {cat} ]
              </button>
            );
          })}
        </nav>
      </div>

      {/* ─── Editorial Grid ─── */}
      <div className="container-main">
        {loading ? (
          <>
            {/* Mobile skeleton: horizontal strip */}
            <div className="flex sm:hidden gap-4 overflow-x-auto pb-4 -mx-4 px-4" style={{ scrollSnapType: "x mandatory" }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 w-[75vw] aspect-[3/4] bg-dim animate-pulse" style={{ scrollSnapAlign: "start" }} />
              ))}
            </div>
            {/* Desktop skeleton: grid */}
            <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="w-full aspect-[3/4] bg-dim animate-pulse" />
              ))}
            </div>
          </>
        ) : products.length === 0 ? (
          <div className="flex justify-center py-32 text-center">
            <p className="font-dm-mono text-xs text-ash uppercase tracking-widest">Subject not found in archive.</p>
          </div>
        ) : (
          <>
            {/* ─── Mobile: Horizontal Snap Scroll ─── */}
            <div
              className="flex sm:hidden gap-4 overflow-x-auto pb-6 -mx-4 px-4"
              style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}
            >
              {products.map((product, idx) => {
                const isOnSale = product.flashSale?.isActive && product.flashSale.salePrice;
                const displayPrice = isOnSale ? product.flashSale!.salePrice : product.salePrice || product.price;
                const finalPrice = product.discountRate > 0 ? displayPrice * (1 - product.discountRate / 100) : displayPrice;
                const totalStock = product.variants.reduce((s, v) => s + v.stock, 0);
                const isSoldOut = totalStock === 0;
                const isLowStock = !isSoldOut && totalStock <= 3;
                return (
                  <div key={product.id} className="flex-shrink-0 w-[75vw] relative group" style={{ scrollSnapAlign: "start" }}>
                    <div className="relative w-full aspect-[3/4] overflow-hidden bg-abyss mb-3">
                      <Link href={`/products/${product.slug}`} className="absolute inset-0 z-10" aria-label={product.name} />
                      <Image src={product.images[0]?.url || "/placeholder.svg"} alt={product.name} fill sizes="75vw" className="object-cover" />
                      {/* Sold Out Overlay */}
                      {isSoldOut && (
                        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 backdrop-blur-[2px]">
                          <span className="font-syne font-bold text-white uppercase tracking-[0.3em] text-xs -rotate-12">Sold Out</span>
                        </div>
                      )}
                      <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5">
                        {product.isNew && !isSoldOut && <span className="bg-salt text-void font-syne font-bold text-[9px] px-2 py-1 uppercase tracking-widest leading-none">New</span>}
                        {isOnSale && !isSoldOut && <span className="bg-signal text-void font-syne font-bold text-[9px] px-2 py-1 uppercase tracking-widest leading-none">Sale</span>}
                        {isLowStock && <span className="font-dm-mono font-bold text-[9px] px-2 py-1 uppercase tracking-widest leading-none" style={{ backgroundColor: "rgba(192,57,43,0.85)", color: "#fff" }}>Only {totalStock} left</span>}
                      </div>
                      {!isSoldOut && <button onClick={() => setQuickViewProduct(product)} className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap font-dm-mono text-[10px] font-bold tracking-[0.2em] uppercase px-4 py-2" style={{ backgroundColor: "rgba(8,8,8,0.9)", color: "#e8e4dc", border: "1px solid rgba(232,228,220,0.3)", backdropFilter: "blur(8px)" }}>+ Quick View</button>}
                    </div>
                    <h3 className="font-syne font-bold text-sm text-salt uppercase tracking-tight truncate mb-1">{product.name}</h3>
                    <p className="font-dm-mono text-xs text-salt/60">{formatPrice(finalPrice)}</p>
                  </div>
                );
              })}
            </div>

            {/* ─── Desktop: Grid ─── */}
            <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12 lg:gap-16">
            {products.map((product, idx) => {
              const isOnSale = product.flashSale?.isActive && product.flashSale.salePrice;
              const displayPrice = isOnSale ? product.flashSale!.salePrice : product.salePrice || product.price;
              const finalPrice = product.discountRate > 0 ? displayPrice * (1 - product.discountRate / 100) : displayPrice;
              const totalStock = product.variants.reduce((s, v) => s + v.stock, 0);
              const isSoldOut = totalStock === 0;
              const isLowStock = !isSoldOut && totalStock <= 3;

              return (
                <div key={product.id} className="w-full relative group flex flex-col">
                  {/* Image Block */}
                  <div className="relative w-full aspect-[3/4] overflow-hidden bg-abyss border border-transparent group-hover:border-ember transition-colors duration-500 mb-5">
                    <Link href={`/products/${product.slug}`} className="absolute inset-0 z-10" aria-label={product.name} />
                    <Image
                      src={product.images[0]?.url || "/placeholder.svg"}
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]"
                    />

                    {/* Sold Out Overlay */}
                    {isSoldOut && (
                      <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 backdrop-blur-[2px]">
                        <span className="font-syne font-bold text-white uppercase tracking-[0.3em] text-sm -rotate-12">Sold Out</span>
                      </div>
                    )}
                    
                    {/* Hover Crosshair Overlay */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 border border-salt opacity-50 flex items-center justify-center">
                        <div className="w-1 h-1 bg-salt" />
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
                      {product.isNew && !isSoldOut && <span className="bg-salt text-void font-syne font-bold text-[9px] px-2 py-1 uppercase tracking-widest leading-none">New</span>}
                      {isOnSale && !isSoldOut && <span className="bg-signal text-void font-syne font-bold text-[9px] px-2 py-1 uppercase tracking-widest leading-none">Sale</span>}
                      {isLowStock && <span className="font-dm-mono font-bold text-[9px] px-2 py-1 uppercase tracking-widest leading-none" style={{ backgroundColor: "rgba(192,57,43,0.85)", color: "#fff" }}>Only {totalStock} left</span>}
                    </div>

                    {/* Quick View Button */}
                    {!isSoldOut && (
                    <button
                      onClick={() => setQuickViewProduct(product)}
                      className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 whitespace-nowrap font-dm-mono text-[10px] font-bold tracking-[0.2em] uppercase px-5 py-2.5"
                      style={{ backgroundColor: "rgba(8,8,8,0.9)", color: "#e8e4dc", border: "1px solid rgba(232,228,220,0.3)", backdropFilter: "blur(8px)" }}
                      aria-label={`Quick view ${product.name}`}
                    >
                      + Quick View
                    </button>
                    )}
                  </div>

                  {/* Metadata Block */}
                  <div className="flex flex-col flex-grow">
                    <div className="flex justify-between items-start mb-2">
                      <h2 className="font-syne font-bold text-lg text-salt uppercase tracking-tight group-hover:text-ash transition-colors">
                        <Link href={`/products/${product.slug}`}>
                           {product.name}
                        </Link>
                      </h2>
                      <span className="font-dm-mono text-[9px] text-ash">
                        {String(idx + 1 + (page - 1) * 10).padStart(2, "0")}
                      </span>
                    </div>

                    <div className="flex justify-between items-end mt-auto pt-2">
                      <p className="font-dm-mono text-[10px] text-fog tracking-widest uppercase">
                        {product.category.name}
                      </p>
                      <p className="font-dm-mono text-sm text-salt">
                        {formatPrice(finalPrice)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          </>
        )}

        {/* ─── Pagination ─── */}
        {totalPages > 1 && !loading && (
          <div className="flex items-center justify-center gap-6 mt-24 pt-8 border-t border-ember">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
              const isActive = page === p;
              return (
                <button
                  key={p}
                  onClick={() => updatePage(p)}
                  className={`font-dm-mono text-[10px] uppercase tracking-widest transition-colors ${
                    isActive ? "text-salt border-b border-salt pb-1" : "text-ash hover:text-salt"
                  }`}
                >
                  [ {String(p).padStart(2, "0")} ]
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
