import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const hooliganFont = localFont({
  src: "../public/fonts/hooligan.ttf",
  variable: "--font-marker",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Sychogear - Official Webstore",
    template: "%s | SYCHOGEAR",
  },
  description:
    "Premium streetwear clothing brand. Explore our latest collection of hoodies, tees, jackets, and accessories. Designed for the bold.",
  keywords: [
    "streetwear",
    "clothing brand",
    "fashion",
    "hoodies",
    "tees",
    "premium",
    "SYCHOGEAR",
  ],
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: "SYCHOGEAR",
    title: "SYCHOGEAR — Streetwear Clothing Brand",
    description:
      "Premium streetwear clothing brand. Designed for the bold.",
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
    title: "SYCHOGEAR — Streetwear Clothing Brand",
    description: "Premium streetwear clothing brand. Designed for the bold.",
    images: ["/images/og-image.jpg"], // Ensure this exists or use dynamic
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
      // Add other social links
    ],
  };

  return (
    <html lang="id">
      <head>
        {/* Font loading is handled by next/font in layout.tsx */}
      </head>
      <body className={`antialiased ${inter.variable} ${hooliganFont.variable} font-sans bg-brand-950 text-white min-h-screen relative overflow-x-hidden`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <LenisProvider>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "#171717",
                color: "#fafafa",
                border: "1px solid #262626",
                fontSize: "0.875rem",
              },
            }}
          />
        </LenisProvider>
      </body>
    </html>
  );
}
