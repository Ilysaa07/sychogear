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
      {/* Images */}
      <div className="space-y-4">
        <div 
          className="aspect-[3/4] bg-brand-900 overflow-hidden cursor-crosshair relative group"
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
                className={`aspect-square bg-brand-900 overflow-hidden border-2 transition-colors ${
                  selectedImage === i ? "border-white" : "border-transparent"
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
      <div className="flex flex-col">
        <p className="text-xs tracking-[0.3em] uppercase text-brand-500 mb-2">
          {product.category.name}
        </p>
        <h1 className="text-3xl md:text-5xl font-bold uppercase tracking-widest mb-4">
          {product.name}
        </h1>

        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl font-bold">
            {formatCurrency(finalPrice)}
          </span>
          {(isOnSale || product.salePrice || product.discountRate > 0) && (
            <span className="text-lg text-brand-500 line-through">
              {formatCurrency(product.price)}
            </span>
          )}
          {(isOnSale || product.discountRate > 0) && (
            <span className="badge bg-red-500/20 text-red-400 text-xs">
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
        <div className="mb-8">
          <p className="text-xs tracking-wider uppercase text-brand-400 mb-3">
            Select Size
          </p>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((variant) => (
              <button
                key={variant.id}
                onClick={() => setSelectedVariant(variant.id)}
                disabled={variant.stock === 0}
                className={`relative px-4 py-2.5 text-sm font-medium border transition-all ${
                  selectedVariant === variant.id
                    ? "border-white bg-white text-black"
                    : variant.stock === 0
                    ? "border-white/5 text-brand-700 cursor-not-allowed line-through"
                    : "border-white/10 text-brand-300 hover:border-white/30"
                }`}
              >
                {variant.size}
                {selectedVariant === variant.id && (
                  <HiCheck className="absolute -top-1 -right-1 w-4 h-4 bg-white text-black rounded-full" />
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
        <div className="mb-8">
          <p className="text-xs tracking-wider uppercase text-brand-400 mb-3">
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

        {/* Add to Cart */}
        <button
          onClick={handleAddToCart}
          disabled={!selectedVariant || !inStock}
          className="btn-primary w-full mb-4"
        >
          {!selectedVariant
            ? "Select a Size"
            : !inStock
            ? "Sold Out"
            : "Add to Cart"}
        </button>

        {/* Description */}
        <div className="mt-8 pt-8 border-t border-white/5">
          <h3 className="text-xs tracking-wider uppercase text-brand-400 mb-3">
            Description
          </h3>
          <p className="text-sm text-brand-300 leading-relaxed whitespace-pre-line">
            {product.description}
          </p>
        </div>
      </div>
    </div>
  );
}
