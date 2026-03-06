"use client";

import Link from "next/link";
import Image from "next/image";
import { formatCurrency } from "@/lib/utils";
import type { ProductWithRelations } from "@/types";

interface ProductCardProps {
  product: ProductWithRelations;
}

export default function ProductCard({ product }: ProductCardProps) {
  const mainImage = product.images[0]?.url || "/placeholder.svg";
  const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
  const isOnSale = product.flashSale?.isActive && product.flashSale.salePrice;
  const displayPrice = isOnSale ? product.flashSale!.salePrice : product.salePrice || product.price;
  const finalPrice = product.discountRate > 0 ? displayPrice * (1 - product.discountRate / 100) : displayPrice;
  const originalPrice = (isOnSale || product.salePrice || product.discountRate > 0) ? product.price : null;
  const hasMultiplePriceDeductions = product.discountRate > 0 && (isOnSale || product.salePrice);

  return (
    <Link href={`/products/${product.slug}`} className="group block h-full">
      {/* Elegant & minimal container */}
      <div className="relative h-full aspect-[4/5] sm:aspect-[3/4] overflow-hidden bg-brand-950 border border-white/5 group-hover:border-white/20 transition-all duration-700">
        
        {/* Main Image - Optimized with next/image */}
        <Image
          src={mainImage}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover opacity-90 group-hover:opacity-100 transition-all duration-1000 group-hover:scale-110"
        />

        {/* Elegant Dark Overlay Gradient - Very smooth transition */}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-950 via-brand-950/40 to-transparent opacity-90 transition-opacity duration-700" />
        
        {/* Subtle Ambient Hover Glow (from bottom instead of harsh line) */}
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-red-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

        {/* Badges - Minimalist glassmorphism */}
        <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
          {product.isNew && (
            <span className="backdrop-blur-md bg-white/10 border border-white/10 text-white text-[9px] font-medium px-2 py-1 uppercase tracking-[0.2em]">NEW</span>
          )}
          {isOnSale && (
            <span className="backdrop-blur-md bg-red-600/20 border border-red-600/30 text-white text-[9px] font-medium px-2 py-1 uppercase tracking-[0.2em]">SALE</span>
          )}
          {totalStock === 0 && (
            <span className="backdrop-blur-md bg-black/40 border border-white/10 text-brand-400 text-[9px] font-medium px-2 py-1 uppercase tracking-[0.2em]">SOLD OUT</span>
          )}
        </div>

        {/* Floating Content - Clean, spaced out, high-end editorial feel */}
        <div className="absolute bottom-0 left-0 right-0 p-6 z-10 flex flex-col justify-end transform translate-y-1 group-hover:translate-y-0 transition-transform duration-700">
          <div className="overflow-hidden mb-1">
            <p className="text-[9px] text-brand-400 font-medium uppercase tracking-[0.4em] transform translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out">
              {product.category.name}
            </p>
          </div>
          
          <h3 className="text-sm md:text-base font-semibold uppercase tracking-[0.1em] text-white line-clamp-2 mb-3">
            {product.name}
          </h3>
          
          <div className="flex items-center gap-3 mt-auto">
            <span className="text-sm md:text-base text-white font-medium tracking-widest">
              {formatCurrency(finalPrice)}
            </span>
            {originalPrice && (
              <span className="text-[10px] text-brand-500 line-through">
                {formatCurrency(originalPrice)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
