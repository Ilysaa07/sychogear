"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCurrency } from "@/components/store/CurrencyProvider";
import { useCartStore } from "@/stores/cart-store";
import type { ProductWithRelations } from "@/types";

interface QuickViewModalProps {
  product: ProductWithRelations | null;
  onClose: () => void;
}

export default function QuickViewModal({ product, onClose }: QuickViewModalProps) {
  const { formatPrice } = useCurrency();
  const addItem = useCartStore((s) => s.addItem);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);

  useEffect(() => {
    if (product) {
      setSelectedVariant(null);
      setAdded(false);
      setImgIdx(0);
      document.body.style.overflow = "hidden";
    }
    return () => { document.body.style.overflow = ""; };
  }, [product]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  if (!product) return null;

  const isOnSale = product.flashSale?.isActive && product.flashSale.salePrice;
  const displayPrice = isOnSale ? product.flashSale!.salePrice : product.salePrice || product.price;
  const finalPrice = product.discountRate > 0 ? displayPrice * (1 - product.discountRate / 100) : displayPrice;
  const originalPrice = isOnSale || product.salePrice || product.discountRate > 0 ? product.price : null;
  const images = product.images ?? [];
  const sizeVariants = product.variants.filter(v => v.size);
  const totalStock = product.variants.reduce((s, v) => s + v.stock, 0);
  const isSoldOut = totalStock === 0;
  const isLowStock = !isSoldOut && totalStock <= 3;

  const handleAddToCart = () => {
    if (sizeVariants.length > 0 && !selectedVariant) return;
    const variant = sizeVariants.find(v => v.id === selectedVariant) || product.variants[0];
    if (!variant) return;

    addItem({
      variantId: variant.id,
      productId: product.id,
      name: product.name,
      price: product.price,
      salePrice: product.salePrice ?? undefined,
      size: variant.size || "ONE SIZE",
      quantity: 1,
      image: images[0]?.url || "",
      slug: product.slug,
      stock: variant.stock,
      ppnRate: product.ppnRate ?? 0,
      pph23Rate: product.pph23Rate ?? 0,
      discountRate: product.discountRate ?? 0,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  const canAddToCart = sizeVariants.length === 0 || !!selectedVariant;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[200] bg-void/80 backdrop-blur-sm"
        style={{ animation: "fadeInOverlay 300ms ease forwards" }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className="fixed inset-0 z-[201] flex items-center justify-center p-4 sm:p-8 pointer-events-none"
        role="dialog"
        aria-modal="true"
        aria-label={`Quick view: ${product.name}`}
      >
        <div
          className="relative w-full max-w-3xl pointer-events-auto flex flex-col md:flex-row overflow-hidden"
          style={{
            background: "#0a0a0a",
            border: "1px solid rgba(232,228,220,0.1)",
            maxHeight: "90vh",
            animation: "qvSlideIn 400ms cubic-bezier(0.25,1,0.5,1) forwards",
          }}
        >
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-9 h-9 flex items-center justify-center text-white/50 hover:text-white transition-colors duration-200"
            style={{ fontFamily: "monospace", fontSize: "1.6rem", lineHeight: 1 }}
            aria-label="Close quick view"
          >
            ×
          </button>

          {/* Left: Image */}
          <div className="w-full md:w-1/2 flex-shrink-0 relative" style={{ minHeight: "280px" }}>
            <div className="relative w-full h-full" style={{ aspectRatio: "3/4", minHeight: "280px" }}>
              {images.length > 0 ? (
                <Image
                  src={images[imgIdx]?.url || images[0].url}
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover object-center"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ background: "#111" }}>
                  <span className="font-dm-mono text-xs" style={{ color: "rgba(232,228,220,0.3)" }}>NO IMAGE</span>
                </div>
              )}
              {/* Sold Out overlay on image */}
              {isSoldOut && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-void/50 backdrop-blur-[2px]">
                  <span className="font-syne font-bold text-white uppercase tracking-[0.3em] text-sm -rotate-12">Sold Out</span>
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
                {images.slice(0, 4).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setImgIdx(i)}
                    className="w-2 h-2 transition-all duration-200"
                    style={{ background: i === imgIdx ? "#e8e4dc" : "rgba(232,228,220,0.3)" }}
                    aria-label={`Image ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right: Info */}
          <div className="w-full md:w-1/2 flex flex-col justify-between p-6 md:p-8 overflow-y-auto">
            <div>
              {product.category?.name && (
                <p className="font-dm-mono text-[10px] tracking-[0.3em] uppercase mb-3" style={{ color: "#c8a96e" }}>
                  {product.category.name}
                </p>
              )}
              <h2 className="font-syne font-bold text-xl uppercase text-white mb-4 leading-tight tracking-tight">
                {product.name}
              </h2>
              <div className="flex items-baseline gap-3 mb-4">
                <span className="font-dm-mono text-lg font-bold text-white">{formatPrice(finalPrice)}</span>
                {originalPrice && (
                  <span className="font-dm-mono text-sm line-through" style={{ color: "rgba(232,228,220,0.4)" }}>
                    {formatPrice(originalPrice)}
                  </span>
                )}
              </div>

              {/* Stock status indicator */}
              {isSoldOut ? (
                <p className="font-dm-mono text-[10px] uppercase tracking-[0.2em] mb-5 px-3 py-2 text-center"
                  style={{ background: "rgba(192,57,43,0.15)", color: "#e05c4a", border: "1px solid rgba(192,57,43,0.3)" }}>
                  — Sold Out —
                </p>
              ) : isLowStock ? (
                <p className="font-dm-mono text-[10px] uppercase tracking-[0.2em] mb-5"
                  style={{ color: "#c0392b" }}>
                  ⚠ Only {totalStock} left
                </p>
              ) : <div className="mb-5" />}

              {sizeVariants.length > 0 && (
                <div className="mb-6">
                  <p className="font-dm-mono text-[10px] tracking-[0.2em] uppercase mb-3" style={{ color: "rgba(232,228,220,0.5)" }}>
                    Select Size
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {sizeVariants.map((variant) => {
                      const outOfStock = variant.stock === 0;
                      const isSelected = selectedVariant === variant.id;
                      return (
                        <button
                          key={variant.id}
                          onClick={() => !outOfStock && setSelectedVariant(variant.id)}
                          disabled={outOfStock}
                          className="font-dm-mono text-[11px] uppercase tracking-wider px-3 py-2 transition-all duration-200"
                          style={{
                            border: isSelected ? "1px solid #e8e4dc" : "1px solid rgba(232,228,220,0.2)",
                            color: outOfStock ? "rgba(232,228,220,0.2)" : isSelected ? "#000" : "#e8e4dc",
                            background: isSelected ? "#e8e4dc" : "transparent",
                            cursor: outOfStock ? "not-allowed" : "pointer",
                            textDecoration: outOfStock ? "line-through" : "none",
                          }}
                        >
                          {variant.size}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {product.description && (
                <p className="font-dm-mono text-[11px] leading-relaxed mb-6 line-clamp-3" style={{ color: "rgba(232,228,220,0.45)" }}>
                  {product.description}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleAddToCart}
                disabled={!canAddToCart}
                className="w-full py-4 font-syne font-bold text-xs uppercase tracking-[0.25em] transition-all duration-300"
                style={{
                  background: added ? "#2e7d52" : !canAddToCart ? "rgba(232,228,220,0.1)" : "#e8e4dc",
                  color: added ? "#fff" : !canAddToCart ? "rgba(232,228,220,0.3)" : "#080808",
                  cursor: !canAddToCart ? "not-allowed" : "pointer",
                }}
              >
                {added ? "✓ Added to Cart" : !canAddToCart ? "Select a Size" : "Add to Cart"}
              </button>

              <Link
                href={`/products/${product.slug}`}
                onClick={onClose}
                className="w-full py-3 font-dm-mono text-[10px] uppercase tracking-[0.2em] text-center transition-colors duration-200"
                style={{ border: "1px solid rgba(232,228,220,0.15)", color: "rgba(232,228,220,0.5)" }}
              >
                View Full Details →
              </Link>
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes qvSlideIn {
          0% { opacity: 0; transform: translateY(24px) scale(0.98); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes fadeInOverlay {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
      `}} />
    </>
  );
}
