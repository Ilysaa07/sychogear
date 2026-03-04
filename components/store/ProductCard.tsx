"use client";

import Link from "next/link";
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
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="card card-hover">
        {/* Image */}
        <div className="relative aspect-[3/4] overflow-hidden bg-brand-900">
          <img
            src={mainImage}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {product.isNew && (
              <span className="badge bg-white text-black text-[10px]">NEW</span>
            )}
            {isOnSale && (
              <span className="badge bg-red-500 text-white text-[10px]">SALE</span>
            )}
            {totalStock === 0 && (
              <span className="badge bg-brand-800 text-brand-400 text-[10px]">SOLD OUT</span>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          <p className="text-[10px] text-brand-500 uppercase tracking-[0.2em] mb-1">
            {product.category.name}
          </p>
          <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-brand-400 group-hover:text-white transition-colors truncate mb-2">
            {product.name}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-brand-300 group-hover:text-white transition-colors">
              {formatCurrency(finalPrice)}
            </span>
            {originalPrice && (
              <span className="text-[10px] text-brand-600 line-through">
                {formatCurrency(originalPrice)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
