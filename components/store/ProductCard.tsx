"use client";

import Link from "next/link";
import Image from "next/image";
import { useCurrency } from "@/components/store/CurrencyProvider";
import type { ProductWithRelations } from "@/types";

interface ProductCardProps {
  product: ProductWithRelations;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { formatPrice } = useCurrency();
  const mainImage = product.images[0]?.url || "/placeholder.svg";
  const hoverImage = product.images[1]?.url || null;

  const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
  const isOnSale = product.flashSale?.isActive && product.flashSale.salePrice;
  const displayPrice = isOnSale
    ? product.flashSale!.salePrice
    : product.salePrice || product.price;
  const finalPrice =
    product.discountRate > 0
      ? displayPrice * (1 - product.discountRate / 100)
      : displayPrice;
  const originalPrice =
    isOnSale || product.salePrice || product.discountRate > 0
      ? product.price
      : null;

  const isSoldOut = totalStock === 0;

  return (
    <Link href={`/products/${product.slug}`} className="product-card group block">
      {/* ─── Image Theater ─────────────────────────────────── */}
      <div className="product-card__image-wrapper">
        {/* Sold-out diagonal overlay */}
        {isSoldOut && <div className="product-card__sold-overlay" />}

        {/* Main image */}
        <Image
          src={mainImage}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="product-card__image"
        />

        {/* Hover image (second product image) — crossfades in */}
        {hoverImage && (
          <Image
            src={hoverImage}
            alt={`${product.name} — alternate view`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out"
            style={{ filter: "grayscale(0%) brightness(1)" }}
          />
        )}

        {/* ─── Badges — top left ───────────────────────── */}
        <div
          className="absolute top-3 left-3 z-10 flex flex-col gap-1.5"
          aria-label="Product badges"
        >
          {product.isNew && !isSoldOut && (
            <span className="badge badge-new">New</span>
          )}
          {isOnSale && !isSoldOut && (
            <span className="badge badge-sale">Sale</span>
          )}
          {isSoldOut && (
            <span className="badge badge-sold-out">Sold Out</span>
          )}
        </div>

        {/* ─── Info overlay — bottom, gradient ────────── */}
        <div className="product-card__info">
          <h3 className="product-card__name">{product.name}</h3>

          <div className="flex items-baseline gap-2">
            <span className="product-card__price">
              {formatPrice(finalPrice)}
            </span>
            {originalPrice && (
              <span className="product-card__price-original">
                {formatPrice(originalPrice)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
