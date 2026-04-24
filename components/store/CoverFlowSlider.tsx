"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCurrency } from "@/components/store/CurrencyProvider";
import type { ProductWithRelations } from "@/types";

interface Props {
  products: ProductWithRelations[];
}

export default function CoverFlowSlider({ products }: Props) {
  const { formatPrice } = useCurrency();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!scrollRef.current) return;
      const scrollLeft = scrollRef.current.scrollLeft;
      const itemWidth = scrollRef.current.offsetWidth * 0.75; // roughly 75vw per item + gap
      const newIndex = Math.round(scrollLeft / itemWidth);
      setActiveIndex(newIndex);
    };

    const container = scrollRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll, { passive: true });
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, []);

  if (!products || products.length === 0) return null;

  return (
    <div className="w-full relative overflow-hidden bg-[#111512] py-12 lg:py-24 border-y border-ember">
      
      {/* Massive Background Typography (Subtle) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden z-0">
        <h2 
          className="font-syne font-bold text-salt opacity-[0.02] whitespace-nowrap leading-none select-none transition-transform duration-1000"
          style={{ 
            fontSize: "clamp(120px, 25vw, 400px)",
            transform: `translateX(calc(-${activeIndex * 10}%))` 
          }}
        >
          LATEST DROPS LATEST DROPS
        </h2>
      </div>

      {/* Title */}
      <div className="container-main relative z-10 mb-12 flex justify-between items-end">
        <div>
          <p className="font-syne font-bold text-ash text-[10px] tracking-widest uppercase mb-2">Editorial View</p>
          <h3 className="font-syne font-bold text-salt uppercase leading-none tracking-tight" style={{ fontSize: "clamp(24px, 4vw, 40px)" }}>
            Lookbook
          </h3>
        </div>
        <div className="flex gap-4">
           <button 
             onClick={() => {
               if (scrollRef.current) {
                 scrollRef.current.scrollBy({ left: -window.innerWidth * 0.75, behavior: 'smooth' });
               }
             }}
             className="w-10 h-10 border border-ember flex items-center justify-center text-salt hover:bg-salt hover:text-[#111512] transition-colors"
           >
             &larr;
           </button>
           <button 
             onClick={() => {
               if (scrollRef.current) {
                 scrollRef.current.scrollBy({ left: window.innerWidth * 0.75, behavior: 'smooth' });
               }
             }}
             className="w-10 h-10 border border-ember flex items-center justify-center text-salt hover:bg-salt hover:text-[#111512] transition-colors"
           >
             &rarr;
           </button>
        </div>
      </div>

      {/* The Scrollable Strip */}
      <div 
        ref={scrollRef}
        className="relative z-10 w-full flex gap-4 md:gap-8 overflow-x-auto snap-x snap-mandatory hide-scrollbar px-[12.5vw] lg:px-[15vw] pb-12"
      >
        {products.map((product, idx) => {
          const isActive = activeIndex === idx;
          const isOnSale = product.flashSale?.isActive && product.flashSale.salePrice;
          const displayPrice = isOnSale ? product.flashSale!.salePrice : product.salePrice || product.price;
          const finalPrice = product.discountRate > 0 ? displayPrice * (1 - product.discountRate / 100) : displayPrice;

          return (
            <Link 
              href={`/products/${product.slug}`}
              key={product.id}
              className="flex-shrink-0 w-[75vw] lg:w-[70vw] snap-center group relative block"
            >
              {/* Image Container */}
              <div 
                className={`relative w-full aspect-[4/5] lg:aspect-[16/9] overflow-hidden bg-dim transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] ${
                  isActive ? "scale-100 opacity-100 border border-ember" : "scale-95 opacity-40 border border-transparent"
                }`}
              >
                <Image
                  src={product.images[0]?.url || "/placeholder.svg"}
                  alt={product.name}
                  fill
                  sizes="75vw"
                  className="object-cover filter brightness-90 contrast-110 grayscale-[10%]"
                />
                
                {/* Overlay Darkening when not active */}
                {!isActive && <div className="absolute inset-0 bg-[#111512]/60 z-10" />}
                
                {/* Badges */}
                {isActive && product.isNew && (
                  <div className="absolute top-6 left-6 z-20">
                    <span className="bg-salt text-void font-syne font-bold text-[10px] px-3 py-1 uppercase tracking-widest leading-none">New</span>
                  </div>
                )}
              </div>

              {/* Info Area (Appears below or overlays depending on design, here below) */}
              <div 
                className={`mt-6 transition-all duration-700 ${isActive ? "opacity-100 transform translate-y-0" : "opacity-0 transform translate-y-4"}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-syne font-bold text-2xl lg:text-4xl text-salt uppercase tracking-tight mb-2">
                      {product.name}
                    </h4>
                    <p className="font-dm-mono text-xs text-ash">
                      {String(idx + 1).padStart(2, "0")} / {String(products.length).padStart(2, "0")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-dm-mono text-lg text-salt">
                      {formatPrice(finalPrice)}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
