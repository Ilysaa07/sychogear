"use client";

import { useState, useEffect } from "react";
import { HiOutlineX } from "react-icons/hi";
import Link from "next/link";
import Image from "next/image";

export interface PromoSettings {
  active: boolean;
  image?: string;
  title: string;
  subtitle: string;
  linkUrl: string;
  linkText: string;
}

let hasShownInMemory = false;

export default function PromoModal({ settings }: { settings: PromoSettings }) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasRendered, setHasRendered] = useState(false);

  useEffect(() => {
    if (!settings.active) return;
    
    // Check if we've already shown it in memory (client navigation)
    if (hasShownInMemory) return;

    // Only show on client
    setHasRendered(true);
    
    // Add a slight delay before showing the modal for a premium feel
    const timer = setTimeout(() => {
      setIsOpen(true);
      hasShownInMemory = true;
    }, 1500);

    return () => clearTimeout(timer);
  }, [settings.active]);

  if (!hasRendered || !isOpen || !settings.active) return null;

  const titleLines = settings.title ? settings.title.split("\\n") : ["LIMITED", "DROP"];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-500 fade-in"
        onClick={() => setIsOpen(false)}
      />
      
      {/* Modal Content - Elegant & Minimal & Smaller Size */}
      <div className="relative w-full max-w-[280px] sm:max-w-xs md:max-w-sm aspect-[4/5] bg-brand-950 border border-white/10 flex flex-col z-10 slide-up group overflow-hidden shadow-2xl">
         
         {/* Close Button */}
         <button 
           onClick={(e) => {
             e.preventDefault();
             e.stopPropagation();
             setIsOpen(false);
           }}
           className="absolute top-4 right-4 text-white hover:text-red-500 z-30 bg-black/40 p-2 rounded-full backdrop-blur-md transition-all duration-300 hover:scale-110"
           aria-label="Close Promo"
         >
           <HiOutlineX className="w-5 h-5" />
         </button>
         
         {/* Clickable Image Area */}
         <Link 
           href={settings.linkUrl}
           onClick={() => setIsOpen(false)}
           className="relative w-full h-full block group overflow-hidden"
         >
             {/* Gradient for text readability */}
             <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/10 z-10 transition-opacity duration-500 group-hover:opacity-80" />
             
             <Image 
               src={settings.image || "/images/placeholder.jpg"} 
               alt={settings.title} 
               fill
               className="object-cover opacity-80 mix-blend-luminosity hover:mix-blend-normal transition-all duration-700 group-hover:scale-105"
             />
             
             {/* Minimalist Title Section */}
             <div className="absolute bottom-6 left-6 right-6 z-20 flex flex-col transition-transform duration-500 group-hover:-translate-y-2">
                 <h2 className="text-3xl md:text-5xl font-marker text-white tracking-tight drop-shadow-2xl">
                   {titleLines.map((line, i) => (
                     <span key={i}>
                       {line}
                       {i < titleLines.length - 1 && <br />}
                     </span>
                   ))}
                 </h2>
                 {settings.subtitle && (
                   <p className="text-brand-300 text-xs tracking-widest uppercase mt-4 opacity-80 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                     <span>{settings.linkText || "Explore"}</span>
                     <span className="w-4 h-px bg-red-600 transition-all duration-500 group-hover:w-8"></span>
                   </p>
                 )}
             </div>

             {/* Animated Red Overlay on Hover */}
             <div className="absolute inset-0 bg-red-600/0 group-hover:bg-red-600/10 z-10 transition-colors duration-700 pointer-events-none" />
         </Link>
      </div>
    </div>
  );
}
