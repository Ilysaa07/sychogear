"use client";

import Image from "next/image";
import Link from "next/link";
import { HiOutlineArrowRight } from "react-icons/hi";
import HeroSlider from "@/components/store/HeroSlider";

const links = [
  {
    title: "OFFICIAL WEBSTORE",
    url: "/",
    description: "Belanja Koleksi Lengkap Sychogear",
    primary: true,
    image: "/images/logo-sychogear.webp",
  },
  {
    title: "SHOPEE",
    url: "https://shopee.co.id/sychogear",
    description: "Promo & Gratis Ongkir",
    image: "/images/shopee.webp",
  },
  {
    title: "INSTAGRAM",
    url: "https://www.instagram.com/sychogear",
    description: "Katalog & Update Terbaru",
    image: "/images/instagram.webp",
  },
  {
    title: "TIKTOK",
    url: "https://www.tiktok.com/@sychogearofficial",
    description: "Video Produk & Behind The Scenes",
    image: "/images/tiktok.webp",
  },
  {
    title: "WHATSAPP",
    url: "https://wa.me/6283190138549",
    description: "Customer Service & Pemesanan Manual",
    image: "/images/whatsapp.webp",
  },
];

export default function LinktreeClient({ heroImages = [] }: { heroImages?: string[] }) {
  return (
    <div className="min-h-screen bg-[#050505]/80 backdrop-blur-md flex flex-col relative overflow-hidden font-sans selection:bg-red-600 selection:text-white">
      {/* Optimized Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        
        {/* Synchronized Home Background */}
        {heroImages.length > 0 && (
          <div className="absolute inset-0 opacity-40">
            <HeroSlider images={heroImages} />
          </div>
        )}

        {/* Global Dark Gradient Overlay to ensure text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/90 via-[#050505]/60 to-[#050505]" />

        {/* CSS Radial Gradient instead of heavy blur */}
        <div 
          className="absolute top-0 left-0 right-0 h-[800px] opacity-30 mix-blend-screen" 
          style={{ background: 'radial-gradient(circle at 50% -20%, rgba(220, 38, 38, 0.4) 0%, transparent 60%)' }} 
        />
      </div>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex flex-col items-center w-full max-w-md mx-auto px-5 py-12 md:py-16">
        
        {/* Header Section - No animation delay for instant FCP/LCP */}
        <header className="flex flex-col items-center mb-10 w-full">
          <div className="relative group mb-6">
            {/* Glowing ring effect using simple box-shadow instead of blur for performance */}
            <div className="absolute -inset-2 bg-gradient-to-tr from-red-600/20 to-transparent rounded-full opacity-50 group-hover:opacity-100 transition-opacity duration-700 shadow-[0_0_40px_rgba(220,38,38,0.2)]" />
            <div className="w-24 h-24 rounded-full border border-white/10 bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden shadow-2xl">
              <Image
                src="/images/logo-sychogear.webp"
                alt="SYCHOGEAR"
                width={120}
                height={120}
                className="w-full h-auto brightness-200 contrast-200 drop-shadow-md"
                priority
                sizes="120px"
              />
            </div>
          </div>
          
          <h1 className="text-2xl font-black tracking-[0.3em] uppercase text-white mb-2 text-center drop-shadow-lg">
            SYCHOGEAR
          </h1>
          <p className="text-[11px] tracking-[0.2em] uppercase text-brand-400 font-medium mb-1 text-center">
             Premium Fight Gear
          </p>
        </header>

        {/* Links Section */}
        <div className="w-full space-y-4">
          {links.map((link, i) => (
            <div 
              key={i} 
              className="animate-fade-in-up hover-scale-fast" 
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <Link
                href={link.url}
                target={link.url.startsWith("/") ? "_self" : "_blank"}
                rel={link.url.startsWith("/") ? "" : "noopener noreferrer"}
                className={`group relative flex items-center w-full p-4 rounded-xl overflow-hidden transition-all duration-300 ${
                  link.primary
                    ? "bg-white text-black border border-transparent shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:shadow-[0_0_40px_rgba(255,255,255,0.3)]"
                    : "bg-[#111111] border border-white/5 text-white hover:bg-[#1a1a1a] hover:border-white/20 shadow-lg hover:shadow-xl"
                }`}
              >
                {/* Logo Area */}
                <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden ${link.primary ? 'bg-black/5' : 'bg-black/50 border border-white/5'}`}>
                  {link.image && (
                    <div className="relative w-7 h-7">
                      <Image
                        src={link.image}
                        alt={link.title}
                        fill
                        sizes="28px"
                        priority={i === 0}
                        className={`object-contain ${link.primary ? 'filter grayscale brightness-0' : 'filter transition-all duration-300'}`}
                      />
                    </div>
                  )}
                </div>

                {/* Text Area */}
                <div className="flex-1 ml-4 flex flex-col justify-center">
                  <span className="font-extrabold text-[13px] sm:text-sm uppercase tracking-[0.1em] leading-none mb-1.5">
                    {link.title}
                  </span>
                  {link.description && (
                    <span className={`text-[10px] sm:text-[11px] leading-snug ${link.primary ? "text-gray-600 font-bold" : "text-gray-400 font-medium"}`}>
                      {link.description}
                    </span>
                  )}
                </div>

                {/* Arrow Icon */}
                <div className="flex-shrink-0 ml-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${link.primary ? 'bg-black text-white group-hover:rotate-[-45deg]' : 'bg-white/5 text-white/50 group-hover:bg-white/10 group-hover:text-white group-hover:rotate-[-45deg]'}`}>
                    <HiOutlineArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
        
        {/* Footer */}
        <footer className="mt-16 w-full flex flex-col items-center animate-fade-in-up" style={{ animationDelay: "400ms" }}>
          <div className="w-12 h-px bg-gradient-to-r from-transparent via-red-600/50 to-transparent mb-6" />
          
          {/* Semantic SEO Enrichment - Hidden for users but visible to crawlers */}
          <div className="sr-only">
            <h2>SYCHOGEAR Official Hub</h2>
            <p>Welcome to the official digital hub of SYCHOGEAR. Find our premium streetwear and fight gear collections on our official webstore or via our Shopee Mall store. Stay connected with the community on Instagram, TikTok, and YouTube for the latest drops and exclusive content. For manual orders and customer support, reach out directly to our WhatsApp care team.</p>
          </div>

          <p className="text-[9px] tracking-[0.4em] text-brand-600 uppercase font-bold text-center">
             VIOLENCE IS OUR AESTHETIC
          </p>
        </footer>

      </main>

      {/* Optimized animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.5s ease-out forwards;
          opacity: 0;
        }
        .animate-fade-in-up:nth-child(1) { animation-delay: 0.1s; }
        .hover-scale-fast {
          transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .hover-scale-fast:hover {
          transform: scale(1.02);
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-fade-in-up { animation: none; opacity: 1; }
          .hover-scale-fast:hover { transform: none; }
        }
      `}} />
    </div>
  );
}
