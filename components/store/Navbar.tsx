"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { HiOutlineShoppingBag, HiOutlineMenu, HiOutlineX } from "react-icons/hi";
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
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/products", label: "Shop" },
    { href: "/order-status", label: "Track Order" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "navbar-glass border-b border-white/5"
          : "bg-transparent"
      }`}
    >
      {/* Red accent line at top */}
      <div className="h-[2px] bg-gradient-to-r from-transparent via-red-600 to-transparent" />

      <div className="container-main">
        <div className="relative flex items-center justify-between h-16 lg:h-20">
          {/* Left — Desktop Nav */}
          <nav className="hidden md:flex items-center gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="nav-link relative px-4 py-2 text-xs lg:text-sm font-bold tracking-[0.2em] uppercase text-brand-400 hover:text-white transition-all duration-300 group"
              >
                {link.label}
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-red-600 group-hover:w-full transition-all duration-300" />
              </Link>
            ))}
          </nav>

          {/* Center — Logo (absolute centered) */}
          <Link href="/" className="absolute left-1/2 -translate-x-1/2 flex items-center group">
            <div className="relative group">
              <Image
                src="/images/logo-sychogear.webp"
                alt="SYCHOGEAR"
                width={400}
                height={100}
                className="h-10 md:h-12 lg:h-16 w-auto animate-red-glow-continuous"
                priority
              />
            </div>
            <div className="absolute inset-0 bg-red-600/0 group-hover:bg-red-600/5 blur-2xl transition-all duration-500 -z-10" />
          </Link>

          {/* Right — Actions */}
          <div className="flex items-center gap-3">
            {/* Mobile Menu Toggle (left side on mobile) */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-3 text-brand-400 hover:text-white transition-colors"
              aria-label="Menu"
            >
              {mobileOpen ? (
                <HiOutlineX className="w-6 h-6" />
              ) : (
                <HiOutlineMenu className="w-6 h-6" />
              )}
            </button>

            {/* Cart Button */}
            <button
              onClick={() => setCartDrawerOpen(true)}
              className="relative p-3 text-brand-400 hover:text-white transition-all duration-300 group"
              aria-label="Cart"
            >
              <HiOutlineShoppingBag className="w-6 h-6" />
              {mounted && itemCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center bg-red-600 text-white text-[9px] font-black rounded-full shadow-lg shadow-red-600/40 animate-pulse-once">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <nav className="md:hidden pb-4 border-t border-white/5 fade-in">
            {navLinks.map((link, i) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 py-3.5 text-sm font-semibold tracking-[0.2em] uppercase text-brand-400 hover:text-white transition-colors group"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <span className="w-1.5 h-1.5 bg-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                {link.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
