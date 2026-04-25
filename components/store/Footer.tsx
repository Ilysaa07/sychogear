"use client";

import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  const navLinks = [
    { href: "/products", label: "Archive" },
    { href: "/order-status", label: "Track Order" },
    { href: "/links", label: "Links" },
  ];

  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative z-10 bg-void overflow-hidden border-t border-ember pt-16">
      <div className="container-main relative z-10 pb-12">
        <div className="flex flex-col md:flex-row justify-between items-start gap-12">
          
          {/* Brand & Intro */}
          <div className="max-w-[300px]">
            <Link href="/" aria-label="SYCHOGEAR — Home" className="inline-block mb-6">
              <Image
                src="/images/logo-sychogear.webp"
                alt="SYCHOGEAR"
                width={300}
                height={75}
                className="h-10 w-auto opacity-90 hover:opacity-100 transition-opacity duration-300"
              />
            </Link>
            <p className="font-dm-mono text-[10px] text-ash leading-relaxed mb-8 uppercase tracking-widest mt-2">
              A curated collection for those who move in silence.
            </p>
            
            {/* Payment Protocols */}
            <div>
              <p className="font-dm-mono text-[9px] text-fog uppercase tracking-[0.2em] mb-3">Accepted Protocols</p>
              <div className="flex items-center gap-3">
                <div className="w-14 h-auto bg-white flex items-center justify-center p-1.5 blade-cut">
                  <Image src="/images/bca.png" alt="BCA" width={48} height={24} className="w-full h-auto object-contain" />
                </div>
                {/* Additional payment methods can be added here in the future */}
              </div>
            </div>
          </div>

          {/* Links Grid */}
          <div className="grid grid-cols-2 gap-12 md:gap-24 w-full md:w-auto mt-8 md:mt-0">
            {/* Navigate */}
            <div>
              <p className="font-syne font-bold text-[10px] tracking-widest uppercase text-salt mb-6">
                Navigate
              </p>
              <ul className="space-y-4">
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="block font-dm-mono text-[11px] text-ash hover:text-salt transition-colors uppercase tracking-widest"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Connect */}
            <div>
              <p className="font-syne font-bold text-[10px] tracking-widest uppercase text-salt mb-6">
                Connect
              </p>
              <ul className="space-y-4">
                <li>
                  <a href="https://www.instagram.com/sychogear" target="_blank" rel="noopener noreferrer" className="block font-dm-mono text-[11px] text-ash hover:text-salt transition-colors uppercase tracking-widest">
                    Instagram ↗
                  </a>
                </li>
                <li>
                  <a href="https://www.tiktok.com/@sychogearofficial" target="_blank" rel="noopener noreferrer" className="block font-dm-mono text-[11px] text-ash hover:text-salt transition-colors uppercase tracking-widest">
                    TikTok ↗
                  </a>
                </li>
                <li>
                  <a href="mailto:sychogear@gmail.com" className="block font-dm-mono text-[11px] text-ash hover:text-salt transition-colors uppercase tracking-widest">
                    Email ↗
                  </a>
                </li>
              </ul>
            </div>
          </div>

        </div>
      </div>

      {/* ─── Bottom bar ─────────────────────────────────────── */}
      <div className="border-t border-ember">
        <div className="container-main py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-dm-mono text-[9px] tracking-[0.2em] uppercase text-fog">
            © {currentYear} SYCHOGEAR. ALL RIGHTS RESERVED.
          </p>
          <div className="flex items-center gap-6 font-dm-mono text-[9px] tracking-[0.2em] uppercase text-fog">
            <Link href="/privacy" className="hover:text-ash transition-colors">Privacy</Link>
            <span aria-hidden="true">/</span>
            <Link href="/terms" className="hover:text-ash transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
