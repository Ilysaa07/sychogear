import { productRepository } from "@/repositories/product.repository";
import CoverFlowSlider from "@/components/store/CoverFlowSlider";
import NewsletterSection from "@/components/store/NewsletterSection";
import HeroSlider from "@/components/store/HeroSlider";
import PromoModal from "@/components/store/PromoModal";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import type { ProductWithRelations } from "@/types";
import HomePageClient from "@/components/store/HomePageClient";

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

  const heroTagline = heroSettings.heroTagline || "Collection 01 — Otoriter";
  const heroSubtitle = heroSettings.heroSubtitle || "FORGED IN FIRE.\\nBUILT FOR\\nTHE FIRM.";
  const heroCtaText = heroSettings.heroCtaText || "SHOP THE DROP";
  const heroCtaUrl = heroSettings.heroCtaUrl || "/products";
  const heroShowContent = heroSettings.heroShowContent !== "false";
  const heroShowButtons = heroSettings.heroShowButtons !== "false";
  const marqueeText = heroSettings.marqueeText || "SYCHOGEAR WORLDWIDE";

  const promoSettings = {
    active: heroSettings.promoActive === "true",
    image: heroSettings.promoImage || "",
    title: heroSettings.promoTitle || "New Arrival",
    subtitle: heroSettings.promoSubtitle || "Just dropped",
    linkUrl: heroSettings.promoLinkUrl || "/products",
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

        {/* Gradient overlay */}
        <div
          className="absolute inset-0 z-[1] pointer-events-none"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 60%)" }}
          aria-hidden="true"
        />

        {/* Hero content with magnetic CTA */}
        {heroShowContent && (
          <HomePageClient
            heroTagline={heroTagline}
            heroSubtitle={heroSubtitle}
            heroCtaText={heroCtaText}
            heroCtaUrl={heroCtaUrl}
            heroShowButtons={heroShowButtons}
          />
        )}
      </section>

      {/* ═══ COVER FLOW LOOKBOOK ════════════════════════════════════════ */}
      {newArrivals.length > 0 && (
        <CoverFlowSlider products={recentItems} marqueeText={marqueeText} />
      )}

      {/* ═══ NEWSLETTER ═════════════════════════════════════════ */}
      <NewsletterSection />
    </main>
  );
}
