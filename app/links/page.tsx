import type { Metadata } from "next";
import LinktreeClient from "@/components/store/LinktreeClient";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Official Links, Shopee & Tokopedia | SYCHOGEAR",
  description: "Explore SYCHOGEAR official links. Connect on WhatsApp, follow our Instagram & TikTok, and shop premium streetwear on our Shopee Mall & Tokopedia Official stores.",
  openGraph: {
    title: "Official Links, Shopee & Tokopedia | SYCHOGEAR",
    description: "Connect on WhatsApp, follow our social media, and shop premium streetwear on our Shopee & Tokopedia Official stores.",
    images: ["/images/logo-sychogear.webp"], 
  },
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

export default async function LinksPage() {
  const heroSettings = await getHeroSettings();
  let heroImages: string[] = [];
  try {
    heroImages = heroSettings.heroImages ? JSON.parse(heroSettings.heroImages) : [];
  } catch {
    heroImages = [];
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfilePage",
        "@id": "https://sychogear.com/links/#profile",
        "mainEntity": {
          "@type": "Organization",
          "@id": "https://sychogear.com/#organization",
          "name": "SYCHOGEAR",
          "url": "https://sychogear.com/",
          "logo": {
            "@type": "ImageObject",
            "url": "https://sychogear.com/images/logo-sychogear.png"
          },
          "sameAs": [
            "https://instagram.com/sychogear",
            "https://tiktok.com/@sychogearofficial",
            "https://youtube.com/@sychogear",
            "https://shopee.co.id/sychogear",
            "https://tk.tokopedia.com/ZSHHSgote/"
          ],
          "contactPoint": {
            "@type": "ContactPoint",
            "contactType": "Customer Service",
            // The actual WA number might be dynamic, so let's use the URL directly if they have a wa.me link
            // We'll leave it generalized as a brand profile
            "url": "https://sychogear.com/links",
            "availableLanguage": ["id", "en"]
          }
        }
      },
      {
        "@type": "ItemList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Sychogear Official Shopee Store",
            "url": "https://shopee.co.id/sychogear"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Sychogear Tokopedia Official Store",
            "url": "https://tk.tokopedia.com/ZSHHSgote/"
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": "SYCHOGEAR Official Website",
            "url": "https://sychogear.com"
          }
        ]
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LinktreeClient heroImages={heroImages} />
    </>
  );
}
