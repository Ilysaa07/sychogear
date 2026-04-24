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
    <div className="min-h-screen bg-[#111512] flex flex-col relative overflow-hidden selection:bg-salt selection:text-void">
      
      {/* ── BACKGROUND ── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {heroImages.length > 0 && (
          <div className="absolute inset-0 opacity-[0.03] filter grayscale">
            <HeroSlider images={heroImages} />
          </div>
        )}
        <div className="absolute inset-0 bg-[#111512]" />
      </div>

      {/* ── MAIN CONTENT ── */}
      <main className="relative z-10 flex-1 flex flex-col items-center w-full max-w-lg mx-auto px-6 py-16 md:py-24">
        
        {/* Header Section */}
        <header className="flex flex-col items-center mb-16 w-full animate-fade-in">
          <div className="relative mb-8">
            <div className="w-32 h-32 md:w-40 md:h-40 flex items-center justify-center p-4">
              <img
                src="/images/logo.gif"
                alt="SYCHOGEAR"
                className="w-full h-full "
              />
            </div>
          </div>
          
          <h1 
            className="font-syne font-bold text-salt uppercase leading-none tracking-[0.3em] mb-4 text-center"
            style={{ fontSize: "clamp(24px, 5vw, 32px)" }}
          >
            SYCHOGEAR
          </h1>
          <p className="font-dm-mono text-[10px] tracking-[0.4em] uppercase text-ash text-center">
            The Official Archive
          </p>
        </header>

        {/* Links Section */}
        <div className="w-full space-y-3">
          {links.map((link, i) => (
            <div 
              key={i} 
              className="animate-slide-up" 
              style={{ animationDelay: `${i * 100}ms`, opacity: 0, animationFillMode: "forwards" }}
            >
              <Link
                href={link.url}
                target={link.url.startsWith("/") ? "_self" : "_blank"}
                rel={link.url.startsWith("/") ? "" : "noopener noreferrer"}
                className={`group relative flex items-center w-full p-5 transition-all duration-500 border ${
                  link.primary
                    ? "bg-salt border-salt text-[#111512] hover:bg-white hover:border-white"
                    : "bg-transparent border-ember text-salt hover:border-salt"
                }`}
              >
                {/* Logo Area */}
                <div className={`flex-shrink-0 w-10 h-10 flex items-center justify-center transition-colors duration-500 ${link.primary ? 'opacity-90' : 'opacity-40 group-hover:opacity-100'}`}>
                  {link.image && (
                    <div className="relative w-5 h-5">
                      <Image
                        src={link.image}
                        alt={link.title}
                        fill
                        sizes="20px"
                        priority={i === 0}
                        className={`object-contain filter grayscale ${link.primary ? 'brightness-0' : 'brightness-150'}`}
                      />
                    </div>
                  )}
                </div>

                {/* Text Area */}
                <div className="flex-1 ml-4 flex flex-col justify-center">
                  <span className={`font-syne font-bold text-[12px] uppercase tracking-[0.2em] leading-none mb-1.5`}>
                    {link.title}
                  </span>
                  {link.description && (
                    <span className={`font-dm-mono text-[9px] uppercase tracking-widest ${link.primary ? "text-[#111512]/60" : "text-ash group-hover:text-salt/60"}`}>
                      {link.description}
                    </span>
                  )}
                </div>

                {/* Arrow Icon */}
                <div className="flex-shrink-0 ml-3">
                  <HiOutlineArrowRight className={`w-4 h-4 transition-transform duration-500 group-hover:translate-x-1 ${link.primary ? 'text-[#111512]' : 'text-ash group-hover:text-salt'}`} />
                </div>
              </Link>
            </div>
          ))}
        </div>
        
        {/* Footer */}
        <footer className="mt-24 w-full flex flex-col items-center animate-fade-in" style={{ animationDelay: "800ms" }}>
          <div className="w-12 h-px bg-ember mb-8" />
          <p 
            className="font-syne font-bold text-salt uppercase text-center leading-relaxed"
            style={{ fontSize: "10px", letterSpacing: "0.5em" }}
          >
             VIOLENCE IS OUR <br/>
             <span className="text-ash mt-1 block">AESTHETIC</span>
          </p>
          <p className="font-dm-mono text-[8px] text-dim uppercase tracking-[0.3em] mt-12">
            &copy; 2026 SYCHOGEAR ARCHIVE
          </p>
        </footer>

      </main>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-slide-up {
          animation: slideUp 0.8s cubic-bezier(0.2, 1, 0.3, 1) forwards;
        }
        .animate-fade-in {
          animation: fadeIn 1.2s ease forwards;
        }
      `}} />
    </div>
  );
}

