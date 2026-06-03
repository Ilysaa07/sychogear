"use client";

import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-void">
      <div className="container-main py-4 px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="font-sans font-bold text-[8px] tracking-[0.3em] uppercase text-salt">
          © {currentYear} SYCHOGEAR.
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
