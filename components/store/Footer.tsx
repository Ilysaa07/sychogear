import Link from "next/link";
import Image from "next/image";
import { HiOutlineMail } from "react-icons/hi";

export default function Footer() {
  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/products", label: "Archive" },
    { href: "/order-status", label: "Track Order" },
    { href: "/links", label: "Channels & Marketplaces" },
  ];

  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative z-10 bg-abyss border-t border-ember pt-24 pb-0 overflow-hidden">

      {/* ─── Content grid ────────────────────────────────── */}
      <div className="container-main relative z-10 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8">

          {/* Brand column — spans 5 of 12 */}
          <div className="md:col-span-5">
            <Link href="/" aria-label="SYCHOGEAR — Home">
              <Image
                src="/images/logo-sychogear.webp"
                alt="SYCHOGEAR"
                width={280}
                height={70}
                className="h-9 w-auto opacity-80 hover:opacity-100 transition-opacity duration-300 mb-8"
              />
            </Link>
            <p
              className="font-mono text-sm text-ash leading-relaxed max-w-xs"
              style={{ fontFamily: "var(--font-dm-mono), monospace" }}
            >
              A curated collection for those who move in silence.
              <br />
              Premium streetwear from the underground.
            </p>

            {/* Social links */}
            <div className="mt-8 flex items-center gap-6">
              <a
                href="https://www.instagram.com/sychogear"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-link text-[10px]"
                aria-label="Sychogear on Instagram"
              >
                Instagram ↗
              </a>
              <a
                href="https://www.tiktok.com/@sychogearofficial"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-link text-[10px]"
                aria-label="Sychogear on TikTok"
              >
                TikTok ↗
              </a>
              <a
                href="mailto:sychogear@gmail.com"
                className="btn-link text-[10px]"
                aria-label="Email Sychogear"
              >
                Email ↗
              </a>
            </div>
          </div>

          {/* Spacer column */}
          <div className="hidden md:block md:col-span-2" />

          {/* Navigation column — spans 2 of 12 */}
          <div className="md:col-span-2">
            <p className="label-syne mb-6">Navigate</p>
            <ul className="space-y-4">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="btn-link">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact column — spans 3 of 12 */}
          <div className="md:col-span-3">
            <p className="label-syne mb-6">Contact</p>
            <ul className="space-y-4">
              <li>
                <a
                  href="mailto:sychogear@gmail.com"
                  className="flex items-center gap-2 btn-link"
                >
                  <HiOutlineMail className="w-3.5 h-3.5 flex-shrink-0" />
                  sychogear@gmail.com
                </a>
              </li>
              <li>
                <a
                  href="https://www.instagram.com/sychogear"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-link"
                >
                  @sychogear
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* ─── Watermark wordmark ─────────────────────────────
          Massive, near-invisible — anchors the footer visually.
          Hidden on mobile to avoid clutter.
          ─────────────────────────────────────────────────── */}
      <div
        className="hidden md:block relative w-full overflow-hidden select-none pointer-events-none"
        aria-hidden="true"
      >
        <div className="section-divider" />
        <p
          className="font-display leading-none tracking-tight text-salt whitespace-nowrap"
          style={{
            fontSize: "clamp(100px, 18vw, 240px)",
            opacity: 0.055,
            paddingLeft: "var(--container-pad)",
            paddingBottom: "0",
            lineHeight: "0.85",
            /* Slight bleed at right edge is intentional */
          }}
        >
          SYCHOGEAR
        </p>
      </div>

      {/* ─── Bottom bar ─────────────────────────────────── */}
      <div className="border-t border-ember">
        <div className="container-main py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p
            className="text-fog"
            style={{
              fontFamily: "var(--font-dm-mono), monospace",
              fontSize: "0.625rem",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
            }}
          >
            © {currentYear} SYCHOGEAR. All rights reserved.
          </p>
          <div
            className="flex items-center gap-5 text-fog"
            style={{
              fontFamily: "var(--font-dm-mono), monospace",
              fontSize: "0.625rem",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
            }}
          >
            <Link href="#" className="hover:text-pale transition-colors duration-200">
              Privacy
            </Link>
            <span aria-hidden="true">/</span>
            <Link href="#" className="hover:text-pale transition-colors duration-200">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
