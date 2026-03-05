import type { Metadata } from "next";
import LinktreeClient from "@/components/store/LinktreeClient";

export const metadata: Metadata = {
  title: "Official Links | SYCHOGEAR",
  description: "Violence Is Our Aesthetic. Premium fight gear and streetwear. Connect with us on social media, shop the latest drops, and join the underground.",
  openGraph: {
    title: "Official Links | SYCHOGEAR",
    description: "Premium streetwear and fight gear. Shop now.",
    // Ensure the main logo or a specific banner is used when shared on IG/WhatsApp
    images: ["/images/logo-sychogear.png"], 
  },
};

export default function LinksPage() {
  return <LinktreeClient />;
}
