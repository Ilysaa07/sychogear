"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { HiOutlineShoppingBag } from "react-icons/hi";
import { useCartStore } from "@/stores/cart-store";
import { useUIStore } from "@/stores/ui-store";
import RegionCurrencySelector from "./RegionCurrencySelector";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const cursorRef = useRef<HTMLDivElement>(null);
  const itemCount = useCartStore((s) => s.getItemCount());
  const setCartDrawerOpen = useUIStore((s) => s.setCartDrawerOpen);

  useEffect(() => {
    setMounted(true);

    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll, { passive: true });

    // Custom cursor
    const handleMouseMove = (e: MouseEvent) => {
      if (cursorRef.current) {
        cursorRef.current.style.left = `${e.clientX}px`;
        cursorRef.current.style.top  = `${e.clientY}px`;
      }
    };
    const handleMouseDown = () => cursorRef.current?.classList.add("cursor-click");
    const handleMouseUp   = () => cursorRef.current?.classList.remove("cursor-click");
    const handleHoverIn   = (e: Event) => {
      if ((e.target as HTMLElement).closest("a, button, [role='button']")) {
        cursorRef.current?.classList.add("cursor-hover");
      }
    };
    const handleHoverOut  = () => cursorRef.current?.classList.remove("cursor-hover");

    window.addEventListener("mousemove",  handleMouseMove, { passive: true });
    window.addEventListener("mousedown",  handleMouseDown);
    window.addEventListener("mouseup",    handleMouseUp);
    document.addEventListener("mouseover", handleHoverIn);
    document.addEventListener("mouseout",  handleHoverOut);

    return () => {
      window.removeEventListener("scroll",    handleScroll);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup",   handleMouseUp);
      document.removeEventListener("mouseover", handleHoverIn);
      document.removeEventListener("mouseout",  handleHoverOut);
    };
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

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/products", label: "Archive" },
    { href: "/order-status", label: "Track Order" },
  ];

  return (
    <>
      {/* ─── Custom Cursor ─────────────────────────────────── */}
      <div id="sg-cursor" ref={cursorRef} aria-hidden="true" />
      {/* ─── Header ────────────────────────────────────────── */}
      <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none px-4 md:px-8 transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]" style={{ paddingTop: scrolled ? "16px" : "0" }}>
        <header
          id="site-navbar"
          className={`w-full transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] pointer-events-auto ${
            scrolled 
              ? "max-w-6xl bg-[#050505]/70 backdrop-blur-2xl border border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.6)]" 
              : "max-w-full bg-transparent border-transparent"
          }`}
          style={{ borderRadius: scrolled ? "40px" : "0px" }}
        >
          <div className={`transition-all duration-700 ${scrolled ? "px-6 md:px-10" : "px-4 md:px-8"}`}>
            <div className="relative flex items-center justify-between" style={{ height: scrolled ? "70px" : "80px" }}>

              {/* Left — Desktop Nav & Mobile Hamburger */}
              <div className="flex-1 flex items-center">
                <nav className="hidden md:flex items-center gap-8" aria-label="Primary navigation">
                  {navLinks.map((link) => (
                    <Link key={link.href} href={link.href} className="font-syne font-bold text-xs uppercase tracking-[0.2em] text-white/70 hover:text-white transition-colors duration-300">
                      {link.label}
                    </Link>
                  ))}
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

              {/* Center — Logo */}
              <Link
                href="/"
                className="absolute left-1/2 -translate-x-1/2 flex items-center z-10"
                aria-label="SYCHOGEAR — Home"
              >
                <Image
                  src="/images/logo-sychogear.webp"
                  alt="SYCHOGEAR"
                  width={320}
                  height={80}
                  className="w-auto opacity-100 transition-opacity duration-300 mix-blend-screen"
                  style={{ height: "clamp(20px, 4vw, 32px)", filter: "brightness(1.5)" }}
                  priority
                />
              </Link>

              {/* Right — Actions */}
              <div className="flex-1 flex items-center justify-end gap-1 sm:gap-4">
                <div className="hidden md:block border-r border-white/20 pr-4 mr-2">
                  <RegionCurrencySelector />
                </div>
                <div className="md:hidden scale-90 origin-right">
                   <RegionCurrencySelector />
                </div>
                {/* Cart */}
                <button
                  id="cart-trigger"
                  onClick={() => setCartDrawerOpen(true)}
                  className="relative p-2 text-white/80 hover:text-white transition-colors duration-300"
                  aria-label={`Cart${mounted && itemCount > 0 ? `, ${itemCount} items` : ""}`}
                >
                  <HiOutlineShoppingBag className="w-5 h-5" />
                  {mounted && itemCount > 0 && (
                    <span
                      className="absolute top-0 right-0 w-4 h-4 flex items-center justify-center bg-white text-black text-[9px] font-bold leading-none rounded-full"
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

      {/* ─── Mobile Nav — Full Screen ──────────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#020202] flex flex-col overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
          style={{ animation: "fadeIn 400ms ease-out forwards" }}
        >
          {/* Close bar */}
          <div className="flex items-center justify-between px-8 py-6 border-b border-[#111]">
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
              className="text-white hover:text-gray-400 transition-colors duration-200"
              style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: "2rem", lineHeight: 1 }}
              aria-label="Close menu"
            >
              ×
            </button>
          </div>

          {/* Nav links */}
          <nav className="flex-1 flex flex-col justify-center px-8 overflow-hidden" aria-label="Mobile navigation">
            <div>
              {navLinks.map((link, i) => (
                <div
                  key={link.href}
                  className="overflow-hidden border-b border-[#111]"
                >
                  <Link
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="block py-6 group"
                    style={{ animation: `clipRevealV 600ms ${i * 80}ms cubic-bezier(0.4, 0, 0.2, 1) both` }}
                  >
                    <span
                      className="font-syne text-white group-hover:text-gray-400 transition-colors duration-300 block"
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
          <div className="px-8 pb-12 pt-8 border-t border-[#111] flex justify-between items-center">
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
