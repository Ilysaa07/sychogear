"use client";

import { useState, MouseEvent } from "react";
import { useCartStore } from "@/stores/cart-store";
import { useUIStore } from "@/stores/ui-store";
import { formatCurrency } from "@/lib/utils";
import type { ProductWithRelations } from "@/types";
import toast from "react-hot-toast";
import { HiCheck } from "react-icons/hi";

interface Props {
  product: ProductWithRelations;
}

export default function ProductDetailClient({ product }: Props) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((s) => s.addItem);
  const setCartOpen = useUIStore((s) => s.setCartDrawerOpen);

  // States for magnifying zoom effect
  const [zoomStyle, setZoomStyle] = useState<React.CSSProperties>({});
  const [isZooming, setIsZooming] = useState(false);

  const isOnSale = product.flashSale?.isActive && product.flashSale.salePrice;
  const displayPrice = isOnSale
    ? product.flashSale!.salePrice
    : product.salePrice || product.price;
  
  const finalPrice = product.discountRate > 0 ? displayPrice * (1 - product.discountRate / 100) : displayPrice;

  const selectedVariantData = product.variants.find(
    (v) => v.id === selectedVariant
  );
  const inStock = selectedVariantData ? selectedVariantData.stock > 0 : true;

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    
    setIsZooming(true);
    setZoomStyle({
      transformOrigin: `${x}% ${y}%`,
      transform: "scale(2.5)",
    });
  };

  const handleMouseLeave = () => {
    setIsZooming(false);
    setZoomStyle({
      transformOrigin: "center center",
      transform: "scale(1)",
    });
  };

  const handleAddToCart = () => {
    if (!selectedVariant || !selectedVariantData) {
      toast.error("Pilih ukuran terlebih dahulu");
      return;
    }
    if (!inStock) {
      toast.error("Stok habis untuk ukuran ini");
      return;
    }

    addItem({
      productId: product.id,
      variantId: selectedVariant,
      name: product.name,
      price: product.price,
      salePrice: isOnSale ? product.flashSale!.salePrice : product.salePrice,
      size: selectedVariantData.size,
      quantity,
      image: product.images[0]?.url || "",
      slug: product.slug,
      stock: selectedVariantData.stock,
      ppnRate: product.ppnRate || 0,
      pph23Rate: product.pph23Rate || 0,
      discountRate: product.discountRate || 0,
    });

    toast.success("Ditambahkan ke keranjang!");
    setCartOpen(true);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
      {/* Images - Stealth Minimalist Look */}
      <div className="space-y-4">
        <div 
          className="aspect-[4/5] sm:aspect-[3/4] overflow-hidden cursor-crosshair relative group bg-brand-950 border border-white/5"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <img
            src={product.images[selectedImage]?.url || "/placeholder.svg"}
            alt={product.name}
            style={zoomStyle}
            className={`w-full h-full object-cover transition-transform ${isZooming ? 'duration-100' : 'duration-500 ease-out'}`}
          />
        </div>
        {product.images.length > 1 && (
          <div className="grid grid-cols-4 gap-2">
            {product.images.map((img, i) => (
              <button
                key={img.id}
                onClick={() => setSelectedImage(i)}
                className={`aspect-square bg-brand-950 overflow-hidden border border-white/5 transition-all duration-300 ${
                  selectedImage === i ? "opacity-100 ring-1 ring-white/30" : "opacity-40 hover:opacity-100"
                }`}
              >
                <img
                  src={img.url}
                  alt={img.alt || product.name}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col py-4">
        <p className="text-[10px] tracking-[0.4em] uppercase text-brand-400 mb-3 font-medium">
          {product.category.name}
        </p>
        <h1 className="text-3xl md:text-5xl lg:text-6xl font-semibold uppercase tracking-[0.1em] mb-6 leading-tight text-white drop-shadow-sm">
          {product.name}
        </h1>

        <div className="flex flex-wrap items-center gap-4 mb-3">
          <span className="text-2xl md:text-3xl font-medium tracking-widest text-white">
            {formatCurrency(finalPrice)}
          </span>
          {(isOnSale || product.salePrice || product.discountRate > 0) && (
            <span className="text-base text-brand-500 line-through tracking-wider">
              {formatCurrency(product.price)}
            </span>
          )}
          {(isOnSale || product.discountRate > 0) && (
            <span className="backdrop-blur-md bg-red-600/20 border border-red-600/30 text-white text-[10px] font-medium px-2.5 py-1 uppercase tracking-[0.2em]">
              {isOnSale ? "FLASH SALE" : `${product.discountRate}% OFF`}
            </span>
          )}
        </div>

        {product.ppnRate > 0 && (
          <p className="text-[10px] text-brand-500 mb-6 italic uppercase tracking-widest">
            * Harga belum termasuk PPN {product.ppnRate}%
          </p>
        )}

        {/* Size Selector */}
        <div className="mb-10">
          <p className="text-[10px] tracking-[0.3em] uppercase text-brand-500 mb-4 font-semibold">
            Select Size
          </p>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((variant) => (
              <button
                key={variant.id}
                onClick={() => setSelectedVariant(variant.id)}
                disabled={variant.stock === 0}
                className={`relative px-5 py-3 text-sm font-medium transition-all duration-300 ${
                  selectedVariant === variant.id
                    ? "bg-white text-black border border-white"
                    : variant.stock === 0
                    ? "bg-black/20 border border-white/5 text-brand-800 cursor-not-allowed line-through"
                    : "bg-brand-950 border border-white/10 text-brand-300 hover:border-white/30 hover:text-white"
                }`}
              >
                {variant.size}
                {selectedVariant === variant.id && (
                  <HiCheck className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-black text-white border border-white rounded-full p-0.5 shadow-sm" />
                )}
              </button>
            ))}
          </div>
          {selectedVariantData && (
            <p className="text-xs text-brand-500 mt-2">
              {selectedVariantData.stock > 0
                ? `${selectedVariantData.stock} tersisa`
                : "Stok habis"}
            </p>
          )}
        </div>

        {/* Quantity */}
        <div className="mb-12">
          <p className="text-[10px] tracking-[0.3em] uppercase text-brand-500 mb-4 font-semibold">
            Quantity
          </p>
          <div className="inline-flex items-center border border-white/10">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="px-4 py-2.5 text-brand-400 hover:text-white transition-colors"
            >
              −
            </button>
            <span className="px-4 py-2.5 text-sm font-medium min-w-[3rem] text-center">
              {quantity}
            </span>
            <button
              onClick={() =>
                setQuantity(
                  Math.min(quantity + 1, selectedVariantData?.stock || 10)
                )
              }
              className="px-4 py-2.5 text-brand-400 hover:text-white transition-colors"
            >
              +
            </button>
          </div>
        </div>

        {/* Add to Cart - Bold "Drop" Button */}
        <button
          onClick={handleAddToCart}
          disabled={!selectedVariant || !inStock}
          className="w-full py-5 px-8 bg-white text-black font-bold text-[11px] md:text-sm tracking-[0.3em] uppercase transition-all duration-300 hover:bg-black hover:text-white hover:border-white border border-transparent disabled:opacity-50 disabled:cursor-not-allowed mb-6 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-none"
        >
          {!selectedVariant
            ? "SELECT A SIZE"
            : !inStock
            ? "SOLD OUT"
            : "ADD TO CART"}
        </button>

        {/* Description */}
        <div className="mt-4 pt-8 border-t border-white/5">
          <h3 className="text-[10px] tracking-[0.3em] uppercase text-brand-500 mb-4 font-semibold">
            Description
          </h3>
          <p className="text-sm text-brand-300 leading-relaxed font-light whitespace-pre-line tracking-wide">
            {product.description}
          </p>
        </div>
      </div>
    </div>
  );
}
