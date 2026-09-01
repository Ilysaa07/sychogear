"use client";

import { useState, useEffect } from "react";
import { useCartStore } from "@/stores/cart-store";
import { useUIStore } from "@/stores/ui-store";
import { useCurrency } from "@/components/store/CurrencyProvider";
import { useTranslation } from "@/components/store/LanguageProvider";
import type { ProductWithRelations } from "@/types";
import Link from "next/link";
import toast from "react-hot-toast";
import Image from "next/image";

interface Props {
  product: ProductWithRelations;
}

export default function ProductDetailClient({ product }: Props) {
  const { formatPrice } = useCurrency();
  const { t } = useTranslation();
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [addPressed, setAddPressed] = useState(false);
  const [showStickyATC, setShowStickyATC] = useState(false);

  const addItem  = useCartStore((s) => s.addItem);
  const setCartOpen = useUIStore((s) => s.setCartDrawerOpen);

  const isOnSale     = product.flashSale?.isActive && product.flashSale.salePrice;
  const displayPrice = isOnSale ? product.flashSale!.salePrice : product.salePrice || product.price;
  const finalPrice   = product.discountRate > 0 ? displayPrice * (1 - product.discountRate / 100) : displayPrice;

  const sizeOrder = ["XS", "S", "M", "L", "XL", "XXL", "2XL", "3XL", "4XL", "ALL SIZE", "ONE SIZE"];
  const sortedVariants = [...product.variants].sort((a, b) => {
    const indexA = sizeOrder.indexOf(a.size.toUpperCase());
    const indexB = sizeOrder.indexOf(b.size.toUpperCase());
    if (indexA === -1 && indexB === -1) return a.size.localeCompare(b.size);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  const selectedVariantData = sortedVariants.find((v) => v.id === selectedVariant);
  const inStock = selectedVariantData ? selectedVariantData.stock > 0 : true;

  useEffect(() => {
    const handleScroll = () => {
      const btn = document.getElementById("main-atc-btn");
      if (btn) {
        const rect = btn.getBoundingClientRect();
        setShowStickyATC(rect.top < 0);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleAddToCart = () => {
    if (!selectedVariant || !selectedVariantData) {
      toast.error(t("product.selectSize"));
      return;
    }
    if (!inStock) { toast.error(t("product.soldOut")); return; }
    setAddPressed(true);
    setTimeout(() => setAddPressed(false), 150);
    addItem({
      productId:    product.id,
      variantId:    selectedVariant,
      name:         product.name,
      price:        product.price,
      salePrice:    isOnSale ? product.flashSale!.salePrice : product.salePrice,
      size:         selectedVariantData.size,
      quantity:     1,
      image:        product.images[0]?.url || "",
      slug:         product.slug,
      stock:        selectedVariantData.stock,
      ppnRate:      product.ppnRate || 0,
      pph23Rate:    product.pph23Rate || 0,
      discountRate: product.discountRate || 0,
    });
    toast.success(t("product.added"));
    setCartOpen(true);
  };

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-12 lg:items-start text-salt pt-12 pb-24">

        {/* LEFT — Images Stack (No Thumbnails) */}
        <div className="w-full lg:w-[60%] flex flex-col gap-1 sm:gap-4">
          {product.images.map((img, i) => (
            <div key={img.id} className="relative w-full aspect-[3/4] bg-dim">
              <Image
                src={img.url}
                alt={`${product.name} - View ${i + 1}`}
                fill
                priority={i === 0}
                className="w-full h-full object-cover filter brightness-90 contrast-110 grayscale-[10%]"
              />
            </div>
          ))}
        </div>

        {/* RIGHT — Sticky Product Info */}
        <div className="w-full lg:w-[40%] lg:sticky top-[102px] self-start">
          
          <div className="mb-8">
            <h1 className="font-sans font-bold text-xl uppercase leading-none mb-3 tracking-tight">
              {product.name}
            </h1>
            <div className="flex items-baseline gap-3">
              <p className="font-sans font-bold text-xl text-signal">
                {formatPrice(finalPrice)}
              </p>
              {/* Show original price crossed out if there's a discount */}
              {(isOnSale || product.salePrice || product.discountRate > 0) && finalPrice < product.price && (
                <p className="font-sans text-sm text-ash line-through">
                  {formatPrice(product.price)}
                </p>
              )}
              {/* Show discount badge */}
              {product.discountRate > 0 && (
                <span className="text-[10px] font-bold bg-signal text-void px-2 py-0.5 uppercase tracking-wider">
                  -{product.discountRate}%
                </span>
              )}
            </div>
          </div>

          {/* Size Grid */}
          <div className="mb-6">
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-1">
              {sortedVariants.map((variant) => {
                const isSelected = selectedVariant === variant.id;
                const oos = variant.stock === 0;
                return (
                  <button
                    key={variant.id}
                    onClick={() => !oos && setSelectedVariant(variant.id)}
                    disabled={oos}
                    className={`relative flex items-center justify-center h-10 font-sans font-bold text-[10px] tracking-widest uppercase transition-none ${
                      isSelected
                        ? "bg-white text-black"
                        : oos
                        ? "bg-transparent text-dim border-2 border-dim cursor-not-allowed"
                        : "bg-transparent text-white border-2 border-ember hover:bg-white hover:text-black"
                    }`}
                  >
                    {oos && (
                      <div className="absolute inset-0 flex items-center justify-center overflow-hidden opacity-20 pointer-events-none">
                        <div className="w-full h-px bg-salt transform rotate-45" />
                      </div>
                    )}
                    {variant.size}
                  </button>
                );
              })}
            </div>
            {selectedVariantData && selectedVariantData.stock > 0 && selectedVariantData.stock <= 3 && (
              <p className="mt-3 font-sans font-bold text-[8px] text-signal uppercase tracking-widest">
                {t("product.onlyLeft").replace("{count}", String(selectedVariantData.stock)).replace("{size}", selectedVariantData.size)}
              </p>
            )}
          </div>

          {/* Add to Cart Button */}
          <button
            id="main-atc-btn"
            onClick={handleAddToCart}
            disabled={!selectedVariant || !inStock}
            className={`w-full h-12 font-sans font-bold text-[10px] tracking-[0.2em] uppercase transition-none border-2 border-transparent ${
              !selectedVariant || !inStock
                ? "bg-dim text-ash cursor-not-allowed"
                : "bg-white text-black hover:bg-black hover:text-white hover:border-white"
            }`}
          >
            {!selectedVariant ? t("product.selectSizeBtn") : !inStock ? t("product.soldOut") : t("product.addToCart")}
          </button>

          {/* Raw Description Block */}
          <div className="mt-12 space-y-6 font-sans font-bold text-[10px] text-ash leading-relaxed tracking-wide">
            <div dangerouslySetInnerHTML={{ __html: product.description }} />
            
            {product.careInstructions && (
              <div className="pt-6 border-t-2 border-ember">
                <p className="font-sans font-bold text-salt uppercase tracking-widest mb-2 text-[8px]">{t("product.care")}</p>
                <p>{product.careInstructions}</p>
              </div>
            )}
            
            {product.materials && (
              <div className="pt-6 border-t-2 border-ember">
                <p className="font-sans font-bold text-salt uppercase tracking-widest mb-2 text-[8px]">{t("product.material")}</p>
                <p>{product.materials}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Sticky Mobile CTA ─── */}
      {showStickyATC && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-void border-t-2 border-salt p-4 flex items-center gap-3">
          <div className="flex-1 flex gap-1 overflow-x-auto hide-scrollbar">
            {sortedVariants.map((v) => {
              const isSelected = selectedVariant === v.id;
              const oos = v.stock === 0;
              return (
                <button
                  key={v.id}
                  onClick={() => !oos && setSelectedVariant(v.id)}
                  disabled={oos}
                  className={`flex-shrink-0 h-10 px-4 font-sans font-bold text-[8px] tracking-widest uppercase transition-none border-2 ${
                    isSelected
                      ? "bg-white text-black border-white"
                      : oos
                      ? "bg-transparent text-dim border-dim cursor-not-allowed"
                      : "bg-transparent text-white border-ember hover:bg-white hover:text-black"
                  }`}
                >
                  {v.size}
                </button>
              );
            })}
          </div>
          <button
            onClick={handleAddToCart}
            disabled={!selectedVariant || !inStock}
            className={`h-10 px-6 font-sans font-bold text-[8px] tracking-widest uppercase flex-shrink-0 border-2 border-transparent ${
              !selectedVariant || !inStock
                ? "bg-dim text-ash cursor-not-allowed"
                : "bg-white text-black hover:bg-black hover:text-white hover:border-white"
            }`}
          >
            {inStock ? t("product.add") : t("product.out")}
          </button>
        </div>
      )}
    </>
  );
}
