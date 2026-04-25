"use client";

import { useState, useRef, useEffect } from "react";
import { useCurrency } from "./CurrencyProvider";
import { WORLDWIDE_COUNTRIES } from "@/lib/countries";
import { HiChevronDown, HiOutlineGlobeAlt, HiOutlineSearch } from "react-icons/hi";

export default function RegionCurrencySelector() {
  const { countryCode, setManualRegion, isReady } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentCountry = WORLDWIDE_COUNTRIES.find(c => c.code === countryCode) || WORLDWIDE_COUNTRIES.find(c => c.code === "ID");

  const filteredCountries = search
    ? WORLDWIDE_COUNTRIES.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.code.toLowerCase().includes(search.toLowerCase()) ||
        c.currency.toLowerCase().includes(search.toLowerCase())
      )
    : WORLDWIDE_COUNTRIES;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleOpenSelector = () => setIsOpen(true);
    
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("openRegionSelector", handleOpenSelector);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("openRegionSelector", handleOpenSelector);
    };
  }, []);

  if (!isReady) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 sm:gap-2.5 px-2 sm:px-3 py-1.5 border border-ember hover:border-signal text-salt transition-all duration-300"
        style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase" }}
      >
        <HiOutlineGlobeAlt className="w-3.5 h-3.5 text-signal" />
        <span className="hidden sm:inline">{currentCountry?.code} / {currentCountry?.currency}</span>
        <HiChevronDown className={`w-3 h-3 text-ash transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div 
          className="absolute right-0 mt-4 w-[280px] bg-void border border-ember shadow-2xl z-50 overflow-hidden flex flex-col"
          style={{ maxHeight: "400px" }}
        >
          {/* Header */}
          <div className="p-4 border-b border-ember bg-abyss">
            <p style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--salt)", marginBottom: "12px" }}>
              Select Region
            </p>
            <div className="relative">
              <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ash" />
              <input
                type="text"
                placeholder="Search country..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-void border border-ember text-salt pl-9 pr-3 py-2 outline-none focus:border-signal transition-colors"
                style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: "0.75rem" }}
              />
            </div>
          </div>

          {/* List */}
          <div className="overflow-y-auto custom-scrollbar flex-1">
            {filteredCountries.length > 0 ? (
              filteredCountries.map(c => (
                <button
                  key={c.code}
                  onClick={() => {
                    setManualRegion(c.code);
                    setIsOpen(false);
                    setSearch("");
                  }}
                  className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-dim transition-colors"
                  style={{
                    borderBottom: "1px solid rgba(255,255,255,0.03)",
                    background: countryCode === c.code ? "rgba(200, 169, 110, 0.05)" : "transparent",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <img src={`https://flagcdn.com/w20/${c.code.toLowerCase()}.png`} alt={c.name} className="w-5 h-auto object-contain" />
                    <span style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "0.75rem", color: countryCode === c.code ? "var(--signal)" : "var(--salt)" }}>
                      {c.name}
                    </span>
                  </div>
                  <span style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: "0.6875rem", color: "var(--ash)" }}>
                    {c.currency}
                  </span>
                </button>
              ))
            ) : (
              <div className="p-6 text-center">
                <p style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: "0.75rem", color: "var(--ash)" }}>No countries found</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
