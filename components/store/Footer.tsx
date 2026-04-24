"use client";

import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/products", label: "Archive" },
    { href: "/order-status", label: "Track Order" },
    { href: "/links", label: "Channels & Marketplaces" },
  ];

  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative z-10 bg-[#111512] overflow-hidden border-t border-ember">

      {/* ─── Content grid ──────────────────────────────────── */}
      <div className="container-main relative z-10 pt-20 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-16 md:gap-8">

          {/* Brand column — 5/12 */}
          <div className="md:col-span-5">
            <Link href="/" aria-label="SYCHOGEAR — Home" className="inline-block mb-8">
              <Image
                src="/images/logo-sychogear.webp"
                alt="SYCHOGEAR"
                width={260}
                height={65}
                className="h-8 w-auto opacity-90 hover:opacity-100 transition-opacity duration-300"
              />
            </Link>

            <p className="font-dm-mono text-xs text-ash leading-relaxed max-w-[300px] mb-10">
              A curated collection for those who move in silence. Premium streetwear from the underground.
            </p>

            {/* Social links */}
            <div className="space-y-4">
              {[
                { href: "https://www.instagram.com/sychogear", label: "Instagram", ariaLabel: "Sychogear on Instagram" },
                { href: "https://www.tiktok.com/@sychogearofficial", label: "TikTok", ariaLabel: "Sychogear on TikTok" },
                { href: "mailto:sychogear@gmail.com", label: "Email", ariaLabel: "Email Sychogear" },
              ].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  target={item.href.startsWith("http") ? "_blank" : undefined}
                  rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  aria-label={item.ariaLabel}
                  className="block font-syne font-bold text-[10px] tracking-widest uppercase text-ash hover:text-salt transition-colors w-fit"
                >
                  {item.label} <span className="ml-1 opacity-50">↗</span>
                </a>
              ))}
            </div>
          </div>

          {/* Vertical rule */}
          <div className="hidden md:block md:col-span-1 border-r border-ember mx-auto h-full" aria-hidden="true" />

          {/* Navigate column — 3/12 */}
          <div className="md:col-span-3">
            <p className="font-syne font-bold text-[10px] tracking-widest uppercase text-ash mb-6 pb-2 border-b border-ember">
              Navigate
            </p>
            <ul className="space-y-4">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="block font-dm-mono text-xs text-salt hover:text-ash transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact column — 3/12 */}
          <div className="md:col-span-3">
            <p className="font-syne font-bold text-[10px] tracking-widest uppercase text-ash mb-6 pb-2 border-b border-ember">
              Contact
            </p>
            <ul className="space-y-4">
              <li>
                <a
                  href="mailto:sychogear@gmail.com"
                  className="block font-dm-mono text-xs text-salt hover:text-ash transition-colors"
                >
                  sychogear@gmail.com
                </a>
              </li>
              <li>
                <a
                  href="https://www.instagram.com/sychogear"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block font-dm-mono text-xs text-salt hover:text-ash transition-colors"
                >
                  @sychogear
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* ─── Giant wordmark watermark ───────────────────────── */}
      <div className="relative w-full overflow-hidden select-none pointer-events-none mt-10 border-t border-ember pt-12" aria-hidden="true">
        <p
          className="font-syne font-bold leading-none tracking-tighter text-salt whitespace-nowrap text-center opacity-[0.03]"
          style={{ fontSize: "clamp(80px, 18vw, 240px)", padding: "0 2vw" }}
        >
          SYCHOGEAR
        </p>
      </div>

      {/* ─── Bottom bar ─────────────────────────────────────── */}
      <div className="border-t border-ember">
        <div className="container-main py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-dm-mono text-[10px] tracking-widest uppercase text-ash">
            © {currentYear} SYCHOGEAR. All rights reserved.
          </p>
          <div className="flex items-center gap-6 font-dm-mono text-[10px] tracking-widest uppercase text-ash">
            <Link href="#" className="hover:text-salt transition-colors">Privacy</Link>
            <span aria-hidden="true">/</span>
            <Link href="#" className="hover:text-salt transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
