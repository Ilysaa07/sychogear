"use client";

import Link from "next/link";
import Image from "next/image";
import { useCurrency } from "@/components/store/CurrencyProvider";
import type { ProductWithRelations } from "@/types";

interface ProductCardProps {
  product: ProductWithRelations;
  idx?: number;
  heroMode?: boolean;
}

export default function ProductCard({ product, idx = 0, heroMode = false }: ProductCardProps) {
  const { formatPrice } = useCurrency();
  const mainImage  = product.images[0]?.url || "/placeholder.svg";
  const hoverImage = product.images[1]?.url || null;

  const totalStock  = product.variants.reduce((sum, v) => sum + v.stock, 0);
  const isOnSale    = product.flashSale?.isActive && product.flashSale.salePrice;
  const displayPrice = isOnSale ? product.flashSale!.salePrice : product.salePrice || product.price;
  const finalPrice   = product.discountRate > 0 ? displayPrice * (1 - product.discountRate / 100) : displayPrice;
  const originalPrice = isOnSale || product.salePrice || product.discountRate > 0 ? product.price : null;
  const isSoldOut   = totalStock === 0;

  const aspectStyle = heroMode
    ? { aspectRatio: "21 / 9" }
    : { aspectRatio: "3 / 4" };

  return (
    <Link href={`/products/${product.slug}`} className="group block w-full h-full relative overflow-hidden bg-abyss">

      {/* ─── Image ──────────────────────────────── */}
      <div
        className="relative w-full overflow-hidden bg-dim transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-[1.02]"
        style={{ ...aspectStyle }}
      >
        {/* Main image */}
        <Image
          src={mainImage}
          alt={product.name}
          fill
          sizes={heroMode ? "100vw" : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"}
          className="object-cover object-center w-full h-full filter brightness-90 contrast-110 grayscale-[10%]"
        />

        {/* Hover image */}
        {hoverImage && (
          <Image
            src={hoverImage}
            alt={`${product.name} — alternate view`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out filter brightness-90 contrast-110 grayscale-[10%]"
          />
        )}

        {/* Sold Out Overlay */}
        {isSoldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-20 backdrop-blur-sm">
            <span className="font-syne font-bold text-white uppercase tracking-[0.3em] text-sm transform -rotate-12">
              Sold Out
            </span>
          </div>
        )}

        {/* Badges — top left */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-2" aria-label="Product badges">
          {product.isNew && !isSoldOut && (
            <span className="bg-salt text-void font-syne font-bold text-[10px] px-2 py-1 uppercase tracking-widest leading-none">
              New
            </span>
          )}
          {isOnSale && !isSoldOut && (
            <span className="bg-signal text-void font-syne font-bold text-[10px] px-2 py-1 uppercase tracking-widest leading-none">
              Sale
            </span>
          )}
        </div>
      </div>

      {/* ─── Info ──────────────────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
        <h3 className="font-syne font-bold text-salt uppercase tracking-widest text-sm mb-1 truncate">
          {product.name}
        </h3>
        <div className="flex items-baseline gap-2 font-dm-mono">
          <span className="text-salt text-xs tracking-wider">{formatPrice(finalPrice)}</span>
          {originalPrice && (
            <span className="text-ash line-through text-[10px] tracking-wider">{formatPrice(originalPrice)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
