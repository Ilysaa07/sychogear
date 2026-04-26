"use client";

import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-[#000] border-t border-[#111] overflow-hidden">
      <div className="container-main py-24 px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8">
          
          {/* Brand Col */}
          <div className="md:col-span-5 flex flex-col justify-between">
            <div>
              <Image src="/images/logo-sychogear.webp" alt="SYCHOGEAR" width={200} height={50} className="w-32 h-auto mb-6 opacity-80 hover:opacity-100 transition-opacity" />
              <p className="font-dm-mono text-[10px] text-[#666] uppercase tracking-[0.2em] leading-relaxed max-w-xs">
                A curated collection for those who move in silence.
              </p>
            </div>
            
            {/* Accepted Payments */}
            <div className="mt-12 md:mt-0">
              <p className="font-dm-mono text-[9px] text-[#444] uppercase tracking-[0.3em] mb-4">Protocols</p>
              <div className="w-12 h-8 bg-white flex items-center justify-center p-1 rounded-[2px]">
                <Image src="/images/bca.png" alt="BCA" width={40} height={20} className="w-full h-auto object-contain" />
              </div>
            </div>
          </div>

          {/* Spacer */}
          <div className="hidden md:block md:col-span-1"></div>

          {/* Nav Col */}
          <div className="md:col-span-3">
            <h3 className="font-dm-mono text-[9px] text-[#444] uppercase tracking-[0.3em] mb-6">Index</h3>
            <ul className="space-y-4">
              <li><Link href="/products" className="font-syne text-[11px] font-bold uppercase tracking-widest text-[#999] hover:text-white transition-colors">Archive</Link></li>
              <li><Link href="/order-status" className="font-syne text-[11px] font-bold uppercase tracking-widest text-[#999] hover:text-white transition-colors">Track Order</Link></li>
              <li><Link href="/links" className="font-syne text-[11px] font-bold uppercase tracking-widest text-[#999] hover:text-white transition-colors">Links</Link></li>
            </ul>
          </div>

          {/* Social Col */}
          <div className="md:col-span-3">
            <h3 className="font-dm-mono text-[9px] text-[#444] uppercase tracking-[0.3em] mb-6">Network</h3>
            <ul className="space-y-4">
              <li><a href="https://www.instagram.com/sychogear" target="_blank" rel="noopener noreferrer" className="font-syne text-[11px] font-bold uppercase tracking-widest text-[#999] hover:text-white transition-colors">Instagram ↗</a></li>
              <li><a href="https://www.tiktok.com/@sychogearofficial" target="_blank" rel="noopener noreferrer" className="font-syne text-[11px] font-bold uppercase tracking-widest text-[#999] hover:text-white transition-colors">TikTok ↗</a></li>
              <li><a href="mailto:sychogear@gmail.com" className="font-syne text-[11px] font-bold uppercase tracking-widest text-[#999] hover:text-white transition-colors">Email ↗</a></li>
            </ul>
          </div>

        </div>
      </div>

      {/* Massive Footer Typography */}
      <div className="w-full overflow-hidden border-t border-[#111] flex flex-col items-center justify-center pt-12 pb-8 px-4">
         <h1 className="font-syne font-black text-[#111] leading-none select-none text-center" style={{ fontSize: "clamp(40px, 18vw, 300px)", letterSpacing: "-0.05em" }}>
           SYCHOGEAR
         </h1>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-[#111] py-6 px-6 md:px-12 bg-[#020202]">
        <div className="container-main flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <p className="font-dm-mono text-[9px] tracking-[0.3em] uppercase text-[#555]">
            © {currentYear} SYCHOGEAR. ALL RIGHTS RESERVED.
          </p>
          <div className="flex items-center justify-center gap-6 font-dm-mono text-[9px] tracking-[0.3em] uppercase text-[#555]">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
