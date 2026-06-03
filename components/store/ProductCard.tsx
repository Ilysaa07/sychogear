"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useCallback } from "react";
import { useCurrency } from "@/components/store/CurrencyProvider";
import type { ProductWithRelations } from "@/types";

interface ProductCardProps {
  product: ProductWithRelations;
  idx?: number;
  heroMode?: boolean;
  onQuickView?: (product: ProductWithRelations) => void;
}

export default function ProductCard({ product, idx = 0, heroMode = false, onQuickView }: ProductCardProps) {
  const { formatPrice } = useCurrency();
  const mainImage  = product.images[0]?.url || "/placeholder.svg";
  const hoverImage = product.images[1]?.url || null;

  const totalStock  = product.variants.reduce((sum, v) => sum + v.stock, 0);
  const isOnSale    = product.flashSale?.isActive && product.flashSale.salePrice;
  const displayPrice = isOnSale ? product.flashSale!.salePrice : product.salePrice || product.price;
  const finalPrice   = product.discountRate > 0 ? displayPrice * (1 - product.discountRate / 100) : displayPrice;
  const originalPrice = isOnSale || product.salePrice || product.discountRate > 0 ? product.price : null;
  const isSoldOut   = totalStock === 0;
  const isLowStock  = !isSoldOut && totalStock > 0 && totalStock <= 3;

  const aspectStyle = heroMode
    ? { aspectRatio: "21 / 9" }
    : { aspectRatio: "3 / 4" };

  return (
    <div className="w-full relative group flex flex-col">
      {/* Image Block */}
      <div className="relative w-full aspect-[3/4] overflow-hidden bg-void mb-3">
        <Link href={`/products/${product.slug}`} className="absolute inset-0 z-10" aria-label={product.name} />
        <Image
          src={mainImage}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className={`object-cover ${hoverImage ? "group-hover:opacity-0" : ""}`}
        />
        {hoverImage && (
          <Image 
            src={hoverImage} 
            alt={`${product.name} alternate`} 
            fill 
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" 
            className="object-cover absolute inset-0 opacity-0 group-hover:opacity-100" 
          />
        )}

        {/* Sold Out Overlay */}
        {isSoldOut && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-void/70">
            <span className="font-sans font-black text-salt uppercase tracking-[0.3em] text-sm">SOLD OUT</span>
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
}
