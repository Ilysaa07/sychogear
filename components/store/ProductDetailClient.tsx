"use client";

import { useState, useEffect } from "react";
import { useCartStore } from "@/stores/cart-store";
import { useUIStore } from "@/stores/ui-store";
import { useCurrency } from "@/components/store/CurrencyProvider";
import type { ProductWithRelations } from "@/types";
import Link from "next/link";
import toast from "react-hot-toast";
import Image from "next/image";

interface Props {
  product: ProductWithRelations;
}

export default function ProductDetailClient({ product }: Props) {
  const { formatPrice } = useCurrency();
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [addPressed, setAddPressed] = useState(false);
  const [showStickyATC, setShowStickyATC] = useState(false);

  const addItem  = useCartStore((s) => s.addItem);
  const setCartOpen = useUIStore((s) => s.setCartDrawerOpen);

  const isOnSale     = product.flashSale?.isActive && product.flashSale.salePrice;
  const displayPrice = isOnSale ? product.flashSale!.salePrice : product.salePrice || product.price;
  const finalPrice   = product.discountRate > 0 ? displayPrice * (1 - product.discountRate / 100) : displayPrice;

  const selectedVariantData = product.variants.find((v) => v.id === selectedVariant);
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
      toast.error("Select a size.");
      return;
    }
    if (!inStock) { toast.error("Sold out."); return; }
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
    toast.success("Added.");
    setCartOpen(true);
  };

  return (
    <div className="relative min-h-screen bg-[#111512] text-salt pb-24" style={{ paddingTop: "100px" }}>
      
      {/* ─── Supreme-style Top Navigation ─── */}
      <nav className="container-main mb-8">
        <Link href="/products" className="font-dm-mono text-xs uppercase tracking-widest text-ash hover:text-salt transition-colors">
          &larr; Back to Archive
        </Link>
      </nav>

      {/* Layout */}
      <div className="container-main flex flex-col lg:flex-row gap-6 lg:gap-12 lg:items-start">

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
        <div className="w-full lg:w-[40%] lg:sticky" style={{ top: "100px" }}>
          
          <div className="mb-8">
            <h1 className="font-syne font-bold text-3xl sm:text-4xl uppercase leading-none mb-2 tracking-tight">
              {product.name}
            </h1>
            <p className="font-dm-mono text-lg text-ash">
              {formatPrice(finalPrice)}
            </p>
          </div>

          {/* Size Grid */}
          <div className="mb-6">
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-1">
              {product.variants.map((variant) => {
                const isSelected = selectedVariant === variant.id;
                const oos = variant.stock === 0;
                return (
                  <button
                    key={variant.id}
                    onClick={() => !oos && setSelectedVariant(variant.id)}
                    disabled={oos}
                    className={`relative flex items-center justify-center h-12 font-syne font-bold text-xs tracking-widest uppercase transition-colors ${
                      isSelected
                        ? "bg-salt text-[#111512]"
                        : oos
                        ? "bg-transparent text-dim border border-dim cursor-not-allowed"
                        : "bg-transparent text-salt border border-ember hover:border-salt"
                    }`}
                  >
                    {oos && (
                      <div className="absolute inset-0 flex items-center justify-center overflow-hidden opacity-20">
                        <div className="w-full h-px bg-salt transform rotate-45" />
                      </div>
                    )}
                    {variant.size}
                  </button>
                );
              })}
            </div>
            {selectedVariantData && selectedVariantData.stock > 0 && selectedVariantData.stock <= 3 && (
              <p className="mt-3 font-dm-mono text-[10px] text-signal uppercase tracking-widest">
                Only {selectedVariantData.stock} left in {selectedVariantData.size}
              </p>
            )}
          </div>

          {/* Add to Cart Button */}
          <button
            id="main-atc-btn"
            onClick={handleAddToCart}
            disabled={!selectedVariant || !inStock}
            className={`w-full h-14 font-syne font-bold text-sm tracking-[0.2em] uppercase transition-transform duration-100 ${
              !selectedVariant || !inStock
                ? "bg-dim text-ash cursor-not-allowed"
                : "bg-salt text-[#111512] hover:bg-[#e6e6e6]"
            }`}
            style={{ transform: addPressed ? "scale(0.98)" : "scale(1)" }}
          >
            {!selectedVariant ? "Select Size" : !inStock ? "Sold Out" : "Add to Cart"}
          </button>

          {/* Raw Description Block */}
          <div className="mt-12 space-y-6 font-dm-mono text-xs text-ash leading-relaxed tracking-wide">
            <div dangerouslySetInnerHTML={{ __html: product.description }} />
            
            {product.careInstructions && (
              <div className="pt-6 border-t border-ember">
                <p className="font-syne font-bold text-salt uppercase tracking-widest mb-2 text-[10px]">Care</p>
                <p>{product.careInstructions}</p>
              </div>
            )}
            
            {product.materials && (
              <div className="pt-6 border-t border-ember">
                <p className="font-syne font-bold text-salt uppercase tracking-widest mb-2 text-[10px]">Material</p>
                <p>{product.materials}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Sticky Mobile CTA ─── */}
      {showStickyATC && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#111512] border-t border-ember p-4 flex items-center gap-3 fade-in">
          <div className="flex-1 flex gap-1 overflow-x-auto hide-scrollbar">
            {product.variants.map((v) => {
              const isSelected = selectedVariant === v.id;
              const oos = v.stock === 0;
              return (
                <button
                  key={v.id}
                  onClick={() => !oos && setSelectedVariant(v.id)}
                  disabled={oos}
                  className={`flex-shrink-0 h-10 px-4 font-syne font-bold text-[10px] tracking-widest uppercase transition-colors ${
                    isSelected
                      ? "bg-salt text-[#111512]"
                      : oos
                      ? "bg-transparent text-dim border border-dim"
                      : "bg-transparent text-salt border border-ember"
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
            className={`h-10 px-6 font-syne font-bold text-[10px] tracking-widest uppercase flex-shrink-0 ${
              !selectedVariant || !inStock
                ? "bg-dim text-ash cursor-not-allowed"
                : "bg-salt text-[#111512]"
            }`}
          >
            {inStock ? "Add" : "Out"}
          </button>
        </div>
      )}
    </div>
  );
}
