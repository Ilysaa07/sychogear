import Link from "next/link";
import { productRepository } from "@/repositories/product.repository";
import ProductCard from "@/components/store/ProductCard";
import CoverFlowSlider from "@/components/store/CoverFlowSlider";
import NewsletterSection from "@/components/store/NewsletterSection";
import HeroSlider from "@/components/store/HeroSlider";
import PromoModal from "@/components/store/PromoModal";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import type { ProductWithRelations } from "@/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sychogear — Official Archive",
  description: "A curated collection of premium streetwear. Explore the archive.",
};

async function getHeroSettings() {
  try {
    const settings = await prisma.siteSettings.findMany();
    const map: Record<string, string> = {};
    for (const s of settings) map[s.key] = s.value;
    return map;
  } catch { return {}; }
}

async function getNewArrivals(): Promise<ProductWithRelations[]> {
  try {
    return (await productRepository.findNewArrivals(12)) as any as ProductWithRelations[];
  } catch { return []; }
}

export default async function HomePage() {
  const [heroSettings, newArrivals] = await Promise.all([getHeroSettings(), getNewArrivals()]);

  let heroImages: string[] = [];
  try { heroImages = heroSettings.heroImages ? JSON.parse(heroSettings.heroImages) : []; }
  catch { heroImages = []; }

  const heroTagline   = heroSettings.heroTagline   || "Collection 01 — Otoriter";
  const heroSubtitle  = heroSettings.heroSubtitle  || "FORGED IN FIRE.\\nBUILT FOR\\nTHE FIRM.";
  const heroCtaText   = heroSettings.heroCtaText   || "SHOP THE DROP";
  const heroCtaUrl    = heroSettings.heroCtaUrl    || "/products";
  const heroShowContent = heroSettings.heroShowContent !== "false";
  const heroShowButtons = heroSettings.heroShowButtons !== "false";
  const marqueeText   = heroSettings.marqueeText   || "SYCHOGEAR WORLDWIDE";

  const promoSettings = {
    active:   heroSettings.promoActive === "true",
    image:    heroSettings.promoImage    || "",
    title:    heroSettings.promoTitle    || "New Arrival",
    subtitle: heroSettings.promoSubtitle || "Just dropped",
    linkUrl:  heroSettings.promoLinkUrl  || "/products",
    linkText: heroSettings.promoLinkText || "Shop Now",
  };

  const recentItems = newArrivals.slice(0, 6);

  return (
    <main className="w-full min-h-screen bg-[#111512] text-salt overflow-x-hidden">
      <PromoModal settings={promoSettings} />

      {/* ═══ HERO ═══════════════════════════════════════════════ */}
      <section
        className="relative w-full overflow-hidden"
        style={{ height: "100svh", minHeight: "620px" }}
        aria-label="Hero"
      >
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <HeroSlider images={heroImages} />
        </div>

        {/* Gradient overlay for readability */}
        <div
          className="absolute inset-0 z-[1] pointer-events-none"
          style={{
            background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 60%)",
          }}
          aria-hidden="true"
        />

        {/* Hero content */}
        {heroShowContent && (
          <div className="absolute inset-0 z-10 flex flex-col justify-end items-center pb-24 px-[var(--container-pad)] text-center">
            {/* Tagline */}
            <p
              className="mb-4 fade-in font-syne font-bold uppercase tracking-[0.2em] text-salt"
              style={{
                animationDelay: "200ms",
                fontSize: "clamp(0.75rem, 1.5vw, 1rem)",
              }}
            >
              {heroTagline}
            </p>

            {/* Headline */}
            <h1
              className="font-syne font-bold text-white mb-10 fade-in uppercase"
              style={{
                fontSize: "clamp(48px, 9vw, 120px)",
                lineHeight: 0.9,
                letterSpacing: "0.02em",
                animationDelay: "400ms",
              }}
              aria-label={heroSubtitle.replace(/\\n/g, " ")}
            >
              {heroSubtitle.split("\\n").map((line, idx) => (
                <span key={idx} className="block">{line}</span>
              ))}
            </h1>

            {/* CTA */}
            {heroShowButtons && (
              <div className="fade-in" style={{ animationDelay: "600ms" }}>
                <Link
                  href={heroCtaUrl}
                  className="btn-primary px-12 py-5 text-sm tracking-[0.25em]"
                  id="hero-cta"
                >
                  {heroCtaText}
                </Link>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ═══ MARQUEE ════════════════════════════════════════════ */}
      <div
        aria-hidden="true"
        className="w-full overflow-hidden py-4 relative bg-[#111512] text-ash border-y border-ember"
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
            animation: "page-marquee-scroll 40s linear infinite",
            willChange: "transform",
          }}
        >
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-8 px-6"
              style={{
                fontFamily: "var(--font-syne), sans-serif",
                fontSize: "1rem",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                fontWeight: "800",
              }}
            >
              <span>{marqueeText}</span>
              <span className="text-ember">✦</span>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ COVER FLOW LOOKBOOK ════════════════════════════════════════ */}
      {newArrivals.length > 0 && (
        <CoverFlowSlider products={recentItems} />
      )}



      {/* ═══ NEWSLETTER ═════════════════════════════════════════ */}
      <NewsletterSection />
    </main>
  );
}
