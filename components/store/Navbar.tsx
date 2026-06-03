"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { HiOutlineShoppingBag, HiOutlineLocationMarker } from "react-icons/hi";
import { useCartStore } from "@/stores/cart-store";
import { useUIStore } from "@/stores/ui-store";
import RegionCurrencySelector from "./RegionCurrencySelector";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const itemCount = useCartStore((s) => s.getItemCount());
  const setCartDrawerOpen = useUIStore((s) => s.setCartDrawerOpen);

  const [marqueeText, setMarqueeText] = useState("VIOLENCE IS OUR AESTHETIC");

  useEffect(() => {
    setMounted(true);
    // Fetch marquee text
    const fetchSettings = async () => {
      try {
        const { data } = await axios.get("/api/settings");
        if (data.success && data.data.marqueeText) {
          setMarqueeText(data.data.marqueeText);
        }
      } catch (err) {
        console.warn("Failed to fetch settings for marquee:", err);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMobileOpen(false); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const navLinks: { href: string; label: string }[] = [];

  // Marquee text repetition for smooth loop
  const marqueeContent = Array(8).fill(marqueeText).map((text, i) => (
    <span key={i} className="font-sans font-bold tracking-[0.3em] uppercase mx-4" style={{ fontSize: "7px", color: "#000000" }}>
      {text}
    </span>
  ));

  return (
    <>
      {/* ─── Header ────────────────────────────────────────── */}
      <div className="relative z-50 flex flex-col items-center w-full">

        {/* Slogan Bar */}
        <div
          className="w-full flex items-center overflow-hidden whitespace-nowrap"
          style={{
            backgroundColor: "#c0392b",
            padding: "4px 0",
          }}
        >
          <div className="inline-block animate-marquee whitespace-nowrap flex-shrink-0">
            {marqueeContent}
          </div>
          <div className="inline-block animate-marquee whitespace-nowrap flex-shrink-0" aria-hidden="true">
            {marqueeContent}
          </div>
        </div>

        <div className="w-full flex justify-center px-4 md:px-8">
          <header
            className={`w-full bg-transparent`}
          >
            <div className={`px-4 md:px-8`}>
              <div className="relative flex items-center justify-between" style={{ height: "50px" }}>

                {/* Left — Desktop Nav & Mobile Hamburger */}
                <div className="flex-1 flex items-center">
                  <nav className="hidden md:flex items-center gap-8" aria-label="Primary navigation">
                    {/* Navigation removed */}
                  </nav>

                  {/* Mobile hamburger */}
                  <button
                    id="mobile-menu-trigger"
                    onClick={() => setMobileOpen(!mobileOpen)}
                    className="md:hidden p-2 -ml-2 text-white transition-colors duration-200 flex flex-col gap-1.5 justify-center items-center w-10 h-10"
                    aria-label={mobileOpen ? "Close menu" : "Open menu"}
                    aria-expanded={mobileOpen}
                  >
                    <span className={`block h-[1.5px] w-5 bg-current transition-all duration-300 origin-center ${mobileOpen ? "rotate-45 translate-y-[4.5px]" : ""}`} />
                    <span className={`block h-[1.5px] w-5 bg-current transition-all duration-300 origin-center ${mobileOpen ? "-rotate-45 -translate-y-[4.5px]" : ""}`} />
                  </button>
                </div>

                {/* Center — Logo Removed (Moved to Sidebar) */}
                <div className="absolute left-1/2 -translate-x-1/2 flex items-center z-10" />

                {/* Right — Actions */}
                <div className="flex-1 flex items-center justify-end gap-1 sm:gap-4">
                  <div className="hidden md:flex items-center gap-4 border-r border-salt/20 pr-4 mr-2">
                    <LanguageSwitcher />
                    <RegionCurrencySelector />
                  </div>
                  <div className="md:hidden flex items-center gap-2 scale-90 origin-right">
                    <LanguageSwitcher />
                    <RegionCurrencySelector />
                  </div>

                  {/* Track Order icon */}
                  <Link
                    href="/order-status"
                    className="relative p-2 text-white/80 hover:text-white transition-colors duration-300"
                    aria-label="Track Order"
                  >
                    <HiOutlineLocationMarker className="w-4 h-4" />
                  </Link>

                  {/* Cart */}
                  <button
                    id="cart-trigger"
                    onClick={() => setCartDrawerOpen(true)}
                    className="relative p-2 text-white/80 hover:text-white transition-colors duration-300"
                    aria-label={`Cart${mounted && itemCount > 0 ? `, ${itemCount} items` : ""}`}
                  >
                    <HiOutlineShoppingBag className="w-4 h-4" />
                    {mounted && itemCount > 0 && (
                      <span
                        className="absolute top-0 right-0 w-3 h-3 flex items-center justify-center bg-white text-black text-[7px] font-bold leading-none rounded-full"
                        aria-hidden="true"
                      >
                        {itemCount > 9 ? "9+" : itemCount}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </header>
        </div>
      </div>

      {/* ─── Mobile Nav — Full Screen ──────────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-void flex flex-col overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
          style={{ animation: "fadeIn 400ms ease-out forwards" }}
        >
          {/* Close bar */}
          <div className="flex items-center justify-between px-8 py-6 border-b border-ember">
            <Link href="/" onClick={() => setMobileOpen(false)} aria-label="SYCHOGEAR — Home">
              <Image
                src="/images/logo-sychogear.webp"
                alt="SYCHOGEAR"
                width={200}
                height={50}
                className="h-8 w-auto opacity-100 mix-blend-screen"
                style={{ filter: "brightness(1.5)" }}
              />
            </Link>
            <button
              onClick={() => setMobileOpen(false)}
              className="text-salt hover:text-signal transition-none"
              style={{ fontFamily: "var(--font-sans)", fontSize: "2rem", lineHeight: 1 }}
              aria-label="Close menu"
            >
              ×
            </button>
          </div>

          {/* Nav links */}
          <nav className="flex-1 flex flex-col justify-center px-8 overflow-hidden" aria-label="Mobile navigation">
            <div>
              {[...navLinks, { href: "/order-status", label: "Track Order" }].map((link, i) => (
                <div
                  key={link.href}
                  className="overflow-hidden border-b border-ember"
                >
                  <Link
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="block py-6 group"
                    style={{ animation: `clipRevealV 600ms ${i * 80}ms cubic-bezier(0.4, 0, 0.2, 1) both` }}
                  >
                    <span
                      className="font-sans text-salt group-hover:text-signal transition-none block"
                      style={{ fontSize: "clamp(40px, 10vw, 80px)", lineHeight: 1, fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em" }}
                    >
                      {link.label}
                    </span>
                  </Link>
                </div>
              ))}
            </div>
          </nav>

          {/* Bottom social strip */}
          <div className="px-8 pb-12 pt-8 border-t border-ember flex justify-between items-center">
            <div className="flex gap-8">
              <a
                href="https://www.instagram.com/sychogear"
                target="_blank"
                rel="noopener noreferrer"
                className="font-dm-mono text-[11px] text-white/50 hover:text-white uppercase tracking-widest transition-colors"
              >
                Instagram ↗
              </a>
              <a
                href="https://www.tiktok.com/@sychogearofficial"
                target="_blank"
                rel="noopener noreferrer"
                className="font-dm-mono text-[11px] text-white/50 hover:text-white uppercase tracking-widest transition-colors"
              >
                TikTok ↗
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
