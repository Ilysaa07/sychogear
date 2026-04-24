"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCurrency } from "@/components/store/CurrencyProvider";
import type { ProductWithRelations } from "@/types";

interface ArchiveIndexProps {
  products: ProductWithRelations[];
}

export default function ArchiveIndex({ products }: ArchiveIndexProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const { formatPrice } = useCurrency();

  if (!products || products.length === 0) return null;

  return (
    <div className="w-full">
      {/* ─── DESKTOP VIEW: Hover-to-reveal ─── */}
      <div className="hidden lg:flex w-full min-h-[70vh] border-y border-ember relative">
        
        {/* Left Side: The Brutalist Index */}
        <div className="w-1/2 flex flex-col justify-center py-12 pr-16 relative z-10">
          {products.map((product, i) => {
            const isHovered = hoveredIdx === i;
            const isOnSale = product.flashSale?.isActive && product.flashSale.salePrice;
            const displayPrice = isOnSale ? product.flashSale!.salePrice : product.salePrice || product.price;
            const finalPrice = product.discountRate > 0 ? displayPrice * (1 - product.discountRate / 100) : displayPrice;

            return (
              <Link 
                key={product.id}
                href={`/products/${product.slug}`}
                className="group py-5 border-b border-ember hover:border-salt transition-colors duration-300 flex items-center justify-between"
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                <div className="flex items-center gap-8">
                  <span className="font-dm-mono text-xs text-ash group-hover:text-salt transition-colors duration-300 w-6">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="font-syne font-bold text-3xl xl:text-4xl uppercase text-ash group-hover:text-salt transition-colors duration-300 truncate max-w-[350px] xl:max-w-[450px]">
                    {product.name}
                  </h3>
                </div>
                <span className="font-dm-mono text-sm text-abyss group-hover:text-salt transition-colors duration-300 flex items-center gap-4">
                  {formatPrice(finalPrice)}
                  <span className="opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all duration-300">
                    →
                  </span>
                </span>
              </Link>
            );
          })}
        </div>

        {/* Vertical divider */}
        <div className="w-[1px] bg-ember absolute left-1/2 top-0 bottom-0 z-20" />

        {/* Right Side: The Showcase */}
        <div className="w-1/2 relative bg-abyss">
          <div className="sticky top-[90px] h-[calc(100vh-90px)] w-full flex items-center justify-center overflow-hidden">
             
             {/* Idle State Pattern/Icon */}
             <div 
               className={`absolute inset-0 flex items-center justify-center transition-opacity duration-700 ${hoveredIdx === null ? "opacity-100" : "opacity-0"}`}
             >
               <span className="font-syne font-bold text-[240px] text-ember opacity-10 select-none">
                 ?
               </span>
             </div>

             {/* Images layer */}
             {products.map((product, i) => (
               <div 
                 key={product.id}
                 className="absolute inset-0 p-16 transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]"
                 style={{
                   opacity: hoveredIdx === i ? 1 : 0,
                   transform: hoveredIdx === i ? "scale(1)" : "scale(1.05)",
                   pointerEvents: hoveredIdx === i ? "auto" : "none",
                 }}
               >
                 <div className="relative w-full h-full bg-dim overflow-hidden border border-ember shadow-2xl">
                   <Image
                      src={product.images[0]?.url || "/placeholder.svg"}
                      alt={product.name}
                      fill
                      sizes="50vw"
                      className="object-cover filter brightness-90 contrast-110 grayscale-[10%]"
                   />
                   
                   <div className="absolute top-6 left-6 z-10 flex flex-col gap-2">
                      {product.isNew && <span className="bg-salt text-void font-syne font-bold text-[10px] px-3 py-1 uppercase tracking-widest leading-none w-fit">New</span>}
                      {product.flashSale?.isActive && <span className="bg-signal text-void font-syne font-bold text-[10px] px-3 py-1 uppercase tracking-widest leading-none w-fit">Sale</span>}
                   </div>
                   
                   {/* Subtle brand watermark on image */}
                   <div className="absolute bottom-4 right-4 z-10">
                     <p className="font-syne font-bold text-white opacity-20 uppercase tracking-[0.3em] text-xs">Sychogear</p>
                   </div>
                 </div>
               </div>
             ))}
          </div>
        </div>
      </div>

      {/* ─── MOBILE VIEW: Minimalist List ─── */}
      <div className="lg:hidden w-full flex flex-col gap-8">
         {products.map((product, i) => {
             const isOnSale = product.flashSale?.isActive && product.flashSale.salePrice;
             const displayPrice = isOnSale ? product.flashSale!.salePrice : product.salePrice || product.price;
             const finalPrice = product.discountRate > 0 ? displayPrice * (1 - product.discountRate / 100) : displayPrice;

             return (
               <Link key={product.id} href={`/products/${product.slug}`} className="block w-full border-b border-ember pb-8 group">
                 <div className="relative w-full aspect-[4/5] bg-dim mb-4 overflow-hidden border border-ember">
                    <Image
                      src={product.images[0]?.url || "/placeholder.svg"}
                      alt={product.name}
                      fill
                      sizes="100vw"
                      className="object-cover filter brightness-90 contrast-110 grayscale-[10%] group-hover:scale-105 transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]"
                    />
                    <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                      {product.isNew && <span className="bg-salt text-void font-syne font-bold text-[10px] px-2 py-1 uppercase tracking-widest leading-none w-fit">New</span>}
                      {isOnSale && <span className="bg-signal text-void font-syne font-bold text-[10px] px-2 py-1 uppercase tracking-widest leading-none w-fit">Sale</span>}
                    </div>
                 </div>
                 <div className="flex justify-between items-start gap-4">
                   <div>
                     <span className="font-dm-mono text-[10px] text-ash block mb-2">
                       {String(i + 1).padStart(2, "0")}
                     </span>
                     <h3 className="font-syne font-bold text-xl uppercase text-salt leading-none tracking-tight">
                       {product.name}
                     </h3>
                   </div>
                   <span className="font-dm-mono text-sm text-salt pt-1">
                     {formatPrice(finalPrice)}
                   </span>
                 </div>
               </Link>
             )
         })}
      </div>
    </div>
  );
}
