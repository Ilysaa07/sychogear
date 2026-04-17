import type { Metadata } from "next";
import { Cormorant_Garamond, Syne, DM_Mono, Metal_Mania, Rubik_Glitch } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "react-hot-toast";

/* ─── DISPLAY — Cormorant Garamond ─────────────────────────
   Role: Hero headings, product names, editorial statements
   Using italic at display scale — weight comes from contrast
   ──────────────────────────────────────────────────────── */
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display-cormorant",
  display: "swap",
});

const metalMania = Metal_Mania({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-metal",
  display: "swap",
});

const rubikGlitch = Rubik_Glitch({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-glitch",
  display: "swap",
});

/* ─── LABEL / NAV — Syne ────────────────────────────────────
   Role: Navigation, section labels, buttons, UI chrome
   ──────────────────────────────────────────────────────── */
const syne = Syne({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-syne",
  display: "swap",
});

/* ─── UTILITY / MONO — DM Mono ──────────────────────────────
   Role: Prices, metadata, form labels, captions, order IDs
   Cold, clinical, precise.
   ──────────────────────────────────────────────────────── */
const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  variable: "--font-dm-mono",
  display: "swap",
});

/* ─── ACCENT — Hooligan (local) ─────────────────────────────
   Role: Retained as a secret weapon. Use sparingly —
   only for flash sale events and easter eggs.
   ──────────────────────────────────────────────────────── */
const hooliganFont = localFont({
  src: "../public/fonts/hooligan.ttf",
  variable: "--font-hooligan",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Sychogear — Official Archive",
    template: "%s | SYCHOGEAR",
  },
  description:
    "Sychogear. A curated collection of premium streetwear for those who move in silence. Explore the archive.",
  keywords: [
    "streetwear",
    "clothing brand",
    "fashion",
    "hoodies",
    "tees",
    "premium",
    "SYCHOGEAR",
    "avant-garde",
  ],
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: "SYCHOGEAR",
    title: "SYCHOGEAR — Official Archive",
    description:
      "A curated collection of premium streetwear. Designed for those who move in silence.",
  },
  icons: {
    icon: [
      { url: "/images/favicon_io/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/images/favicon_io/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    shortcut: "/images/favicon_io/favicon.ico",
    apple: [
      { url: "/images/favicon_io/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      { rel: "icon", url: "/images/favicon_io/android-chrome-192x192.png", sizes: "192x192" },
      { rel: "icon", url: "/images/favicon_io/android-chrome-512x512.png", sizes: "512x512" },
    ],
  },
  manifest: "/images/favicon_io/site.webmanifest",
  robots: {
    index: true,
    follow: true,
  },
  twitter: {
    card: "summary_large_image",
    title: "SYCHOGEAR — Official Archive",
    description: "A curated collection of premium streetwear. Designed for those who move in silence.",
    images: ["/images/og-image.jpg"],
  },
  alternates: {
    canonical: process.env.NEXT_PUBLIC_APP_URL || "https://sychogear.com",
  },
};

import LenisProvider from "@/components/store/LenisProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "SYCHOGEAR",
    "url": process.env.NEXT_PUBLIC_APP_URL || "https://sychogear.com",
    "logo": `${process.env.NEXT_PUBLIC_APP_URL || "https://sychogear.com"}/images/logo.png`,
    "sameAs": [
      "https://instagram.com/sychogear",
      "https://tiktok.com/@sychogearofficial",
    ],
  };

  return (
    <html lang="id">
      <head />
      <body
        className={`
          antialiased
          ${cormorant.variable}
          ${syne.variable}
          ${dmMono.variable}
          ${hooliganFont.variable}
          ${metalMania.variable}
          ${rubikGlitch.variable}
          bg-void text-salt min-h-screen relative overflow-x-hidden
        `}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        {/* Global grain overlay — fixed, always on */}
        <div className="atmospheric-grain" aria-hidden="true" />

        <LenisProvider>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: "var(--abyss)",
                color: "var(--pale)",
                border: "1px solid var(--ember)",
                borderRadius: "0",
                fontSize: "0.75rem",
                fontFamily: "var(--font-dm-mono), monospace",
                letterSpacing: "0.05em",
                padding: "12px 16px",
                boxShadow: "none",
              },
              success: {
                style: {
                  borderLeft: "2px solid var(--success)",
                },
                iconTheme: {
                  primary: "var(--success)",
                  secondary: "var(--abyss)",
                },
              },
              error: {
                style: {
                  borderLeft: "2px solid var(--error)",
                },
                iconTheme: {
                  primary: "var(--error)",
                  secondary: "var(--abyss)",
                },
              },
            }}
          />
        </LenisProvider>
      </body>
    </html>
  );
}
