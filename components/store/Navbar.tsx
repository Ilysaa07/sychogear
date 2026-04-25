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
      <header
        id="site-navbar"
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled ? "bg-void/95 backdrop-blur-md border-b border-ember" : "bg-transparent"
        }`}
      >
        <div className="container-main">
          <div className="relative flex items-center justify-between" style={{ height: "60px" }}>

            {/* Left — Desktop Nav & Mobile Hamburger */}
            <div className="flex-1 flex items-center">
              <nav className="hidden md:flex items-center gap-8" aria-label="Primary navigation">
                {navLinks.map((link) => (
                  <Link key={link.href} href={link.href} className="nav-link">
                    {link.label}
                  </Link>
                ))}
              </nav>
              
              {/* Mobile hamburger — Now on the Left */}
              <button
                id="mobile-menu-trigger"
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 -ml-2 text-salt transition-colors duration-200 flex flex-col gap-1.5 justify-center items-center w-10 h-10"
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
                className="w-auto opacity-100 transition-opacity duration-300"
                style={{ height: "clamp(20px, 4vw, 32px)", filter: "brightness(1.1)" }}
                priority
              />
            </Link>

            {/* Right — Actions */}
            <div className="flex-1 flex items-center justify-end gap-1 sm:gap-4">
              <div className="hidden md:block border-r border-ember pr-4 mr-2">
                <RegionCurrencySelector />
              </div>
              <div className="md:hidden scale-90 origin-right">
                 <RegionCurrencySelector />
              </div>
              {/* Cart */}
              <button
                id="cart-trigger"
                onClick={() => setCartDrawerOpen(true)}
                className="relative p-2 text-salt transition-colors duration-200"
                aria-label={`Cart${mounted && itemCount > 0 ? `, ${itemCount} items` : ""}`}
              >
                <HiOutlineShoppingBag className="w-5 h-5" />
                {mounted && itemCount > 0 && (
                  <span
                    className="absolute top-1 right-1 w-3.5 h-3.5 flex items-center justify-center bg-salt text-void text-[8px] font-mono leading-none rounded-full"
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

      {/* ─── Mobile Nav — Full Screen ──────────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-void flex flex-col overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
          style={{ animation: "fadeIn 300ms ease-out forwards" }}
        >
          {/* Close bar */}
          <div className="flex items-center justify-between px-8 py-5 border-b border-ember" style={{ height: "60px" }}>
            <Link href="/" onClick={() => setMobileOpen(false)} aria-label="SYCHOGEAR — Home">
              <Image
                src="/images/logo-sychogear.webp"
                alt="SYCHOGEAR"
                width={200}
                height={50}
                className="h-7 w-auto opacity-100"
              />
            </Link>
            <button
              onClick={() => setMobileOpen(false)}
              className="text-salt transition-colors duration-200"
              style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: "1.5rem", lineHeight: 1 }}
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
                  className="overflow-hidden border-b border-ember"
                >
                  <Link
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="block py-6 group"
                    style={{ animation: `clipRevealV 600ms ${i * 80}ms var(--ease-out-expo) both` }}
                  >
                    <span
                      className="font-syne text-salt group-hover:text-pale transition-colors duration-200 block"
                      style={{ fontSize: "clamp(32px, 8vw, 64px)", lineHeight: 1.05, fontWeight: 700, textTransform: "uppercase" }}
                    >
                      {link.label}
                    </span>
                  </Link>
                </div>
              ))}
            </div>
          </nav>

          {/* Bottom social strip */}
          <div className="px-8 pb-10 pt-6 border-t border-ember flex justify-between items-center">
            <div className="flex gap-6">
              <a
                href="https://www.instagram.com/sychogear"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-link text-[10px]"
              >
                Instagram ↗
              </a>
              <a
                href="https://www.tiktok.com/@sychogearofficial"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-link text-[10px]"
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
