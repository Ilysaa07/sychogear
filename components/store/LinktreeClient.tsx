"use client";

import Image from "next/image";
import Link from "next/link";
import { HiOutlineArrowRight } from "react-icons/hi";

// Placeholder links
const links = [
  {
    title: "OFFICIAL WEBSTORE",
    url: "/",
    description: "Shop the latest collections.",
    primary: true,
  },
  {
    title: "SHOPEE",
    url: "https://shopee.co.id/sychogear", // Update when known
    description: "Belanja via Shopee.",
  },
  {
    title: "TOKOPEDIA",
    url: "https://tokopedia.com/sychogear", // Update when known
    description: "Belanja via Tokopedia.",
  },
  {
    title: "INSTAGRAM",
    url: "https://www.instagram.com/sychogear",
  },
  {
    title: "TIKTOK",
    url: "https://www.tiktok.com/@sychogear",
  },
  {
    title: "CUSTOMER SERVICE (WA)",
    url: "https://wa.me/6281234567890", // Update with actual number
  },
];

export default function LinktreeClient() {
  return (
    <div className="min-h-screen bg-brand-950 flex flex-col relative overflow-hidden font-sans selection:bg-white selection:text-black">
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        
        {/* Subtle red glow at top */}
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[80vw] h-[80vw] max-w-[600px] max-h-[600px] bg-red-600/10 blur-[100px] rounded-full" />
        
        {/* Massive Brand Watermark */}
        <div className="absolute top-10 md:top-20 left-1/2 -translate-x-1/2 w-full flex justify-center opacity-60">
          <h2 className="text-[30vw] md:text-[15vw] leading-none font-marker text-white/5 tracking-tighter cursor-default select-none uppercase whitespace-nowrap">
            SYCHOGEAR
          </h2>
        </div>
        
        {/* Noise overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03]" 
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
        />
        
        {/* Grid lines */}
        <div 
          className="absolute inset-0 opacity-[0.015]"
          style={{ backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`, backgroundSize: '40px 40px' }}
        />
      </div>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex flex-col items-center w-full max-w-md mx-auto px-6 py-16 custom-scrollbar">
        
        {/* Header Section */}
        <header className="flex flex-col items-center mb-12 fade-in">
          <div className="relative group mb-6">
            <div className="absolute inset-0 bg-red-600/20 blur-2xl rounded-full scale-110 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="w-24 h-24 rounded-full border border-white/10 bg-black flex items-center justify-center p-3 relative overflow-hidden">
               <Image
                src="/images/logo-sychogear.png"
                alt="SYCHOGEAR"
                width={100}
                height={100}
                className="w-full h-auto brightness-200 contrast-200"
                priority
              />
            </div>
          </div>
          
          <h1 className="text-xl font-bold tracking-[0.3em] uppercase text-white mb-2 text-center">
            SYCHOGEAR
          </h1>
          <p className="text-[10px] tracking-[0.2em] uppercase text-brand-500 font-semibold mb-1 text-center">
             Premium Fight Gear
          </p>
          <p className="text-[9px] tracking-widest uppercase text-brand-600 font-mono text-center">
             Est. 2026 // VIOLENCE IS OUR AESTHETIC
          </p>
        </header>

        {/* Links Section */}
        <div className="w-full space-y-4 fade-in" style={{ animationDelay: "100ms" }}>
          {links.map((link, i) => (
            <Link
              key={i}
              href={link.url}
              target={link.url.startsWith("/") ? "_self" : "_blank"}
              rel={link.url.startsWith("/") ? "" : "noopener noreferrer"}
              className={`group relative flex flex-col justify-center w-full p-5 border transition-all duration-300 slide-up ${
                link.primary
                  ? "bg-white text-black border-white hover:bg-black hover:text-white"
                  : "bg-black/40 backdrop-blur-md border-white/10 text-white hover:bg-white hover:text-black hover:border-white"
              }`}
              style={{ animationDelay: `${200 + i * 100}ms` }}
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-bold text-xs sm:text-sm uppercase tracking-[0.2em]">
                  {link.title}
                </span>
                <HiOutlineArrowRight className={`w-4 h-4 transition-transform duration-300 ${link.primary ? "group-hover:translate-x-1" : "-translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0"}`} />
              </div>
              {link.description && (
                <span className={`text-[10px] mt-1.5 tracking-wide font-medium ${link.primary ? "text-gray-600 group-hover:text-gray-400" : "text-brand-500 group-hover:text-gray-600"} transition-colors`}>
                  {link.description}
                </span>
              )}
            </Link>
          ))}
        </div>
        
        {/* Footer */}
        <footer className="mt-auto pt-16 fade-in" style={{ animationDelay: "800ms" }}>
          <p className="text-[8px] tracking-[0.3em] text-brand-700 uppercase font-mono">
             VIOLENCE IS OUR AESTHETIC
          </p>
        </footer>

      </main>
    </div>
  );
}
