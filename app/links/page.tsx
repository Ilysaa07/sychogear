import type { Metadata } from "next";
import LinktreeClient from "@/components/store/LinktreeClient";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Official Links | SYCHOGEAR",
  description: "Violence Is Our Aesthetic. Premium fight gear and streetwear. Connect with us on social media, shop the latest drops, and join the underground.",
  openGraph: {
    title: "Official Links | SYCHOGEAR",
    description: "Premium streetwear and fight gear. Shop now.",
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

  return <LinktreeClient heroImages={heroImages} />;
}
