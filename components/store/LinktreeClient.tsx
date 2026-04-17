"use client";

import Image from "next/image";
import Link from "next/link";
import { HiOutlineArrowRight } from "react-icons/hi";
import HeroSlider from "@/components/store/HeroSlider";

const links = [
  {
    title: "Official Webstore",
    url: "/",
    description: "Shop Full Collection • Worldwide Shipping",
    primary: true,
    image: "/images/logo-sychogear.webp",
  },
  {
    title: "Shopee",
    url: "https://shopee.co.id/sychogear",
    description: "Exclusive Deals & Regional Shipping",
    image: "/images/shopee.webp",
  },
  {
    title: "Tokopedia",
    url: "https://tk.tokopedia.com/ZSHHSgote/",
    description: "Tokopedia Official Store",
    image: "/images/tokopedia.webp",
  },
  {
    title: "Instagram",
    url: "https://www.instagram.com/sychogear",
    description: "Catalogs & Latest Drop Updates",
    image: "/images/instagram.webp",
  },
  {
    title: "TikTok",
    url: "https://www.tiktok.com/@sychogearofficial",
    description: "Product Videos & Behind The Scenes",
    image: "/images/tiktok.webp",
  },
  {
    title: "WhatsApp",
    url: "https://wa.me/6283190138549",
    description: "Customer Care & Direct Orders",
    image: "/images/whatsapp.webp",
  },
];

export default function LinktreeClient({ heroImages = [] }: { heroImages?: string[] }) {
  return (
    <div className="min-h-screen bg-[#050505] flex flex-col relative overflow-hidden font-sans selection:bg-red-600 selection:text-black">
      
      {/* ── BACKGROUND AMBIENCE ── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {heroImages.length > 0 && (
          <div className="absolute inset-0 opacity-20 filter grayscale">
            <HeroSlider images={heroImages} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/95 via-[#050505]/80 to-[#050505]" />
        {/* Grain Overlay */}
        <div className="absolute inset-0 opacity-20 pointer-events-none mix-blend-overlay" style={{ backgroundImage: 'url("/images/noise.png")', backgroundSize: '150px' }} />
      </div>

      {/* ── MAIN CONTENT ── */}
      <main className="relative z-10 flex-1 flex flex-col items-center w-full max-w-md mx-auto px-5 py-12 md:py-16">
        
        {/* Header Section */}
        <header className="flex flex-col items-center mb-12 w-full">
          <div className="relative group mb-6">
            {/* Brutalist Logo Box replacing the rounded glow */}
            <div className="w-20 h-20 bg-black border border-white/20 flex items-center justify-center p-3 relative overflow-hidden blade-cut transition-colors duration-500 group-hover:border-red-600 group-hover:bg-red-600/10">
              <Image
                src="/images/logo-sychogear.webp"
                alt="SYCHOGEAR"
                width={120}
                height={120}
                className="w-full h-auto brightness-200 contrast-200 drop-shadow-md"
                priority
                sizes="80px"
              />
            </div>
          </div>
          
          <h1 className="text-3xl font-display font-black tracking-[0.3em] uppercase text-white mb-2 text-center">
            SYCHOGEAR
          </h1>
          <div className="flex items-center gap-3">
             <span className="w-6 h-px bg-red-600"></span>
             <p className="text-[10px] sm:text-[11px] font-mono tracking-[0.25em] uppercase text-red-600 font-medium text-center">
               est 2026
             </p>
             <span className="w-6 h-px bg-red-600"></span>
          </div>
        </header>

        {/* Links Section */}
        <div className="w-full space-y-4">
          {links.map((link, i) => (
            <div 
              key={i} 
              className="animate-slide-up" 
              style={{ animationDelay: `${i * 80}ms`, opacity: 0, animationFillMode: "forwards" }}
            >
              <Link
                href={link.url}
                target={link.url.startsWith("/") ? "_self" : "_blank"}
                rel={link.url.startsWith("/") ? "" : "noopener noreferrer"}
                className={`group blade-cut relative flex items-center w-full p-4 overflow-hidden transition-all duration-300 ${
                  link.primary
                    ? "bg-white text-black border border-transparent"
                    : "bg-[#0a0a0a] border border-white/10 text-white hover:bg-red-600 hover:border-red-600 hover:text-black"
                }`}
              >
                {/* Logo Area */}
                <div className={`flex-shrink-0 w-12 h-12 flex items-center justify-center overflow-hidden transition-colors duration-300 blade-cut ${link.primary ? 'bg-black/10' : 'bg-black/40 border border-white/5 group-hover:bg-black/20 group-hover:border-black/20'}`}>
                  {link.image && (
                    <div className="relative w-6 h-6">
                      <Image
                        src={link.image}
                        alt={link.title}
                        fill
                        sizes="24px"
                        priority={i === 0}
                        className={`object-contain ${link.primary ? 'filter grayscale brightness-0' : 'transition-transform duration-300 group-hover:scale-110'}`}
                      />
                    </div>
                  )}
                </div>

                {/* Text Area */}
                <div className="flex-1 ml-4 flex flex-col justify-center">
                  <span className={`font-mono font-bold text-[12px] sm:text-[13px] uppercase tracking-[0.15em] leading-none mb-1.5 transition-colors duration-300 ${link.primary ? "" : "group-hover:text-black"}`}>
                    {link.title}
                  </span>
                  {link.description && (
                    <span className={`text-[10px] sm:text-[11px] leading-snug font-sans uppercase tracking-widest ${link.primary ? "text-gray-800 font-bold" : "text-gray-500 font-medium group-hover:text-black/70"}`}>
                      {link.description}
                    </span>
                  )}
                </div>

                {/* Arrow Icon */}
                <div className="flex-shrink-0 ml-3">
                  <div className={`w-8 h-8 flex items-center justify-center transition-all duration-300 blade-cut ${link.primary ? 'bg-black text-white group-hover:translate-x-1' : 'bg-white/5 text-white/50 group-hover:bg-black/20 group-hover:text-black group-hover:translate-x-1'}`}>
                    <HiOutlineArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
        
        {/* Footer */}
        <footer className="mt-16 w-full flex flex-col items-center animate-slide-up" style={{ animationDelay: "600ms", opacity: 0, animationFillMode: "forwards" }}>
          
          {/* Custom Hooligan Divider */}
          <div className="flex items-center gap-2 mb-8 opacity-40">
            <span className="w-12 h-px bg-white"></span>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="14" height="14" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              className="text-white"
            >
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
              <line x1="4" y1="22" x2="4" y2="15"></line>
            </svg>
            <span className="w-12 h-px bg-white"></span>
          </div>
          
          <div className="sr-only">
            <h2>SYCHOGEAR Official Hub</h2>
            <p>Welcome to the official digital hub of SYCHOGEAR.</p>
          </div>

          <p 
            className="text-[12px] text-white uppercase text-center font-display font-black"
            style={{ letterSpacing: "0.4em" }}
          >
             VIOLENCE IS OUR <br/><span className="text-red-600 mt-2 block">AESTHETIC</span>
          </p>
        </footer>

      </main>

      {/* Internal Styles for Animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideUpHooligan {
          0% { opacity: 0; transform: translateY(20px); filter: blur(4px); }
          100% { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        .animate-slide-up {
          animation: slideUpHooligan 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-slide-up { animation: none !important; opacity: 1 !important; transform: none !important; filter: none !important; }
        }
      `}} />
    </div>
  );
}
