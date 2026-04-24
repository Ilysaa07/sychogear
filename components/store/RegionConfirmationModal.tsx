"use client";

import { useState, useEffect } from "react";
import { useCurrency } from "./CurrencyProvider";
import { WORLDWIDE_COUNTRIES } from "@/lib/countries";

export default function RegionConfirmationModal() {
  const { countryCode, currencyCode, isReady, hasConfirmedRegion } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const [hasRendered, setHasRendered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show if the currency is ready and the user hasn't explicitly confirmed their region yet
    if (!isReady || hasConfirmedRegion) return;

    // Check session storage as a fallback to avoid annoying the user on refresh if they haven't explicitly confirmed but have seen it
    const hasSeenPopup = sessionStorage.getItem("sychogear_seen_region_popup");
    if (hasSeenPopup) return;

    // Delay the popup so it doesn't conflict with PromoModal.
    // If PromoModal triggers, it has a 2s delay. We will use a longer delay or listen for PromoModal close in a more complex setup,
    // but for now, 6s delay ensures it appears after Promo if both are active, or a bit after page load.
    const timer = setTimeout(() => {
      setHasRendered(true);
      setIsOpen(true);
      sessionStorage.setItem("sychogear_seen_region_popup", "true");
      requestAnimationFrame(() => requestAnimationFrame(() => setIsVisible(true)));
    }, 6000);
    
    return () => clearTimeout(timer);
  }, [isReady, hasConfirmedRegion]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => setIsOpen(false), 450);
  };

  const currentCountry = WORLDWIDE_COUNTRIES.find(c => c.code === countryCode);

  if (!hasRendered || !isOpen || !currentCountry) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Confirm Region"
    >
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{
          background: "rgba(8, 8, 8, 0.88)",
          backdropFilter: "blur(6px)",
          opacity: isVisible ? 1 : 0,
        }}
        onClick={handleClose}
        aria-hidden="true"
      />

      <div
        className="relative z-10 w-full max-w-[440px] bg-void border border-ember overflow-hidden p-8"
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? "scale(1)" : "scale(0.92)",
          transition: "opacity 450ms ease, transform 450ms var(--ease-out-expo)",
        }}
      >
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-12 mb-6 overflow-hidden">
            <img src={`https://flagcdn.com/w80/${currentCountry.code.toLowerCase()}.png`} alt={currentCountry.name} className="w-full h-full object-cover grayscale opacity-80" />
          </div>

          <h2 className="font-syne text-salt mb-3" style={{ fontSize: "1.25rem", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>
            Shipping to {currentCountry.name}
          </h2>
          
          <p className="text-pale mb-8" style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: "0.8125rem", lineHeight: 1.6 }}>
            We've detected your location. Prices will be shown in <strong>{currencyCode}</strong> and orders will be shipped to <strong>{currentCountry.name}</strong>.
          </p>

          <div className="w-full space-y-3">
            <button
              onClick={() => {
                localStorage.setItem("sychogear_region_confirmed", "true");
                handleClose();
              }}
              className="btn-primary w-full py-4"
            >
              Continue
            </button>
            <button
              onClick={() => {
                handleClose();
                // We'll dispatch a custom event to open the Region Selector from Navbar
                window.dispatchEvent(new CustomEvent('openRegionSelector'));
              }}
              className="btn-ghost w-full py-4"
            >
              Change Region
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
