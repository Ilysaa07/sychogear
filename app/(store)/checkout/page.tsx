"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { checkoutSchema, type CheckoutFormData } from "@/lib/validations";
import { WORLDWIDE_COUNTRIES, getCountryByCode } from "@/lib/countries";
import { useCartStore } from "@/stores/cart-store";
import { formatCurrency } from "@/lib/utils";
import axios from "axios";
import toast from "react-hot-toast";
import Link from "next/link";
import { useCurrency } from "@/components/store/CurrencyProvider";
import {
  HiOutlineShoppingBag,
  HiOutlineGlobeAlt,
  HiOutlineUser,
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineLocationMarker,
  HiOutlineSearch,
  HiChevronDown,
} from "react-icons/hi";


export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotal, getSubtotal, getTotalTax, clearCart } = useCartStore();
  const { countryCode: detectedCountry, isReady: currencyReady } = useCurrency();
  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [exchangeRate, setExchangeRate] = useState(16000); // fallback IDR to USD
  const [localCurrencyRate, setLocalCurrencyRate] = useState<number | null>(null);
  const [shippingCost, setShippingCost] = useState(0);
  const [internationalTaxEnabled, setInternationalTaxEnabled] = useState(true);
  const [internationalTaxRates, setInternationalTaxRates] = useState<Record<string, number>>({});
  const [countrySearch, setCountrySearch] = useState("");
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [fetchingShipping, setFetchingShipping] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      country: "ID",
    },
  });

  const selectedCountry = watch("country");
  const isInternational = selectedCountry !== "ID";
  const countryInfo = getCountryByCode(selectedCountry);

  const subtotal = getSubtotal();
  const domesticTax = isInternational ? 0 : getTotalTax();
  // Single global PPN rate for all international orders
  const intlTaxRate = isInternational && internationalTaxEnabled ? (internationalTaxRates["_global"] ?? 0) : 0;
  const internationalTax = isInternational ? Math.round(subtotal * (intlTaxRate / 100)) : 0;
  const applicableTax = isInternational ? internationalTax : domesticTax;
  const finalTotal = Math.max(0, subtotal + applicableTax - discountAmount + shippingCost);
  
  // Custom Dynamic Local Currency formatting
  const localCurrencyCode = countryInfo?.currency || "USD";
  const localExchangeRate = localCurrencyRate ?? (1 / exchangeRate); // fallback
  const finalTotalLocal = Math.round((finalTotal * localExchangeRate) * 100) / 100;
  
  const formatLocalCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Grouped countries for dropdown
  const regions = Array.from(new Set(WORLDWIDE_COUNTRIES.map(c => c.region)));
  const filteredCountries = countrySearch
    ? WORLDWIDE_COUNTRIES.filter(c =>
        c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
        c.code.toLowerCase().includes(countrySearch.toLowerCase())
      )
    : WORLDWIDE_COUNTRIES;

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setCountryDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Pre-fill country based on smart detection
  useEffect(() => {
    if (currencyReady && detectedCountry) {
      setValue("country", detectedCountry as any);
    }
  }, [currencyReady, detectedCountry, setValue]);

  // Fetch settings (exchange rate, tax rate)
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await axios.get("/api/settings");
        if (data.success) {
          if (data.data.idrToUsdRate) {
            setExchangeRate(parseFloat(data.data.idrToUsdRate) || 16000);
          }
          if (data.data.internationalTaxEnabled !== undefined) {
            setInternationalTaxEnabled(data.data.internationalTaxEnabled === "true");
          }
          // Single global rate — stored as "_global" key
          if (data.data.internationalTaxRate) {
            const rate = parseFloat(data.data.internationalTaxRate) || 11;
            setInternationalTaxRates({ _global: rate });
          } else {
            setInternationalTaxRates({ _global: 11 }); // fallback
          }
        }
      } catch {
        console.warn("Failed to fetch settings");
      }
    };
    fetchSettings();
  }, []);

  // Fetch flat shipping rate from admin settings when country changes
  useEffect(() => {
    const fetchShipping = async () => {
      if (selectedCountry === "ID") {
        setShippingCost(0);
        return;
      }
      setFetchingShipping(true);
      try {
        const { data } = await axios.post("/api/shipping/rates", { country: selectedCountry });
        if (data.success && data.data) {
          setShippingCost(data.data.price || 0);
        }
      } catch {
        setShippingCost(0);
      } finally {
        setFetchingShipping(false);
      }
    };
    fetchShipping();

    // Fetch dynamic currency conversion rate from CDN
    const fetchCurrencyRate = async () => {
      if (selectedCountry === "ID") {
        setLocalCurrencyRate(null);
        return;
      }
      const targetCurrency = getCountryByCode(selectedCountry)?.currency?.toLowerCase() || "usd";
      try {
        const { data } = await axios.get("https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/idr.json");
        if (data && data.idr && data.idr[targetCurrency]) {
          setLocalCurrencyRate(data.idr[targetCurrency]);
        } else {
          setLocalCurrencyRate(null); // fallback
        }
      } catch (err) {
        console.warn("Failed to fetch live currency rate", err);
        setLocalCurrencyRate(null);
      }
    };
    fetchCurrencyRate();
  }, [selectedCountry]);

  if (items.length === 0) {
    return (
      <div
        className="min-h-screen bg-void flex flex-col items-center justify-center text-center px-6"
        style={{ paddingTop: "clamp(100px, 16vw, 160px)" }}
      >
        <HiOutlineShoppingBag className="w-10 h-10 text-fog mb-6" />
        <h1
          className="font-display text-salt mb-3"
          style={{ fontSize: "clamp(32px, 5vw, 52px)", lineHeight: 0.95 }}
        >
          Your cart is empty.
        </h1>
        <p
          className="text-ash mb-10"
          style={{
            fontFamily: "var(--font-dm-mono), monospace",
            fontSize: "0.8125rem",
            maxWidth: "380px",
            lineHeight: 1.7,
          }}
        >
          Add products to your cart before proceeding to checkout.
        </p>
        <Link href="/products" className="btn-primary py-4 px-10">
          Explore Archive ↗
        </Link>
      </div>
    );
  }

  const onSubmit = async (formData: CheckoutFormData) => {
    setLoading(true);
    try {
      const { data } = await axios.post("/api/orders/create", {
        customer: formData,
        items,
        couponCode: couponCode || undefined,
      });

      if (data.success) {
        clearCart();
        toast.success("Order created! Redirecting...");
        router.push(data.data.invoiceUrl);
      } else {
        toast.error(data.error || "Failed to create order");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to create order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setValidatingCoupon(true);
    try {
      const { data } = await axios.post("/api/coupons/validate", {
        code: couponCode,
        subtotal: getSubtotal(),
      });
      if (data.success) {
        setDiscountAmount(data.data.discountAmount);
        setAppliedCoupon(data.data.code);
        toast.success("Coupon applied!");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Invalid coupon");
      setDiscountAmount(0);
      setAppliedCoupon(null);
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode("");
    setDiscountAmount(0);
    setAppliedCoupon(null);
  };

  const handleCountrySelect = (code: string) => {
    setValue("country", code as any, { shouldValidate: true });
    setCountryDropdownOpen(false);
    setCountrySearch("");
  };

  return (
    <div
      className="min-h-screen bg-void"
      style={{ paddingTop: "clamp(100px, 16vw, 160px)" }}
    >
      <div
        className="container-main"
        style={{
          paddingTop: "clamp(40px, 6vw, 60px)",
          paddingBottom: "clamp(60px, 10vw, 120px)",
        }}
      >
        {/* Page heading */}
        <div className="mb-12 pb-8 border-b border-ember">
          <p className="label-eyebrow mb-3">Complete your order</p>
          <h1
            className="font-display text-salt"
            style={{ fontSize: "clamp(48px, 8vw, 88px)", lineHeight: 0.9 }}
          >
            Checkout
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Form — 7 cols */}
          <div className="lg:col-span-7">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

            {/* ── Contact Information ── */}
            <div
              className="p-6 space-y-6"
              style={{ background: "var(--abyss)", border: "1px solid var(--ember)" }}
            >
              <div className="flex items-center gap-3 pb-4 border-b border-ember">
                <HiOutlineUser className="w-4 h-4 text-signal flex-shrink-0" />
                <p className="label-syne text-salt">Contact Information</p>
              </div>

              {/* Full Name */}
              <div>
                <label
                  htmlFor="fullName"
                  className="label-eyebrow block mb-3"
                >
                  Full Name <span style={{ color: "var(--error)" }}>*</span>
                </label>
                <input
                  {...register("fullName")}
                  id="fullName"
                  className="input-field"
                  placeholder="e.g. John Doe"
                  autoComplete="name"
                />
                {errors.fullName && (
                  <p className="mt-1" style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: "0.6875rem", color: "var(--error)" }}>{errors.fullName.message}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="label-eyebrow block mb-3">
                  Email Address <span style={{ color: "var(--error)" }}>*</span>
                </label>
                <input
                  {...register("email")}
                  id="email"
                  type="email"
                  className="input-field"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
                {errors.email && (
                  <p className="mt-1" style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: "0.6875rem", color: "var(--error)" }}>{errors.email.message}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="label-eyebrow block mb-3">
                  Phone Number{" "}
                  <span style={{ color: "var(--error)" }}>*</span>
                  <span style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: "0.6875rem", color: "var(--ash)", textTransform: "none", letterSpacing: "0", marginLeft: "8px" }}>(WhatsApp preferred)</span>
                </label>
                <div className="relative">
                  {countryInfo && (
                    <span
                      className="absolute top-1/2 -translate-y-1/2 pointer-events-none select-none"
                      style={{ left: 0, fontFamily: "var(--font-dm-mono), monospace", fontSize: "0.8125rem", color: "var(--ash)" }}
                    >
                      {countryInfo.phonePrefix}
                    </span>
                  )}
                  <input
                    {...register("phone")}
                    id="phone"
                    className={`input-field ${countryInfo ? "pl-14" : ""}`}
                    placeholder={isInternational ? "8123456789" : "8xxxxxxxxxx"}
                    autoComplete="tel"
                  />
                </div>
                {errors.phone && (
                  <p className="mt-1" style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: "0.6875rem", color: "var(--error)" }}>{errors.phone.message}</p>
                )}
                <p
                  className="mt-2"
                  style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: "0.6875rem", color: "var(--ash)", letterSpacing: "0.05em" }}
                >
                  We'll use this number to confirm your order via WhatsApp.
                </p>
              </div>
            </div>

            {/* ── Shipping Address ── */}
            <div
              className="p-6 space-y-6"
              style={{ background: "var(--abyss)", border: "1px solid var(--ember)" }}
            >
              <div className="flex items-center gap-3 pb-4 border-b border-ember">
                <HiOutlineLocationMarker className="w-4 h-4 text-signal flex-shrink-0" />
                <p className="label-syne text-salt">Shipping Address</p>
              </div>

              {/* Country Dropdown */}
              <div>
                <label className="label-eyebrow block mb-3">
                  Country <span style={{ color: "var(--error)" }}>*</span>
                </label>
                <div className="relative" ref={dropdownRef}>
                  {/* Trigger */}
                  <button
                    id="country-selector"
                    type="button"
                    onClick={() => setCountryDropdownOpen(!countryDropdownOpen)}
                    className="w-full flex items-center justify-between gap-2 text-left py-3"
                    style={{ borderBottom: `1px solid ${countryDropdownOpen ? "var(--signal)" : "var(--ember)"}`, background: "transparent", transition: "border-color 200ms ease" }}
                  >
                    <span
                      className="flex items-center gap-2"
                      style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: "0.8125rem", color: countryInfo ? "var(--salt)" : "var(--fog)" }}
                    >
                      {countryInfo ? (
                        <>
                          <span className="w-5 h-3.5 overflow-hidden flex-shrink-0">
                            <img
                              src={`https://flagcdn.com/w40/${selectedCountry.toLowerCase()}.png`}
                              alt={countryInfo.name}
                              className="w-full h-full object-cover"
                            />
                          </span>
                          <span>{countryInfo.name}</span>
                        </>
                      ) : (
                        <span>Select your country</span>
                      )}
                    </span>
                    <HiChevronDown
                      className={`w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200 ${countryDropdownOpen ? "rotate-180" : ""}`}
                      style={{ color: "var(--ash)" }}
                    />
                  </button>

                  {/* Dropdown Panel */}
                  {countryDropdownOpen && (
                    <div
                      className="absolute z-50 top-full left-0 right-0 mt-1 overflow-hidden"
                      style={{ background: "var(--abyss)", border: "1px solid var(--ember)", boxShadow: "0 24px 48px rgba(0,0,0,0.6)" }}
                    >
                      {/* Search */}
                      <div className="p-3" style={{ borderBottom: "1px solid var(--ember)" }}>
                        <div className="relative">
                          <HiOutlineSearch className="absolute left-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "var(--ash)" }} />
                          <input
                            type="text"
                            value={countrySearch}
                            onChange={e => setCountrySearch(e.target.value)}
                            className="w-full pl-6 py-2"
                            style={{ background: "transparent", border: "none", borderBottom: "1px solid var(--ember)", fontFamily: "var(--font-dm-mono), monospace", fontSize: "0.75rem", color: "var(--salt)", outline: "none" }}
                            placeholder="Search country..."
                            autoFocus
                          />
                        </div>
                      </div>
                      {/* List */}
                      <div className="max-h-56 overflow-y-auto hide-scrollbar">
                        {countrySearch ? (
                          filteredCountries.length > 0 ? (
                            filteredCountries.map(c => (
                              <button
                                key={c.code}
                                type="button"
                                onClick={() => handleCountrySelect(c.code)}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-dim"
                                style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: "0.75rem", color: selectedCountry === c.code ? "var(--signal)" : "var(--ash)" }}
                              >
                                <span className="w-5 h-3.5 overflow-hidden flex-shrink-0">
                                  <img src={`https://flagcdn.com/w40/${c.code.toLowerCase()}.png`} alt={c.name} className="w-full h-full object-cover" />
                                </span>
                                <span>{c.name}</span>
                                <span className="ml-auto" style={{ color: "var(--fog)", fontSize: "0.625rem" }}>{c.code}</span>
                              </button>
                            ))
                          ) : (
                            <p className="text-center py-6" style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: "0.75rem", color: "var(--fog)" }}>No countries found</p>
                          )
                        ) : (
                          regions.map(region => {
                            const regionCountries = WORLDWIDE_COUNTRIES.filter(c => c.region === region);
                            return (
                              <div key={region}>
                                <p
                                  className="px-4 pt-4 pb-1"
                                  style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: "0.5625rem", color: "var(--fog)", letterSpacing: "0.25em", textTransform: "uppercase" }}
                                >
                                  {region}
                                </p>
                                {regionCountries.map(c => (
                                  <button
                                    key={c.code}
                                    type="button"
                                    onClick={() => handleCountrySelect(c.code)}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-dim"
                                    style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: "0.75rem", color: selectedCountry === c.code ? "var(--signal)" : "var(--ash)" }}
                                  >
                                    <span className="w-5 h-3.5 overflow-hidden flex-shrink-0">
                                      <img src={`https://flagcdn.com/w40/${c.code.toLowerCase()}.png`} alt={c.name} className="w-full h-full object-cover" />
                                    </span>
                                    <span>{c.name}</span>
                                    <span className="ml-auto" style={{ color: "var(--fog)", fontSize: "0.625rem" }}>{c.code}</span>
                                  </button>
                                ))}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                  {/* Hidden input for react-hook-form */}
                  <input type="hidden" {...register("country")} />
                </div>
                {errors.country && (
                  <p className="mt-1" style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: "0.6875rem", color: "var(--error)" }}>{errors.country.message}</p>
                )}
              </div>

              {/* Street Address */}
              <div>
                <label htmlFor="streetAddress" className="label-eyebrow block mb-3">
                  Street Address <span style={{ color: "var(--error)" }}>*</span>
                </label>
                <input
                  {...register("streetAddress")}
                  id="streetAddress"
                  className="input-field"
                  placeholder="e.g. 123 Orchard Road"
                  autoComplete="address-line1"
                />
                {errors.streetAddress && (
                  <p className="mt-1" style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: "0.6875rem", color: "var(--error)" }}>{errors.streetAddress.message}</p>
                )}
              </div>

              {/* Apartment */}
              <div>
                <label htmlFor="apartment" className="label-eyebrow block mb-3">
                  Apartment, suite, etc.{" "}
                  <span style={{ color: "var(--fog)", textTransform: "none", letterSpacing: 0 }}>(optional)</span>
                </label>
                <input
                  {...register("apartment")}
                  id="apartment"
                  className="input-field"
                  placeholder="e.g. Unit 12-B, Floor 3"
                  autoComplete="address-line2"
                />
              </div>

              {/* City + State/Province */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="city" className="label-eyebrow block mb-3">
                    City <span style={{ color: "var(--error)" }}>*</span>
                  </label>
                  <input {...register("city")} id="city" className="input-field" placeholder="e.g. Singapore" autoComplete="address-level2" />
                  {errors.city && (<p className="mt-1" style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: "0.6875rem", color: "var(--error)" }}>{errors.city.message}</p>)}
                </div>
                <div>
                  <label htmlFor="stateProvince" className="label-eyebrow block mb-3">
                    Province / State <span style={{ color: "var(--error)" }}>*</span>
                  </label>
                  <input {...register("stateProvince")} id="stateProvince" className="input-field" placeholder="e.g. Central Region" autoComplete="address-level1" />
                  {errors.stateProvince && (<p className="mt-1" style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: "0.6875rem", color: "var(--error)" }}>{errors.stateProvince.message}</p>)}
                </div>
              </div>

              {/* ZIP / Postal Code */}
              <div>
                <label htmlFor="zipCode" className="label-eyebrow block mb-3">
                  Postal Code <span style={{ color: "var(--error)" }}>*</span>
                </label>
                <input {...register("zipCode")} id="zipCode" className="input-field" style={{ maxWidth: "200px" }} placeholder="e.g. 238801" autoComplete="postal-code" />
                {errors.zipCode && (<p className="mt-1" style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: "0.6875rem", color: "var(--error)" }}>{errors.zipCode.message}</p>)}
              </div>

              {/* Shipping info */}
              <div
                className="flex items-start gap-3 p-4"
                style={{ background: "var(--dim)", border: "1px solid var(--ember)" }}
              >
                <HiOutlineGlobeAlt className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: isInternational ? "var(--signal)" : "var(--ash)" }} />
                <div>
                  <p
                    style={{ fontFamily: "var(--font-syne), system-ui, sans-serif", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: isInternational ? "var(--signal)" : "var(--pale)" }}
                  >
                    {fetchingShipping
                      ? "Calculating shipping…"
                      : isInternational
                      ? `Lion Parcel INTERPACK — ${shippingCost > 0 ? formatCurrency(shippingCost) : "Free"}`
                      : "Domestic Shipping (Indonesia)"}
                  </p>
                  <p
                    className="mt-1"
                    style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: "0.6875rem", color: "var(--ash)", letterSpacing: "0.05em" }}
                  >
                    {isInternational
                      ? "Est. 3–14 days · Confirm via WhatsApp"
                      : "Domestic delivery · Confirm via WhatsApp"}
                  </p>
                </div>
              </div>
            </div>

            {/* ── Payment Method ── */}
            <div
              className="p-6"
              style={{ background: "var(--abyss)", border: "1px solid var(--ember)" }}
            >
              <div className="flex items-center gap-3 pb-4 mb-4 border-b border-ember">
                <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0" style={{ color: "var(--signal)" }} fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="5" width="20" height="14"/>
                  <path d="M2 10h20"/>
                </svg>
                <p className="label-syne text-salt">Payment Method</p>
              </div>
              <div className="flex items-center gap-4 p-4" style={{ background: "var(--dim)", border: "1px solid var(--ember)" }}>
                <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" style={{ color: "var(--signal)" }} fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="5" width="20" height="14"/>
                  <path d="M2 10h20"/>
                </svg>
                <div>
                  <p style={{ fontFamily: "var(--font-syne), system-ui, sans-serif", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--salt)" }}>Bank Transfer (BCA)</p>
                  <p className="mt-1" style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: "0.6875rem", color: "var(--ash)", letterSpacing: "0.05em" }}>
                    {isInternational
                      ? "International bank transfer · Confirm via WhatsApp"
                      : "Transfer ke rekening BCA · Konfirmasi via WhatsApp"}
                  </p>
                </div>
              </div>
            </div>

            {/* ── Coupon ── */}
            <div
              className="p-6"
              style={{ background: "var(--abyss)", border: "1px solid var(--ember)" }}
            >
              <p className="label-syne text-salt mb-6">Coupon Code</p>
              <div className="flex gap-4">
                <input
                  value={couponCode}
                  onChange={(e) => {
                    setCouponCode(e.target.value.toUpperCase());
                    if (appliedCoupon && e.target.value.toUpperCase() !== appliedCoupon) {
                      setAppliedCoupon(null);
                      setDiscountAmount(0);
                    }
                  }}
                  disabled={!!appliedCoupon || validatingCoupon}
                  className="input-field flex-1"
                  placeholder="Enter code"
                />
                {!appliedCoupon ? (
                  <button type="button" onClick={handleApplyCoupon} disabled={!couponCode || validatingCoupon} className="btn-ghost text-xs whitespace-nowrap py-2 px-5 disabled:opacity-40">
                    {validatingCoupon ? "…" : "Apply"}
                  </button>
                ) : (
                  <button type="button" onClick={handleRemoveCoupon} className="btn-ghost text-xs whitespace-nowrap py-2 px-5" style={{ borderColor: "var(--error)", color: "var(--error)" }}>
                    Remove
                  </button>
                )}
              </div>
              {appliedCoupon && (
                <p className="mt-3" style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: "0.6875rem", color: "var(--success)", letterSpacing: "0.05em" }}>
                  ✓ Coupon applied — {formatCurrency(discountAmount)} off
                </p>
              )}
            </div>

            {/* ── Submit ── */}
            <button
              type="submit"
              id="place-order-btn"
              disabled={loading}
              className="btn-primary w-full py-5"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  Processing…
                </span>
              ) : (
                `Place Order — ${isInternational ? formatLocalCurrency(finalTotalLocal, localCurrencyCode) : formatCurrency(finalTotal)}`
              )}
            </button>

            <p
              className="text-center"
              style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: "0.625rem", color: "var(--fog)", letterSpacing: "0.08em", lineHeight: 1.7 }}
            >
              By placing your order you agree to our{" "}
              <Link href="/terms" className="hover:text-pale transition-colors" style={{ borderBottom: "1px solid var(--ember)" }}>Terms</Link>
              {" "}and{" "}
              <Link href="/privacy" className="hover:text-pale transition-colors" style={{ borderBottom: "1px solid var(--ember)" }}>Privacy Policy</Link>.
            </p>
          </form>
        </div>

          {/* ── Order Summary ── */}
          <div
            className="lg:col-span-5 p-6 h-fit"
            style={{ background: "var(--abyss)", border: "1px solid var(--ember)", position: "sticky", top: "120px" }}
          >
            <p className="label-syne text-salt mb-6">Order Summary</p>

            {/* Items */}
            <div className="space-y-4 mb-6 pb-6" style={{ borderBottom: "1px solid var(--ember)" }}>
              {items.map((item) => (
                <div key={`${item.productId}-${item.variantId}`} className="flex gap-3">
                  <div className="flex-shrink-0 overflow-hidden bg-dim" style={{ width: "52px", height: "64px" }}>
                    <img src={item.image || "/placeholder.svg"} alt={item.name} className="w-full h-full object-cover" style={{ filter: "grayscale(15%)" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate" style={{ fontFamily: "var(--font-syne), system-ui, sans-serif", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--salt)" }}>{item.name}</p>
                    <p style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: "0.625rem", color: "var(--ash)", marginTop: "4px", letterSpacing: "0.1em" }}>{item.size} × {item.quantity}</p>
                  </div>
                  <p style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: "0.75rem", color: "var(--pale)", whiteSpace: "nowrap" }}>
                    {formatCurrency(((item.salePrice ?? item.price) * (1 - item.discountRate / 100)) * item.quantity)}
                  </p>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="space-y-3">
              <div className="flex justify-between">
                <span style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: "0.75rem", color: "var(--ash)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Subtotal</span>
                <div className="text-right">
                  <span style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: "0.8125rem", color: "var(--pale)" }}>{formatCurrency(getSubtotal())}</span>
                  {isInternational && (<p style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: "0.625rem", color: "var(--fog)", marginTop: "2px" }}>≈ {formatLocalCurrency(getSubtotal() * localExchangeRate, localCurrencyCode)}</p>)}
                </div>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between">
                  <span style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: "0.75rem", color: "var(--success)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Discount</span>
                  <div className="text-right">
                    <span style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: "0.8125rem", color: "var(--success)" }}>-{formatCurrency(discountAmount)}</span>
                    {isInternational && (<p style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: "0.625rem", color: "var(--fog)", marginTop: "2px" }}>≈ -{formatLocalCurrency(discountAmount * localExchangeRate, localCurrencyCode)}</p>)}
                  </div>
                </div>
              )}
              {applicableTax > 0 && (
                <div className="flex justify-between">
                  <span style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: "0.75rem", color: "var(--fog)", letterSpacing: "0.08em" }}>{isInternational ? `Tax PPN (${intlTaxRate}%)` : "Pajak (PPN/PPH 23)"}</span>
                  <div className="text-right">
                    <span style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: "0.75rem", color: "var(--fog)" }}>+{formatCurrency(applicableTax)}</span>
                    {isInternational && (<p style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: "0.625rem", color: "var(--fog)", marginTop: "2px" }}>≈ +{formatLocalCurrency(applicableTax * localExchangeRate, localCurrencyCode)}</p>)}
                  </div>
                </div>
              )}
              {shippingCost > 0 && (
                <div className="flex justify-between">
                  <span style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: "0.75rem", color: "var(--fog)", letterSpacing: "0.08em" }}>Shipping</span>
                  <div className="text-right">
                    <span style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: "0.75rem", color: "var(--fog)" }}>+{formatCurrency(shippingCost)}</span>
                    {isInternational && (<p style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: "0.625rem", color: "var(--fog)", marginTop: "2px" }}>≈ +{formatLocalCurrency(shippingCost * localExchangeRate, localCurrencyCode)}</p>)}
                  </div>
                </div>
              )}

              <div className="section-divider" />

              <div className="flex justify-between pt-1">
                <span style={{ fontFamily: "var(--font-syne), system-ui, sans-serif", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--salt)" }}>Total</span>
                <div className="text-right">
                  <span style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: "1.125rem", color: "var(--signal)" }}>{formatCurrency(finalTotal)}</span>
                  {isInternational && (<p style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: "0.6875rem", color: "var(--ash)", marginTop: "4px" }}>≈ {formatLocalCurrency(finalTotalLocal, localCurrencyCode)}</p>)}
                </div>
              </div>
            </div>

            {/* BCA reminder */}
            <div className="mt-8 pt-6" style={{ borderTop: "1px solid var(--ember)" }}>
              <p className="label-eyebrow mb-3">Payment via</p>
              <div className="flex items-center gap-3">
                <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0" style={{ color: "var(--ash)" }} fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="5" width="20" height="14"/>
                  <path d="M2 10h20"/>
                </svg>
                <div>
                  <p style={{ fontFamily: "var(--font-syne), system-ui, sans-serif", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--pale)" }}>BCA Bank Transfer</p>
                  <p style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: "0.625rem", color: "var(--ash)", marginTop: "3px" }}>883190138549</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
