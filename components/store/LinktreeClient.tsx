"use client";

import Image from "next/image";
import Link from "next/link";

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
    <div className="min-h-screen bg-void flex flex-col">

      {/* ── TOP BAR ── */}
      <div className="px-6 py-4 flex items-center justify-between">
        <Link href="/" className="font-sans font-black text-salt uppercase tracking-[0.3em] text-xs hover:text-signal">
          ← SYCHOGEAR
        </Link>
        <span className="font-sans font-bold text-ash text-[9px] uppercase tracking-[0.3em]">
          /LINKS
        </span>
      </div>

      {/* ── MAIN ── */}
      <main className="flex-1 flex flex-col items-center w-full max-w-xl mx-auto px-6 py-16">

        {/* Header */}
        <header className="w-full mb-12">
          {/* Animated GIF Logo */}
          <div className="mb-8 flex justify-center">
            <div className="p-4 w-28 h-28 flex items-center justify-center">
              <img
                src="/images/logo.gif"
                alt="SYCHOGEAR"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Brand Name */}
          <h1 className="font-sans font-black text-salt uppercase tracking-[0.4em] text-2xl text-center leading-none mb-3">
            SYCHOGEAR
          </h1>

          {/* Slogan */}
          <p className="slogan-brand font-sans font-bold text-[9px] tracking-[0.35em] uppercase text-center">
            VIOLENCE IS OUR AESTHETIC
          </p>

          {/* Divider */}
          <div className="w-full h-[2px] bg-salt mt-10" />
        </header>

        {/* Links */}
        <nav className="w-full flex flex-col gap-0">
          {links.map((link, i) => (
            <Link
              key={i}
              href={link.url}
              target={link.url.startsWith("/") ? "_self" : "_blank"}
              rel={link.url.startsWith("/") ? "" : "noopener noreferrer"}
              className={`group flex items-center w-full px-5 py-4 border-2 border-t-0 first:border-t-2 ${
                link.primary
                  ? "bg-salt text-void border-salt hover:bg-signal hover:border-signal"
                  : "bg-void text-salt border-salt hover:bg-salt hover:text-void"
              }`}
            >
              {/* Icon */}
              <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center mr-4">
                {link.image && (
                  <div className="relative w-5 h-5">
                    <Image
                      src={link.image}
                      alt={link.title}
                      fill
                      sizes="20px"
                      priority={i === 0}
                      className={`object-contain ${
                        link.primary
                          ? "filter brightness-0 group-hover:brightness-0 group-hover:invert"
                          : "filter grayscale brightness-150 group-hover:brightness-0"
                      }`}
                    />
                  </div>
                )}
              </div>

              {/* Text */}
              <div className="flex-1 flex flex-col justify-center">
                <span className="font-sans font-black text-[11px] uppercase tracking-[0.25em] leading-none mb-1">
                  {link.title}
                </span>
                {link.description && (
                  <span className={`font-sans font-bold text-[8px] uppercase tracking-widest leading-none ${
                    link.primary ? "opacity-60" : "text-ash group-hover:text-void"
                  }`}>
                    {link.description}
                  </span>
                )}
              </div>

              {/* Index number */}
              <span className={`font-sans font-black text-[10px] tabular-nums opacity-30`}>
                {String(i + 1).padStart(2, "0")}
              </span>
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <footer className="mt-16 w-full">
          <div className="w-full h-[2px] bg-salt mb-8" />
          <div className="flex items-center justify-between">
            <p className="font-sans font-bold text-[8px] text-ash uppercase tracking-[0.3em]">
              © 2026 SYCHO FIGHT GEAR
            </p>
            <p className="font-sans font-bold text-[8px] text-ash uppercase tracking-[0.3em]">
              ALL RIGHTS RESERVED
            </p>
          </div>
        </footer>

      </main>
    </div>
  );
}
