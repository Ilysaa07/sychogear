import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const karla = Inter({
  subsets: ["latin"],
  variable: "--font-karla",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Sychogear — Official Products",
    template: "%s | SYCHOGEAR",
  },
  description:
    "Sychogear. A curated collection of premium streetwear for those who move in silence. Explore the Products.",
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
    alternateLocale: ["en_US"],
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: "SYCHOGEAR",
    title: "SYCHOGEAR — Official Store",
    description:
      "A curated collection of premium streetwear. Designed for those who move in silence.",
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "SYCHOGEAR Official Store",
      },
    ],
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
    title: "SYCHOGEAR — Official Store",
    description: "A curated collection of premium streetwear. Designed for those who move in silence.",
    images: ["/images/og-image.jpg"],
  },
  alternates: {
    canonical: process.env.NEXT_PUBLIC_APP_URL || "https://sychogear.com",
  },
};



import GlobalLoader from "@/components/store/GlobalLoader";
import { Suspense } from "react";

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
      "https://tiktok.com/@sychogear",
    ],
  };

  return (
    <html lang="id">
      <head />
      <body
        className={`
          antialiased
          ${karla.variable}
          bg-void text-salt min-h-screen relative overflow-x-hidden font-sans
        `}
      >
        <Suspense fallback={null}>
          <GlobalLoader />
        </Suspense>
        
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        {/* Global grain overlay — fixed, always on */}
        <div className="atmospheric-grain" aria-hidden="true" />

        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: "var(--color-void)",
              color: "var(--color-salt)",
              border: "2px solid var(--color-salt)",
              borderRadius: "0",
              fontSize: "0.875rem",
              fontFamily: "var(--font-karla), Helvetica, sans-serif",
              letterSpacing: "0.05em",
              padding: "16px",
              boxShadow: "none",
            },
          }}
        />
      </body>
    </html>
  );
}
