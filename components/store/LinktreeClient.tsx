"use client";

import Image from "next/image";
import Link from "next/link";
import { HiOutlineArrowRight } from "react-icons/hi";

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
    title: "Instagram",
    url: "https://www.instagram.com/sychogear",
    description: "Catalogs & Latest Drop Updates",
    image: "/images/instagram.webp",
  },
  {
    title: "TikTok",
    url: "https://www.tiktok.com/@sychogear",
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
    <div className="min-h-screen bg-void flex flex-col relative overflow-hidden selection:bg-salt selection:text-void">
      
      {/* ── BACKGROUND ── */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-void" />

      {/* ── MAIN CONTENT ── */}
      <main className="relative z-10 flex-1 flex flex-col items-center w-full max-w-lg mx-auto px-6 py-16 md:py-24">
        
        {/* Header Section */}
        <header className="flex flex-col items-center mb-16 w-full">
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
            className="font-sans font-black text-salt uppercase leading-none tracking-[0.3em] mb-4 text-center"
            style={{ fontSize: "clamp(24px, 5vw, 32px)" }}
          >
            SYCHOGEAR
          </h1>
          <p className="font-sans font-bold text-[10px] tracking-[0.4em] uppercase text-ash text-center">
            The Official Archive
          </p>
        </header>

        {/* Links Section */}
        <div className="w-full space-y-3">
          {links.map((link, i) => (
            <div 
              key={i} 
              className="" 
            >
              <Link
                href={link.url}
                target={link.url.startsWith("/") ? "_self" : "_blank"}
                rel={link.url.startsWith("/") ? "" : "noopener noreferrer"}
                className={`group relative flex items-center w-full p-5 transition-none border-2 ${
                  link.primary
                    ? "bg-salt border-salt text-void hover:bg-void hover:text-salt hover:border-salt"
                    : "bg-void border-salt text-salt hover:bg-signal hover:border-signal"
                }`}
              >
                {/* Logo Area */}
                <div className={`flex-shrink-0 w-10 h-10 flex items-center justify-center transition-none ${link.primary ? 'opacity-100' : 'opacity-100'}`}>
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
                  <span className={`font-sans font-black text-[12px] uppercase tracking-[0.2em] leading-none mb-1.5`}>
                    {link.title}
                  </span>
                  {link.description && (
                    <span className={`font-sans font-bold text-[9px] uppercase tracking-widest ${link.primary ? "text-void/60 group-hover:text-salt/60" : "text-ash group-hover:text-salt"}`}>
                      {link.description}
                    </span>
                  )}
                </div>

                {/* Arrow Icon */}
                <div className="flex-shrink-0 ml-3">
                  <HiOutlineArrowRight className={`w-4 h-4 transition-none ${link.primary ? 'text-void group-hover:text-salt' : 'text-ash group-hover:text-salt'}`} />
                </div>
              </Link>
            </div>
          ))}
        </div>
        
        {/* Footer */}
        <footer className="mt-24 w-full flex flex-col items-center">
          <div className="w-12 h-[2px] bg-salt mb-8" />
          <p 
            className="font-sans font-black text-salt uppercase text-center leading-relaxed"
            style={{ fontSize: "10px", letterSpacing: "0.5em" }}
          >
             VIOLENCE IS OUR <br/>
             <span className="text-ash mt-1 block">AESTHETIC</span>
          </p>
          <p className="font-sans font-bold text-[8px] text-dim uppercase tracking-[0.3em] mt-12">
            &copy; 2026 SYCHO FIGHT GEAR
          </p>
        </footer>

      </main>


    </div>
  );
}

