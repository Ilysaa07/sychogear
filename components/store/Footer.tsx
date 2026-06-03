"use client";

import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 bg-void border-t border-salt/20 shadow-md">
      <div className="container-main py-4 px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="font-sans font-bold text-[8px] tracking-[0.3em] uppercase text-salt">
          © {currentYear} SYCHO FIGHT GEAR.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-6 font-sans font-bold text-[8px] tracking-[0.3em] uppercase text-salt">
          <Link href="/order-status" className="hover:text-signal transition-none">Track Order</Link>
          <a href="https://www.instagram.com/sychogear" target="_blank" rel="noopener noreferrer" className="hover:text-signal transition-none">Instagram</a>
          <Link href="/terms" className="hover:text-signal transition-none">Terms</Link>
        </div>
      </div>
    </footer>
  );
}
