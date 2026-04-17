"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { HiOutlineShoppingBag } from "react-icons/hi";
import { useCartStore } from "@/stores/cart-store";
import { useUIStore } from "@/stores/ui-store";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const itemCount = useCartStore((s) => s.getItemCount());
  const setCartDrawerOpen = useUIStore((s) => s.setCartDrawerOpen);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  // Close mobile nav on escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
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
      <header
        id="site-navbar"
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled ? "navbar-glass" : "bg-transparent"
        }`}
      >
        <div className="container-main">
          <div className="relative flex items-center justify-between h-16 lg:h-20">

            {/* Left — Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8" aria-label="Primary navigation">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="nav-link"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Center — Logo (absolute centered) */}
            <Link
              href="/"
              className="absolute left-1/2 -translate-x-1/2 flex items-center"
              aria-label="SYCHOGEAR — Home"
            >
              <Image
                src="/images/logo-sychogear.webp"
                alt="SYCHOGEAR"
                width={360}
                height={90}
                className="h-8 md:h-10 lg:h-12 w-auto opacity-85 hover:opacity-100 transition-opacity duration-300"
                priority
              />
            </Link>

            {/* Right — Actions */}
            <div className="flex items-center gap-2">
              {/* Cart */}
              <button
                id="cart-trigger"
                onClick={() => setCartDrawerOpen(true)}
                className="relative p-2.5 text-ash hover:text-salt transition-colors duration-200 group"
                aria-label={`Cart${mounted && itemCount > 0 ? `, ${itemCount} items` : ""}`}
              >
                <HiOutlineShoppingBag className="w-5 h-5" />
                {mounted && itemCount > 0 && (
                  <span
                    className="absolute top-1.5 right-1.5 w-3.5 h-3.5 flex items-center justify-center
                               bg-signal text-void text-[8px] font-mono leading-none animate-pulse-once"
                    aria-hidden="true"
                  >
                    {itemCount > 9 ? "9+" : itemCount}
                  </span>
                )}
              </button>

              {/* Mobile hamburger */}
              <button
                id="mobile-menu-trigger"
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2.5 text-ash hover:text-salt transition-colors duration-200 flex flex-col gap-1.5 justify-center items-center w-10 h-10"
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileOpen}
              >
                {/* Animated hamburger — two lines morph to X */}
                <span
                  className={`block h-px w-5 bg-current transition-all duration-300 origin-center ${
                    mobileOpen ? "rotate-45 translate-y-[3.5px]" : ""
                  }`}
                />
                <span
                  className={`block h-px w-5 bg-current transition-all duration-300 origin-center ${
                    mobileOpen ? "-rotate-45 -translate-y-[3.5px]" : ""
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Mobile Nav — Full Screen Overlay ───────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-void flex flex-col fade-in"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
        >
          {/* Top bar matching navbar height */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-ember">
            <Link href="/" onClick={() => setMobileOpen(false)}>
              <Image
                src="/images/logo-sychogear.webp"
                alt="SYCHOGEAR"
                width={240}
                height={60}
                className="h-8 w-auto opacity-85"
              />
            </Link>
            <button
              onClick={() => setMobileOpen(false)}
              className="p-2 text-ash hover:text-salt transition-colors"
              aria-label="Close menu"
            >
              <span className="font-mono text-xl leading-none">×</span>
            </button>
          </div>

          {/* Nav links — large, stacked */}
          <nav className="flex-1 flex flex-col justify-center px-8" aria-label="Mobile navigation">
            <div className="space-y-2">
              {navLinks.map((link, i) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block py-4 border-b border-ember"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <span className="font-display text-5xl text-salt italic tracking-tight hover:text-signal transition-colors duration-200">
                    {link.label}
                  </span>
                </Link>
              ))}
            </div>
          </nav>

          {/* Bottom social strip */}
          <div className="px-8 pb-12 border-t border-ember pt-8">
            <p className="label-eyebrow mb-4">Connect</p>
            <div className="flex gap-6">
              <a
                href="https://www.instagram.com/sychogear"
                target="_blank"
                rel="noopener noreferrer"
                className="label-eyebrow hover:text-pale transition-colors"
              >
                Instagram
              </a>
              <a
                href="https://www.tiktok.com/@sychogearofficial"
                target="_blank"
                rel="noopener noreferrer"
                className="label-eyebrow hover:text-pale transition-colors"
              >
                TikTok
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
