"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { getCountryByCode } from "@/lib/countries";

interface CurrencyContextType {
  currencyCode: string;
  countryCode: string;
  exchangeRate: number;
  isReady: boolean;
  formatPrice: (amountInIdr: number) => string;
  setManualRegion: (countryCode: string) => Promise<void>;
  hasConfirmedRegion: boolean;
}

const CurrencyContext = createContext<CurrencyContextType>({
  currencyCode: "IDR",
  countryCode: "ID",
  exchangeRate: 1,
  isReady: false,
  formatPrice: (amount) => 
    new Intl.NumberFormat("id-ID", { 
      style: "currency", 
      currency: "IDR", 
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount),
  setManualRegion: async () => {},
  hasConfirmedRegion: false,
});

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currencyCode, setCurrencyCode] = useState("IDR");
  const [countryCode, setCountryCode] = useState("ID");
  const [exchangeRate, setExchangeRate] = useState(1);
  const [isReady, setIsReady] = useState(false);
  const [hasConfirmedRegion, setHasConfirmedRegion] = useState(false);

  useEffect(() => {
    async function initCurrency() {
      try {
        const manualConfirmed = localStorage.getItem("sychogear_region_confirmed");
        const cachedCode = localStorage.getItem("sychogear_currency_code") || sessionStorage.getItem("sychogear_currency_code");
        const cachedCountry = localStorage.getItem("sychogear_country_code") || sessionStorage.getItem("sychogear_country_code");
        const cachedRate = localStorage.getItem("sychogear_exchange_rate") || sessionStorage.getItem("sychogear_exchange_rate");
        
        if (manualConfirmed === "true") {
          setHasConfirmedRegion(true);
        }

        if (cachedCode && cachedCountry && cachedRate) {
          setCurrencyCode(cachedCode);
          setCountryCode(cachedCountry);
          setExchangeRate(Number(cachedRate));
          setIsReady(true);
          return;
        }

        const geoRes = await fetch("https://get.geojs.io/v1/ip/country.json");
        if (!geoRes.ok) throw new Error("Failed to get location");
        const geoInfo = await geoRes.json();
        const detectedCountry = geoInfo.country || "ID";
        
        const countryData = getCountryByCode(detectedCountry);
        const targetCurrency = countryData?.currency || "IDR";
        
        setCountryCode(detectedCountry);
        sessionStorage.setItem("sychogear_country_code", detectedCountry);

        if (targetCurrency === "IDR") {
          setIsReady(true);
          setCurrencyCode("IDR");
          sessionStorage.setItem("sychogear_currency_code", "IDR");
          sessionStorage.setItem("sychogear_exchange_rate", "1");
          return;
        }
        
        const rateRes = await fetch("https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/idr.json");
        if (!rateRes.ok) throw new Error("Failed to get rates");
        const rateData = await rateRes.json();
        const multiplier = rateData.idr[targetCurrency.toLowerCase()];
        
        if (multiplier) {
          setCurrencyCode(targetCurrency);
          setExchangeRate(multiplier);
          sessionStorage.setItem("sychogear_currency_code", targetCurrency);
          sessionStorage.setItem("sychogear_exchange_rate", String(multiplier));
        }

      } catch (error) {
        console.error("[CurrencyProvider] Error detecting currency:", error);
      } finally {
        setIsReady(true);
      }
    }
    
    initCurrency();
  }, []);

  const setManualRegion = async (newCountryCode: string) => {
    setIsReady(false);
    try {
      const countryData = getCountryByCode(newCountryCode);
      const targetCurrency = countryData?.currency || "IDR";
      
      setCountryCode(newCountryCode);
      localStorage.setItem("sychogear_country_code", newCountryCode);
      localStorage.setItem("sychogear_region_confirmed", "true");
      setHasConfirmedRegion(true);

      if (targetCurrency === "IDR") {
        setCurrencyCode("IDR");
        setExchangeRate(1);
        localStorage.setItem("sychogear_currency_code", "IDR");
        localStorage.setItem("sychogear_exchange_rate", "1");
        setIsReady(true);
        return;
      }
      
      const rateRes = await fetch("https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/idr.json");
      if (!rateRes.ok) throw new Error("Failed to get rates");
      const rateData = await rateRes.json();
      const multiplier = rateData.idr[targetCurrency.toLowerCase()];
      
      if (multiplier) {
        setCurrencyCode(targetCurrency);
        setExchangeRate(multiplier);
        localStorage.setItem("sychogear_currency_code", targetCurrency);
        localStorage.setItem("sychogear_exchange_rate", String(multiplier));
      }
    } catch (error) {
      console.error("[CurrencyProvider] Error setting manual region:", error);
    } finally {
      setIsReady(true);
    }
  };

  const formatPrice = (amountInIdr: number) => {
    if (!isReady || currencyCode === "IDR") {
      return new Intl.NumberFormat("id-ID", { 
        style: "currency", 
        currency: "IDR", 
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amountInIdr);
    }
    
    const converted = amountInIdr * exchangeRate;
    return new Intl.NumberFormat("en-US", { 
      style: "currency", 
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(converted);
  };

  return (
    <CurrencyContext.Provider value={{ currencyCode, countryCode, exchangeRate, isReady, formatPrice, setManualRegion, hasConfirmedRegion }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
