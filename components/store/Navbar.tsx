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
        const res = await fetch("/api/settings");
        const data = await res.json();
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
      <div className="fixed top-0 left-0 right-0 z-50 flex flex-col items-center w-full bg-void shadow-md">

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

                  {/* Removed mobile hamburger as per request */}
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
    </>
  );
}
