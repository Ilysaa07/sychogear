"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import axios from "axios";
import Link from "next/link";

export default function Sidebar() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([]);

  const category = searchParams.get("category");
  const isActiveCat = (cat: string) => {
    if (pathname !== "/") return false; // In product details, we usually don't highlight any category, or we can just leave it unhighlighted.
    if (cat === "All" && !category) return true;
    return category === cat;
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

  const updateCategory = (cat: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (cat === "All") {
      params.delete("category");
    } else {
      params.set("category", cat);
    }
    params.set("page", "1");
    // Always navigate back to homepage with category filter applied
    router.push(`/?${params.toString()}`);
  };

  return (
    <aside className="w-full md:w-64 flex-shrink-0 mb-6 md:mb-0 pr-0 md:pr-8 overflow-hidden">
      <div className="sticky top-0">
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
        </div>
        <nav className="flex flex-row md:flex-col gap-6 md:gap-2 overflow-x-auto md:overflow-visible hide-scrollbar font-sans font-bold text-xs uppercase tracking-widest pb-1 md:pb-0">
          {[{ name: "All" }, ...categories].map((catObj) => {
            const cat = catObj.name;
            const active = isActiveCat(cat);
            return (
              <button
                key={cat}
                onClick={() => updateCategory(cat)}
                className={`text-left transition-none flex-shrink-0 ${
                  active 
                    ? "text-signal border-b-2 md:border-b-0 md:border-l-4 border-signal pb-1 md:pb-0 md:pl-3" 
                    : "text-salt hover:text-signal border-b-2 md:border-b-0 md:border-l-4 border-transparent pb-1 md:pb-0 md:pl-3"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
