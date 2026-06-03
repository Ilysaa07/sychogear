"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import axios from "axios";
import Link from "next/link";

import { useTranslation } from "./LanguageProvider";

export default function Sidebar() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();
  
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([]);

  const category = searchParams.get("category");
  const isActiveCat = (slug: string) => {
    if (pathname !== "/") return false;
    if (slug === "all" && !category) return true;
    return category === slug;
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await axios.get("/api/categories");
        if (data.success) {
          setCategories(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    };
    fetchCategories();
  }, []);

  const updateCategory = (slug: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (slug === "all") {
      params.delete("category");
    } else {
      params.set("category", slug);
    }
    params.set("page", "1");
    // Always navigate back to homepage with category filter applied
    router.push(`/?${params.toString()}`);
  };

  return (
    <aside className="w-full md:w-64 flex-shrink-0 mb-6 md:mb-0 pr-0 md:pr-8">
      {/* On desktop we use fixed to prevent any scrolling. On mobile we use sticky top-0 */}
      <div className="sticky md:fixed top-0 md:top-24 w-full md:w-[calc(16rem-2rem)] z-30 bg-void md:bg-transparent pt-2 md:pt-0 pb-2 md:pb-0">
        <div className="mb-8">
          <Link href="/">
          <Image
            src="/images/logo-sychogear.webp"
            alt="SYCHOGEAR"
            width={320}
            height={80}
            className="w-full h-auto max-w-[100px]"
            priority
          />
          </Link>
          <p className="slogan-brand mt-2 text-[9px] font-bold tracking-[0.2em] uppercase select-none">
            VIOLENCE IS OUR AESTHETIC
          </p>
        </div>
        <nav className="flex flex-row md:flex-col gap-6 md:gap-2 overflow-x-auto md:overflow-visible hide-scrollbar font-sans font-bold text-xs uppercase tracking-widest pb-1 md:pb-0">
          {[{ name: "All", slug: "all", id: "all" }, ...categories].map((catObj) => {
            const slug = catObj.slug;
            const active = isActiveCat(slug);
            return (
              <button
                key={slug}
                onClick={() => updateCategory(slug)}
                className={`text-left transition-none flex-shrink-0 ${
                  active 
                    ? "text-signal border-b-2 md:border-b-0 md:border-l-4 border-signal pb-1 md:pb-0 md:pl-3" 
                    : "text-salt hover:text-signal border-b-2 md:border-b-0 md:border-l-4 border-transparent pb-1 md:pb-0 md:pl-3"
                }`}
              >
                {catObj.name === "All" ? t("home.all") : catObj.name}
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
