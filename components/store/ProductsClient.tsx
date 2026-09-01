"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useCurrency } from "@/components/store/CurrencyProvider";
import { useTranslation } from "@/components/store/LanguageProvider";
import QuickViewModal from "@/components/store/QuickViewModal";
import Sidebar from "@/components/store/Sidebar";
import type { ProductWithRelations } from "@/types";

interface ProductsClientProps {
  initialProducts: ProductWithRelations[];
  totalPages: number;
  currentPage: number;
}

export default function ProductsClient({
  initialProducts,
  totalPages,
  currentPage,
}: ProductsClientProps) {
  const { formatPrice } = useCurrency();
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [quickViewProduct, setQuickViewProduct] = useState<ProductWithRelations | null>(null);

  const updatePage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`/?${params.toString()}`, { scroll: true });
  };

  return (
    <div className="relative min-h-screen bg-void pt-0 pb-24">
      <QuickViewModal product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />
      
      <div className="container-main flex flex-col md:flex-row gap-8 md:gap-16 -mt-4">
        {/* ─── Sidebar Categories ─── */}
        <Sidebar />

        {/* ─── Editorial Grid ─── */}
        <div className="flex-1 min-w-0">
          {initialProducts.length === 0 ? (
            <div className="flex justify-center py-32 text-center">
              <p className="font-sans font-bold text-xs text-ash uppercase tracking-widest">{t("home.empty")}</p>
            </div>
          ) : (
            <>
              {/* ─── Grid ─── */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 sm:gap-x-8 md:gap-x-12 lg:gap-x-16 gap-y-6 md:gap-y-8 lg:gap-y-10">
              {initialProducts.map((product) => {
                const isOnSale = product.flashSale?.isActive && product.flashSale.salePrice;
                const displayPrice = isOnSale ? product.flashSale!.salePrice : product.salePrice || product.price;
                const finalPrice = product.discountRate > 0 ? displayPrice * (1 - product.discountRate / 100) : displayPrice;
                const totalStock = product.variants.reduce((s, v) => s + v.stock, 0);
                const isSoldOut = totalStock === 0;

                return (
                  <div key={product.id} className="w-full relative group flex flex-col">
                    {/* Image Block */}
                    <div className="relative w-full aspect-[3/4] overflow-hidden bg-void mb-3">
                      <Link href={`/products/${product.slug}`} className="absolute inset-0 z-10" aria-label={product.name} />
                      <Image
                        src={product.images[0]?.url || "/placeholder.svg"}
                        alt={product.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className={`object-cover ${product.images.length > 1 ? "group-hover:opacity-0" : ""}`}
                      />
                      {product.images.length > 1 && (
                        <Image 
                          src={product.images[1]?.url} 
                          alt={`${product.name} alternate`} 
                          fill 
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" 
                          className="object-cover absolute inset-0 opacity-0 group-hover:opacity-100" 
                        />
                      )}

                      {/* Sold Out Overlay */}
                      {isSoldOut && (
                        <div className="absolute inset-0 z-20 flex items-center justify-center bg-void/70">
                          <span className="font-sans font-black text-salt uppercase tracking-[0.3em] text-sm">{t("product.soldOut")}</span>
                        </div>
                      )}
                    </div>

                    {/* Metadata Block */}
                    <div className="flex flex-col items-center text-center flex-grow">
                      <h2 className="font-sans font-bold text-xs text-salt uppercase tracking-tight truncate hover:text-signal transition-none mb-1">
                        <Link href={`/products/${product.slug}`}>
                          {product.name}
                        </Link>
                      </h2>
                      <p className="font-sans font-bold text-[10px] text-signal">
                        {formatPrice(finalPrice)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            </>
          )}

          {/* ─── Pagination ─── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-16 pt-8 border-t-2 border-salt">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                const isActive = currentPage === p;
                return (
                  <button
                    key={p}
                    onClick={() => updatePage(p)}
                    className={`font-sans font-bold text-sm uppercase tracking-widest transition-none px-3 py-1 border-2 ${
                      isActive ? "text-void bg-salt border-salt" : "text-salt bg-void border-salt hover:bg-signal hover:border-signal"
                    }`}
                  >
                    {String(p).padStart(2, "0")}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
