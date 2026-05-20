"use client";

import Link from "next/link";
import { useMagnetic } from "@/hooks/useMagnetic";

interface HomePageClientProps {
  heroTagline: string;
  heroSubtitle: string;
  heroCtaText: string;
  heroCtaUrl: string;
  heroShowButtons: boolean;
}

export default function HomePageClient({
  heroTagline,
  heroSubtitle,
  heroCtaText,
  heroCtaUrl,
  heroShowButtons,
}: HomePageClientProps) {
  const magnetic = useMagnetic(0.4);

  return (
    <div className="absolute inset-0 z-10 flex flex-col justify-end items-center pb-24 px-[var(--container-pad)] text-center">
      {/* Tagline */}
      <p
        className="mb-4 fade-in font-syne font-bold uppercase tracking-[0.2em] text-salt"
        style={{ animationDelay: "200ms", fontSize: "clamp(0.75rem, 1.5vw, 1rem)" }}
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

      {/* CTA — Magnetic */}
      {heroShowButtons && (
        <div
          className="fade-in"
          style={{ animationDelay: "600ms" }}
        >
          <Link
            ref={magnetic.ref as React.Ref<HTMLAnchorElement>}
            href={heroCtaUrl}
            onMouseMove={magnetic.onMouseMove as any}
            onMouseLeave={magnetic.onMouseLeave}
            className="btn-primary px-12 py-5 text-sm tracking-[0.25em] inline-block"
            id="hero-cta"
            style={{ display: "inline-flex" }}
          >
            {heroCtaText}
          </Link>
        </div>
      )}
    </div>
  );
}
