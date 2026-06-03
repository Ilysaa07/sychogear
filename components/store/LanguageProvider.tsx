"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import en from "@/locales/en.json";
import id from "@/locales/id.json";

type Locale = "en" | "id";
type Dictionary = typeof en;

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const dictionaries = {
  en,
  id,
};

const LanguageContext = createContext<LanguageContextType>({
  locale: "en",
  setLocale: () => {},
  t: (key: string) => key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function initLanguage() {
      try {
        const cachedLocale = localStorage.getItem("sychogear_locale");
        if (cachedLocale && (cachedLocale === "en" || cachedLocale === "id")) {
          setLocaleState(cachedLocale as Locale);
          setIsReady(true);
          return;
        }

        // Try to read from country code already fetched by CurrencyProvider
        let detectedCountry = sessionStorage.getItem("sychogear_country_code");
        
        // If not found, fetch it ourselves
        if (!detectedCountry) {
          const geoRes = await fetch("https://get.geojs.io/v1/ip/country.json");
          if (geoRes.ok) {
            const geoInfo = await geoRes.json();
            detectedCountry = geoInfo.country;
          }
        }

        const autoLocale = detectedCountry === "ID" ? "id" : "en";
        setLocaleState(autoLocale);
        // Don't save to localStorage yet, let it auto-detect again unless manually changed
      } catch (error) {
        console.error("[LanguageProvider] Error detecting language:", error);
      } finally {
        setIsReady(true);
      }
    }
    
    initLanguage();
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("sychogear_locale", newLocale);
  };

  const t = (path: string): string => {
    const dict = dictionaries[locale];
    const keys = path.split(".");
    let current: any = dict;
    
    for (const key of keys) {
      if (current[key] === undefined) {
        console.warn(`Translation key not found: ${path}`);
        return path;
      }
      current = current[key];
    }
    
    return typeof current === "string" ? current : path;
  };

  // Render nothing or a loader until ready to prevent hydration mismatch with translated strings?
  // Usually it's better to just render default (en) to avoid blocking SEO/LCP, but let's prevent flicker.
  // We'll just render default 'en' during SSR/initial load.

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useTranslation must be used within a LanguageProvider");
  }
  return context;
}
