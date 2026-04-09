import Link from "next/link";
import Image from "next/image";
import { HiOutlineMail } from "react-icons/hi";

export default function Footer() {
  return (
    <footer className="relative z-10 bg-brand-950 border-t border-white/5 pt-20 overflow-hidden">
      {/* Massive Brand Marquee or Title */}
      <div className="container-main pb-12 border-b border-white/10 relative">
        <h2 className="text-[12vw] leading-none font-marker text-white/5 tracking-tighter cursor-default select-none uppercase">
          SYCHOGEAR
        </h2>
        <div className="absolute inset-x-0 bottom-12 flex items-end justify-between px-4 sm:px-8">
           <Image
            src="/images/logo-sychogear.webp"
            alt="SYCHOGEAR Logo"
            width={400}
            height={100}
            className="h-8 md:h-12 lg:h-14 w-auto brightness-200 contrast-200"
          />
          <div className="text-right">
            <p className="text-brand-500 text-xs md:text-sm tracking-[0.2em] uppercase font-semibold">
              Premium Fight Gear
            </p>
            <p className="text-brand-600 text-[10px] sm:text-xs tracking-widest uppercase mt-1">
              Est. 2026 // VIOLENCE IS OUR AESTHETIC
            </p>
          </div>
        </div>
      </div>

      <div className="container-main py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
          
          {/* Main Info */}
          <div>
            <h4 className="text-xs font-bold tracking-[0.3em] uppercase text-white mb-6">
              SYCHOGEAR
            </h4>
            <p className="text-brand-400 text-sm leading-relaxed max-w-sm">
              Violence Is Our Aesthetic.
            </p>
          </div>

          {/* Connect */}
          <div>
            <h4 className="text-xs font-bold tracking-[0.3em] uppercase text-white mb-6">
              Connect
            </h4>
            <ul className="space-y-4">
              {/* Instagram */}
              <li>
                <a href="https://www.instagram.com/sychogear" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-brand-400 hover:text-white transition-colors group w-fit">
                  <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center group-hover:border-white/40 group-hover:bg-white group-hover:text-black transition-all">
                    <span className="sr-only">Instagram</span>
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-xs uppercase tracking-widest">@sychogear</span>
                </a>
              </li>
              
              {/* TikTok */}
              <li>
                <a href="https://www..com/@sychogearofficial" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-brand-400 hover:text-white transition-ctiktokolors group w-fit">
                  <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center group-hover:border-white/40 group-hover:bg-white group-hover:text-black transition-all">
                    <span className="sr-only">TikTok</span>
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 15.68a6.34 6.34 0 0 0 6.27 6.32 6.32 6.32 0 0 0 6.2-6.32V10.5a8.49 8.49 0 0 0 4.53 1.3V8.4a4.85 4.85 0 0 1-2.41-1.71z"/>
                    </svg>
                  </div>
                  <span className="text-xs uppercase tracking-widest">@sychogearofficial</span>
                </a>
              </li>
              <li>
                <div className="flex items-center gap-3 text-brand-400 group w-fit">
                  <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center p-2 group-hover:border-white/40 transition-colors">
                    <HiOutlineMail className="w-4 h-4" />
                  </div>
                  <span className="text-xs uppercase tracking-widest group-hover:text-white transition-colors cursor-pointer text-brand-300">sychogear@gmail.com</span>
                </div>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold tracking-[0.3em] uppercase text-white mb-6">
              Navigation
            </h4>
            <ul className="space-y-4">
              {[
                { href: "/", label: "Home" },
                { href: "/products", label: "Shop All" },
                { href: "/order-status", label: "Track Order" },
                { href: "/links", label: "Official Channels & Shopee" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-xs text-brand-400 hover:text-white tracking-widest uppercase transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[10px] tracking-widest text-brand-500 uppercase text-center md:text-left">
            © {new Date().getFullYear()} SYCHOGEAR. ALL RIGHTS RESERVED.
          </p>
          <div className="flex items-center gap-4 text-[10px] tracking-widest text-brand-600 uppercase">
            <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
            <span>/</span>
            <Link href="#" className="hover:text-white transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
