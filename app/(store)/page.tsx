import Link from "next/link";
import { productRepository } from "@/repositories/product.repository";
import ProductCard from "@/components/store/ProductCard";
import NewsletterSection from "@/components/store/NewsletterSection";
import HeroSlider from "@/components/store/HeroSlider";
import PromoModal from "@/components/store/PromoModal";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sychogear — Official Website Store",
  description:
    "Explore the latest collection of premium streetwear. Hoodies, tees, jackets, and more. Designed for the bold.",
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


async function getNewArrivals() {
  try {
    return await productRepository.findNewArrivals(12);
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const [heroSettings, newArrivals] = await Promise.all([
    getHeroSettings(),
    getNewArrivals(),
  ]);

  let heroImages: string[] = [];
  try {
    heroImages = heroSettings.heroImages ? JSON.parse(heroSettings.heroImages) : [];
  } catch {
    heroImages = [];
  }

  const heroTagline = heroSettings.heroTagline || "Streetwear Collection 2026";
  const heroTitle = heroSettings.heroTitle || "WEAR YOUR IDENTITY";
  const heroSubtitle =
    heroSettings.heroSubtitle ||
    "Premium streetwear designed for those who dare to stand out. Every piece tells a story. Make it yours.";

  // Split title for styling — first line vs "accented" line
  const titleParts = heroTitle.split("\n");

  const heroShowContent = heroSettings.heroShowContent !== "false";

  const promoSettings = {
    active: heroSettings.promoActive === "true",
    image: heroSettings.promoImage || "",
    title: heroSettings.promoTitle || "LIMITED\\nDROP",
    subtitle: heroSettings.promoSubtitle || "Jangan sampai kehabisan rilisan eksklusif terbaru kami. Dapatkan sekarang sebelum sold out.",
    linkUrl: heroSettings.promoLinkUrl || "/products",
    linkText: heroSettings.promoLinkText || "Klaim Sekarang",
  };

  return (
    <>
      {/* Promotional Pop-up */}
      <PromoModal settings={promoSettings} />

      {/* Hero Section */}
      <section className="fixed inset-0 w-full h-screen flex items-center justify-center overflow-hidden -z-10">
        {/* Background Slider */}
        <HeroSlider images={heroImages} />

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/60 z-0" />


        {/* Red accent overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-950 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-600 to-transparent" />

        {/* Content */}
        {heroShowContent && (
          <div className="relative z-10 text-center container-main">
            {/* Tagline */}
            <p className="text-[10px] md:text-sm tracking-[0.4em] uppercase text-red-500 mb-6 font-semibold fade-in">
              {heroTagline}
            </p>

            {/* Title */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-marker tracking-tighter mb-6 slide-up leading-[1.1] text-white">
              {titleParts.map((part: string, i: number) =>
                i === 0 ? (
                  <span key={i}>
                    {part}
                    {titleParts.length > 1 && <br />}
                  </span>
                ) : (
                  <span
                    key={i}
                    className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-red-600 to-red-700"
                  >
                    {part}
                  </span>
                )
              )}
            </h1>

            {/* Subtitle */}
            <p className="text-brand-300 text-sm md:text-base max-w-lg mx-auto mb-10 fade-in leading-relaxed">
              {heroSubtitle}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 fade-in">
              <Link
                href="/products"
                className="inline-flex items-center justify-center px-10 py-4 bg-red-600 border border-red-600 text-white font-bold text-[10px] md:text-xs tracking-[0.2em] uppercase hover:bg-transparent hover:text-red-500 transition-all duration-300"
              >
                Shop Now
              </Link>
              <Link
                href="/products?sort=latest"
                className="inline-flex items-center justify-center px-10 py-4 border border-white/20 text-white font-bold text-[10px] md:text-xs tracking-[0.2em] uppercase hover:border-white hover:bg-white hover:text-black transition-all duration-300"
              >
                New Arrivals
              </Link>
            </div>
          </div>
        )}

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <span className="text-[10px] tracking-widest uppercase text-brand-600">
            Scroll
          </span>
          <div className="w-px h-8 bg-gradient-to-b from-red-600/60 to-transparent" />
        </div>
      </section>

      {/* Foreground Scrollable Content */}
      <div className="mt-[100vh] relative z-10 bg-brand-950 sm:rounded-t-[2.5rem] shadow-[0_-20px_50px_rgba(0,0,0,0.8)] flex flex-col">
        
        {/* Seamless Product Grid */}
        {newArrivals.length > 0 && (
          <section className="py-20 lg:py-32">
            <div className="container-main">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {newArrivals.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              <div className="mt-16 text-center fade-in">
                <Link
                  href="/products"
                  className="inline-flex items-center justify-center px-10 py-5 bg-transparent border border-white/20 text-white font-bold text-[10px] md:text-xs tracking-[0.2em] uppercase hover:bg-white hover:text-black hover:border-white transition-all duration-300 group"
                >
                  Lihat Semua Produk
                  <span className="ml-3 transform group-hover:translate-x-1 transition-transform">
                    →
                  </span>
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Newsletter */}
        <NewsletterSection />
      </div>
    </>
  );
}
