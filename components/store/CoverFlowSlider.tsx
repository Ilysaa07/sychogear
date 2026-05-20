"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCurrency } from "@/components/store/CurrencyProvider";
import { useMagnetic } from "@/hooks/useMagnetic";
import type { ProductWithRelations } from "@/types";

interface Props {
  products: ProductWithRelations[];
  marqueeText?: string;
}

export default function CoverFlowSlider({ products, marqueeText = "SYCHOGEAR WORLDWIDE" }: Props) {
  const { formatPrice } = useCurrency();
  const [activeIndex, setActiveIndex] = useState(0);
  const magPrev = useMagnetic(0.45);
  const magNext = useMagnetic(0.45);

  const nextSlide = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % products.length);
  }, [products.length]);

  const prevSlide = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + products.length) % products.length);
  }, [products.length]);

  if (!products || products.length === 0) return null;

  return (
    <section className="relative w-full bg-black overflow-hidden pt-32 pb-24 flex flex-col items-center">
      
      {/* Marquee Ticker (Moved to top) */}
      {marqueeText && (
        <div 
          className="absolute top-0 left-0 w-full text-black py-2.5 overflow-hidden border-b border-[#222]"
          style={{ backgroundColor: "var(--redline, #c0392b)" }}
        >
          <div className="flex whitespace-nowrap animate-[marquee_25s_linear_infinite]">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center mx-4 font-dm-mono text-[11px] font-bold tracking-[0.2em] uppercase">
                <span className="mr-4 text-black">■</span>
                {marqueeText}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sleek Header */}
      <div className="w-full max-w-[1400px] px-6 md:px-12 mb-16 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 z-10">
        <div>
          <h2 className="font-syne text-salt text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-tighter leading-none">
            Archive
          </h2>
          <p className="font-dm-mono text-salt/50 text-xs md:text-sm tracking-[0.3em] mt-3 uppercase">
            Collection — Series 01
          </p>
        </div>
        
        {/* Minimalist Navigation — Magnetic */}
        <div className="flex gap-3">
          <button 
            ref={magPrev.ref as React.Ref<HTMLButtonElement>}
            onMouseMove={magPrev.onMouseMove as any}
            onMouseLeave={magPrev.onMouseLeave}
            onClick={prevSlide}
            className="w-14 h-14 flex items-center justify-center border border-salt/20 text-salt hover:bg-salt hover:text-[#0a0c0a] transition-colors duration-300"
            aria-label="Previous item"
          >
            <span className="text-xl font-light">←</span>
          </button>
          <button 
            ref={magNext.ref as React.Ref<HTMLButtonElement>}
            onMouseMove={magNext.onMouseMove as any}
            onMouseLeave={magNext.onMouseLeave}
            onClick={nextSlide}
            className="w-14 h-14 flex items-center justify-center border border-salt/20 text-salt hover:bg-salt hover:text-[#0a0c0a] transition-colors duration-300"
            aria-label="Next item"
          >
            <span className="text-xl font-light">→</span>
          </button>
        </div>
      </div>

      {/* Carousel Container */}
      <div className="relative w-full h-[60vh] min-h-[450px] max-h-[700px] flex items-center justify-center perspective-[1200px] mb-12">
        {products.map((product, i) => {
          const isActive = i === activeIndex;
          const isPrev = i === (activeIndex - 1 + products.length) % products.length;
          const isNext = i === (activeIndex + 1) % products.length;

          // Default state for hidden slides
          let transform = "translateX(100%) scale(0.7) rotateY(10deg)";
          let zIndex = 0;
          let opacity = 0;
          let pointerEvents: "auto" | "none" = "none";

          if (isActive) {
            transform = "translateX(0) scale(1) rotateY(0)";
            zIndex = 30;
            opacity = 1;
            pointerEvents = "auto";
          } else if (isPrev) {
            transform = "translateX(-65%) scale(0.8) rotateY(15deg)";
            zIndex = 20;
            opacity = 0.5;
            pointerEvents = "auto"; // Can click to navigate
          } else if (isNext) {
            transform = "translateX(65%) scale(0.8) rotateY(-15deg)";
            zIndex = 20;
            opacity = 0.5;
            pointerEvents = "auto"; // Can click to navigate
          }

          const isOnSale = product.flashSale?.isActive && product.flashSale.salePrice;
          const basePrice = isOnSale ? product.flashSale!.salePrice : product.salePrice || product.price;
          const finalPrice = product.discountRate > 0 ? basePrice * (1 - product.discountRate / 100) : basePrice;

          return (
            <div
              key={product.id || i}
              onClick={() => {
                if (isPrev) prevSlide();
                if (isNext) nextSlide();
              }}
              className="absolute top-0 w-[75vw] sm:w-[50vw] md:w-[35vw] max-w-[450px] h-full transition-all duration-[800ms] ease-[cubic-bezier(0.25,1,0.3,1)]"
              style={{ transform, zIndex, opacity, pointerEvents, cursor: isActive ? "default" : "pointer" }}
            >
              <div className="block w-full h-full relative group">
                {/* Image Wrap */}
                <div className="w-full h-full relative bg-[#111512] overflow-hidden border border-salt/10">
                  {product.images?.[0]?.url ? (
                    <Image
                      src={product.images[0].url}
                      alt={product.name}
                      fill
                      className={`object-cover transition-transform duration-[1500ms] ease-out ${isActive ? "group-hover:scale-105" : ""}`}
                      sizes="(max-width: 768px) 100vw, 50vw"
                      priority={isActive}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-dm-mono text-salt/30">
                      NO IMAGE
                    </div>
                  )}
                  
                  {/* Overlay Action (only visible on active slide hover) */}
                  {isActive && (
                    <Link href={`/products/${product.slug}`} className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-20">
                      <span className="font-dm-mono text-salt text-xs md:text-sm tracking-[0.2em] border border-salt px-8 py-4 bg-black/50 backdrop-blur-md uppercase hover:bg-salt hover:text-black transition-colors duration-300">
                        View Details
                      </span>
                    </Link>
                  )}
                </div>

                {/* Tags */}
                <div className="absolute top-4 left-4 flex flex-col gap-2 z-10 pointer-events-none">
                  {product.isNew && (
                    <span className="font-dm-mono text-[10px] px-3 py-1 bg-salt text-black font-bold uppercase tracking-widest shadow-lg">
                      NEW
                    </span>
                  )}
                  {isOnSale && (
                    <span className="font-dm-mono text-[10px] px-3 py-1 bg-[#ff3333] text-white font-bold uppercase tracking-widest shadow-lg">
                      SALE
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Product Info */}
      <div className="w-full max-w-[1400px] px-6 md:px-12 text-center md:text-left flex flex-col md:flex-row justify-between items-center md:items-end min-h-[80px] z-10">
        {products[activeIndex] && (
          <div className="w-full flex flex-col md:flex-row justify-between items-center md:items-end gap-6" key={activeIndex}>
            
            <div className="text-center md:text-left animate-fade-in" style={{ animationDuration: '600ms' }}>
              <p className="font-dm-mono text-salt/50 text-xs tracking-[0.2em] mb-2">
                {String(activeIndex + 1).padStart(2, "0")} / {String(products.length).padStart(2, "0")}
                <span className="mx-3 opacity-50">|</span>
                {products[activeIndex].category?.name || "ARCHIVE"}
              </p>
              <h3 className="font-syne text-salt text-2xl md:text-3xl font-bold uppercase tracking-wide">
                {products[activeIndex].name}
              </h3>
            </div>

            <div className="flex flex-col items-center md:items-end animate-fade-in" style={{ animationDuration: '600ms', animationDelay: '100ms', animationFillMode: 'both' }}>
              {(() => {
                const p = products[activeIndex];
                const isOnSale = p.flashSale?.isActive && p.flashSale.salePrice;
                const base = isOnSale ? p.flashSale!.salePrice : p.salePrice || p.price;
                const finalPrice = p.discountRate > 0 ? base * (1 - p.discountRate / 100) : base;

                return (
                  <div className="flex flex-col items-center md:items-end gap-1">
                    {isOnSale && p.salePrice && (
                      <span className="font-dm-mono text-[#ff3333] text-sm line-through opacity-80">
                        {formatPrice(p.salePrice)}
                      </span>
                    )}
                    <span className="font-dm-mono text-salt text-xl md:text-2xl font-bold tracking-tight">
                      {formatPrice(finalPrice)}
                    </span>
                  </div>
                );
              })()}
            </div>

          </div>
        )}
      </div>

      {/* Marquee Keyframes */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes fade-in {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in ease-out forwards;
        }
      `}} />
    </section>
  );
}
