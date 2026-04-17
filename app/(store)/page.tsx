import Link from "next/link";
import { productRepository } from "@/repositories/product.repository";
import ProductCard from "@/components/store/ProductCard";
import NewsletterSection from "@/components/store/NewsletterSection";
import HeroSlider from "@/components/store/HeroSlider";
import PromoModal from "@/components/store/PromoModal";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import type { ProductWithRelations } from "@/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sychogear — Official Archive",
  description:
    "A curated collection of premium streetwear. Explore the archive.",
};

async function getHeroSettings() {
  try {
    const settings = await prisma.siteSettings.findMany();
    const map: Record<string, string> = {};
    for (const s of settings) map[s.key] = s.value;
    return map;
  } catch {
    return {};
  }
}

async function getNewArrivals(): Promise<ProductWithRelations[]> {
  try {
    return (await productRepository.findNewArrivals(
      12
    )) as any as ProductWithRelations[];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const [heroSettings, newArrivals] = await Promise.all([
    getHeroSettings(),
    getNewArrivals(),
  ]);  let heroImages: string[] = [];
  try {
    heroImages = heroSettings.heroImages
      ? JSON.parse(heroSettings.heroImages)
      : [];
  } catch {
    heroImages = [];
  }

  const heroTagline    = heroSettings.heroTagline   || "Collection 01 — Otoriter";
  const heroSubtitle   = heroSettings.heroSubtitle  || "FORGED IN FIRE.\\nBUILT FOR\\nTHE FIRM.";
  const heroCtaText    = heroSettings.heroCtaText   || "EXPLORE THE ARCHIVE";
  const heroCtaUrl     = heroSettings.heroCtaUrl    || "/products";
  const heroShowContent  = heroSettings.heroShowContent  !== "false";
  const heroShowButtons  = heroSettings.heroShowButtons  !== "false";
  const marqueeText      = heroSettings.marqueeText      || "";

  const promoSettings = {
    active:   heroSettings.promoActive === "true",
    image:    heroSettings.promoImage    || "",
    title:    heroSettings.promoTitle    || "New Arrival",
    subtitle: heroSettings.promoSubtitle || "Just dropped",
    linkUrl:  heroSettings.promoLinkUrl  || "/products",
    linkText: heroSettings.promoLinkText || "Explore",
  };

  return (
    <main className="w-full min-h-screen bg-void text-salt overflow-x-hidden">
      <PromoModal settings={promoSettings} />

      {/* ═══════════════════════════════════════════════
          HERO — Full Viewport, Bottom-Left Anchored.
          ════════════════════════════════════════════ */}
      <section
        className="relative w-full overflow-hidden"
        style={{ height: "100svh", minHeight: "620px" }}
        aria-label="Hero"
      >
        {/* ── Background ── */}
        <div className="absolute inset-0 z-0">
          <HeroSlider images={heroImages} />
        </div>

        {/* Left-heavy gradient: text stays legible, right stays cinematic */}
        <div
          className="absolute inset-0 z-[1] pointer-events-none"
          style={{
            background: [
              "linear-gradient(to right,  rgba(8,8,8,0.96) 0%,  rgba(8,8,8,0.7) 45%, rgba(8,8,8,0.2) 100%)",
              "linear-gradient(to top,    rgba(8,8,8,1.00) 0%,  transparent 35%)",
              "linear-gradient(to bottom, rgba(8,8,8,0.60) 0%,  transparent 20%)",
            ].join(", "),
          }}
          aria-hidden="true"
        />

        {/* ── Hero content block — Minimalist, Premium, Harmonious ── */}
        {heroShowContent && (
          <div
            className="absolute inset-0 z-10 container-main flex flex-col justify-end pb-20 sm:pb-32"
          >
            <div className="max-w-4xl fade-in" style={{ animationDelay: "200ms" }}>
              {/* Premium Eyebrow / Tagline */}
              <div className="inline-flex items-center gap-3 mb-6 px-4 py-2 border border-white/10 bg-black/20 backdrop-blur-sm rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-red-600" style={{ background: "var(--signal, #dc2626)" }} />
                <p className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.25em] text-white/90">
                  {heroTagline}
                </p>
              </div>

              {/* Minimalist & Harmonious Headline */}
              <h1
                className="font-display text-white mb-10 drop-shadow-lg"
                style={{
                  fontSize: "clamp(42px, 8vw, 110px)",
                  lineHeight: 1.05,
                  letterSpacing: "0.02em",
                }}
                aria-label={heroSubtitle.replace(/\\n/g, " ")}
              >
                {heroSubtitle.split("\\n").map((line, idx) => (
                  <span key={idx} className="block">
                    {line}
                  </span>
                ))}
              </h1>

              {/* Premium CTA Button */}
              {heroShowButtons && (
                <div className="flex items-center gap-4">
                  <Link
                    href={heroCtaUrl}
                    className="group blade-cut relative inline-flex items-center justify-center px-8 lg:px-10 py-4 font-mono text-xs uppercase tracking-[0.2em] text-white border border-white/20 bg-black/40 backdrop-blur-md overflow-hidden transition-all duration-500 hover:border-white/60"
                    id="hero-cta"
                  >
                    <span className="relative z-10 flex items-center gap-3 transition-colors duration-500 group-hover:text-black">
                      {heroCtaText}
                      <span className="group-hover:translate-x-1 transition-transform duration-500">→</span>
                    </span>
                    <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)]" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Slide count — bottom right ── */}
        {heroImages.length > 1 && (
          <div
            className="absolute bottom-8 right-10 z-10 pointer-events-none fade-in"
            style={{ animationDelay: "1500ms" }}
            aria-hidden="true"
          >
            <p
              style={{
                fontFamily: "var(--font-dm-mono), monospace",
                fontSize: "9px",
                letterSpacing: "0.3em",
                color: "var(--fog)",
                textTransform: "uppercase",
              }}
            >
              01 / {String(heroImages.length).padStart(2, "0")}
            </p>
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════════════
          MARQUEE — Admin Controlled (Red Background, Black Text)
          ════════════════════════════════════════════ */}
      <div
        aria-hidden="true"
        className="w-full overflow-hidden py-4 bg-red-600 border-y border-red-700 relative"
      >
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes page-marquee-scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}} />
        <div
          style={{
            display: "flex",
            gap: 0,
            whiteSpace: "nowrap",
            width: "max-content",
            animation: "page-marquee-scroll 200s linear infinite",
            willChange: "transform"
          }}
        >
          {[...Array(16)].map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-10 px-5"
              style={{
                fontFamily: "var(--font-dm-mono), monospace",
                fontSize: "0.75rem",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "#000000",
                fontWeight: "700"
              }}
            >
              <span>{marqueeText}</span>
              <span className="text-black/40 flex items-center justify-center">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="20" height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M2.5 19.5l3-3-1-1-3 3 1 1ZM6.5 15.5l14-11c.7-.7 1.5-.5 1.5.5s-.3 1.5-1 2l-11 12-3.5-3.5Z" />
                  <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                </svg>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          NEW ARRIVALS — Curated grid section
          ════════════════════════════════════════════ */}
      {newArrivals.length > 0 && (
        <section
          className="relative"
          style={{ padding: "clamp(80px, 12vw, 140px) 0" }}
          aria-label="New Arrivals"
        >
          <div className="container-main">
            {/* Section header — Elegant & Simple */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-14 reveal border-b border-white/5 pb-6">
              <div>
                <p className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.25em] text-white/50 mb-3">
                  Latest Releases
                </p>
                <h2
                  className="font-display text-white"
                  style={{
                    fontSize: "clamp(36px, 5vw, 72px)",
                    lineHeight: 1.05,
                    letterSpacing: "0.02em",
                  }}
                >
                  THE DROP
                </h2>
              </div>
              <Link
                href="/products"
                className="group flex items-center gap-3 text-[10px] sm:text-xs font-mono uppercase tracking-[0.2em] text-white/70 hover:text-white transition-colors duration-300 sm:pb-2"
              >
                <span>View Collection</span>
                <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
              </Link>
            </div>

            {/* Product grid */}
            <div
              className="grid gap-px"
              style={{
                gridTemplateColumns:
                  "repeat(auto-fill, minmax(min(100%, 280px), 1fr))",
              }}
            >
              {newArrivals.slice(0, 9).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* "See more" link below grid */}
            {newArrivals.length >= 9 && (
              <div className="flex justify-center mt-16 reveal">
                <Link href="/products" className="btn-ghost py-4 px-12">
                  VIEW ALL GEAR
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════
          MANIFESTO — Split-panel brand statement
          ════════════════════════════════════════════ */}
      <section
        className="relative bg-abyss border-t border-ember overflow-hidden"
        style={{ padding: "clamp(80px, 14vw, 160px) 0" }}
        aria-label="Brand manifesto"
      >
        <div
          className="container-main manifesto-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1px 1fr",
            gap: "clamp(40px, 6vw, 80px)",
            alignItems: "center",
          }}
        >
          {/* Left — atmospheric block */}
          <div className="reveal">
            <p
              style={{
                fontFamily: "var(--font-dm-mono), monospace",
                fontSize: "0.625rem",
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: "var(--fog)",
                marginBottom: "clamp(24px, 4vw, 48px)",
              }}
            >
              § 02 // THE FIRM
            </p>
            <h2
              className="font-display text-salt"
              style={{
                fontSize: "clamp(36px, 5.5vw, 80px)",
                lineHeight: 0.92,
                letterSpacing: "0.03em",
              }}
            >
              WE DON&apos;T
              <br />
              MAKE
              <br />
              SPORTSWEAR.
            </h2>
          </div>

          {/* Vertical rule */}
          <div
            className="manifesto-rule"
            aria-hidden="true"
            style={{
              width: "1px",
              height: "100%",
              minHeight: "200px",
              background: "var(--ember)",
              alignSelf: "stretch",
            }}
          />

          {/* Right — copy + CTA */}
          <div className="reveal">
            <p
              style={{
                fontFamily: "var(--font-dm-mono), monospace",
                fontSize: "0.875rem",
                color: "var(--pale)",
                lineHeight: 1.9,
                letterSpacing: "0.03em",
                maxWidth: "420px",
                marginBottom: "clamp(32px, 5vw, 56px)",
              }}
            >
              Gear for men who don&apos;t ask permission.
              <br />
              Terrace-forged. Street-worn.
              <br />
              Built to last, not to impress.
            </p>
            <Link href="/products" className="btn-link text-xs">
              EXPLORE THE FIRM →
            </Link>
          </div>
        </div>

        {/* Ghost atmospheric number */}
        <div
          className="absolute right-0 bottom-0 select-none pointer-events-none"
          aria-hidden="true"
          style={{
            fontFamily: "var(--font-glitch), system-ui, sans-serif",
            fontSize: "clamp(200px, 30vw, 400px)",
            lineHeight: 1,
            color: "var(--salt)",
            opacity: 0.02,
            letterSpacing: "-0.04em",
          }}
        >
          02
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          NEWSLETTER
          ════════════════════════════════════════════ */}
      <NewsletterSection />
    </main>
  );
}
