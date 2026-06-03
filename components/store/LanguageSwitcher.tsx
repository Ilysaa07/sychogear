"use client";

import { useTranslation } from "./LanguageProvider";

export default function LanguageSwitcher() {
  const { locale, setLocale } = useTranslation();

  return (
    <div className="flex items-center gap-2 font-dm-mono text-[10px] tracking-widest uppercase">
      <button
        onClick={() => setLocale("en")}
        className={`transition-colors duration-200 ${locale === "en" ? "text-salt font-bold" : "text-ash hover:text-salt"}`}
      >
        EN
      </button>
      <span className="text-ember">|</span>
      <button
        onClick={() => setLocale("id")}
        className={`transition-colors duration-200 ${locale === "id" ? "text-salt font-bold" : "text-ash hover:text-salt"}`}
      >
        ID
      </button>
    </div>
  );
}
