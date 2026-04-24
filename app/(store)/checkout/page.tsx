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
  HiOutlineLocationMarker,
  HiOutlineSearch,
  HiChevronDown,
} from "react-icons/hi";
import CopyButton from "@/components/store/CopyButton";


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
  const [internationalTaxRates, setInternationalTaxRates] = useState<Record<string, number>>({});
  const [countrySearch, setCountrySearch] = useState("");
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
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
  const domesticTax = 0; // Forced inactive for domestic as per requirement
  // Single global PPN rate for all international orders — automatically active
  const intlTaxRate = isInternational ? (internationalTaxRates["_global"] ?? 11) : 0;
  const internationalTax = isInternational ? Math.round(subtotal * (intlTaxRate / 100)) : 0;
  const applicableTax = isInternational ? internationalTax : domesticTax;
  const finalTotal = Math.max(0, subtotal + applicableTax - discountAmount);
  
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

  // Fetch dynamic currency conversion rate from CDN when country changes
  useEffect(() => {
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
        <HiOutlineShoppingBag className="w-10 h-10 text-ash mb-6" />
        <h1
          className="font-syne text-salt mb-4 uppercase font-bold"
          style={{ fontSize: "clamp(32px, 5vw, 52px)", lineHeight: 0.95 }}
        >
          Your cart is empty.
        </h1>
        <p className="font-dm-mono text-ash mb-10 max-w-[380px] text-sm">
          Add products to your cart before proceeding to checkout.
        </p>
        <Link href="/products" className="btn-primary py-4 px-10">
          Explore Archive
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
          <h1
            className="font-syne font-bold text-salt uppercase"
            style={{ fontSize: "clamp(42px, 8vw, 80px)", lineHeight: 0.88 }}
          >
            Checkout
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Form — 7 cols */}
          <div className="lg:col-span-7">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

            {/* ── Contact Information ── */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-ember">
                <HiOutlineUser className="w-5 h-5 text-salt flex-shrink-0" />
                <p className="font-syne font-bold text-salt uppercase tracking-widest text-sm">Contact Information</p>
              </div>

              {/* Full Name */}
              <div>
                <label htmlFor="fullName" className="font-syne font-bold text-ash text-xs uppercase tracking-widest block mb-3">
                  Full Name <span className="text-signal">*</span>
                </label>
                <input
                  {...register("fullName")}
                  id="fullName"
                  className="input-field"
                  placeholder="e.g. John Doe"
                  autoComplete="name"
                />
                {errors.fullName && (
                  <p className="mt-1 font-dm-mono text-xs text-signal">{errors.fullName.message}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="font-syne font-bold text-ash text-xs uppercase tracking-widest block mb-3">
                  Email Address <span className="text-signal">*</span>
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
                  <p className="mt-1 font-dm-mono text-xs text-signal">{errors.email.message}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="font-syne font-bold text-ash text-xs uppercase tracking-widest block mb-3">
                  Phone Number <span className="text-signal">*</span>
                  <span className="font-dm-mono text-[10px] text-ash normal-case tracking-normal ml-2">(WhatsApp preferred)</span>
                </label>
                <div className="relative">
                  {countryInfo && (
                    <span className="absolute top-1/2 -translate-y-1/2 left-0 font-dm-mono text-sm text-salt pointer-events-none select-none">
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
                  <p className="mt-1 font-dm-mono text-xs text-signal">{errors.phone.message}</p>
                )}
                <p className="mt-2 font-dm-mono text-xs text-ash">
                  We'll use this number to confirm your order via WhatsApp.
                </p>
              </div>
            </div>

            {/* ── Shipping Address ── */}
            <div className="space-y-6 pt-6 mt-6">
              <div className="flex items-center gap-3 pb-4 border-b border-ember">
                <HiOutlineLocationMarker className="w-5 h-5 text-salt flex-shrink-0" />
                <p className="font-syne font-bold text-salt uppercase tracking-widest text-sm">Shipping Address</p>
              </div>

              {/* Country Dropdown */}
              <div>
                <label className="font-syne font-bold text-ash text-xs uppercase tracking-widest block mb-3">
                  Country <span className="text-signal">*</span>
                </label>
                <div className="relative" ref={dropdownRef}>
                  <button
                    id="country-selector"
                    type="button"
                    onClick={() => setCountryDropdownOpen(!countryDropdownOpen)}
                    className={`w-full flex items-center justify-between gap-2 text-left py-3 border-b transition-colors ${countryDropdownOpen ? "border-salt" : "border-ember"}`}
                  >
                    <span className="flex items-center gap-2 font-dm-mono text-sm">
                      {countryInfo ? (
                        <>
                          <span className="w-5 h-3.5 overflow-hidden flex-shrink-0">
                            <img
                              src={`https://flagcdn.com/w40/${selectedCountry.toLowerCase()}.png`}
                              alt={countryInfo.name}
                              className="w-full h-full object-cover"
                            />
                          </span>
                          <span className="text-salt">{countryInfo.name}</span>
                        </>
                      ) : (
                        <span className="text-ash">Select your country</span>
                      )}
                    </span>
                    <HiChevronDown className={`w-4 h-4 text-ash transition-transform duration-200 ${countryDropdownOpen ? "rotate-180" : ""}`} />
                  </button>

                  {countryDropdownOpen && (
                    <div className="absolute z-50 top-full left-0 right-0 mt-1 overflow-hidden bg-abyss border border-ember shadow-2xl">
                      <div className="p-3 border-b border-ember relative">
                        <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ash" />
                        <input
                          type="text"
                          value={countrySearch}
                          onChange={e => setCountrySearch(e.target.value)}
                          className="w-full pl-8 py-2 bg-transparent border-b border-ember font-dm-mono text-sm text-salt outline-none focus:border-salt transition-colors"
                          placeholder="Search country..."
                          autoFocus
                        />
                      </div>
                      <div className="max-h-56 overflow-y-auto custom-scrollbar">
                        {countrySearch ? (
                          filteredCountries.length > 0 ? (
                            filteredCountries.map(c => (
                              <button
                                key={c.code}
                                type="button"
                                onClick={() => handleCountrySelect(c.code)}
                                className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-dim font-dm-mono text-sm"
                              >
                                <span className="w-5 h-3.5 overflow-hidden flex-shrink-0">
                                  <img src={`https://flagcdn.com/w40/${c.code.toLowerCase()}.png`} alt={c.name} className="w-full h-full object-cover" />
                                </span>
                                <span className={selectedCountry === c.code ? "text-salt font-medium" : "text-ash"}>{c.name}</span>
                                <span className="ml-auto text-xs text-ash">{c.code}</span>
                              </button>
                            ))
                          ) : (
                            <p className="text-center py-6 font-dm-mono text-sm text-ash">No countries found</p>
                          )
                        ) : (
                          regions.map(region => {
                            const regionCountries = WORLDWIDE_COUNTRIES.filter(c => c.region === region);
                            return (
                              <div key={region}>
                                <p className="px-4 pt-4 pb-2 font-syne font-bold text-[10px] text-ash uppercase tracking-widest bg-dim">
                                  {region}
                                </p>
                                {regionCountries.map(c => (
                                  <button
                                    key={c.code}
                                    type="button"
                                    onClick={() => handleCountrySelect(c.code)}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-dim font-dm-mono text-sm"
                                  >
                                    <span className="w-5 h-3.5 overflow-hidden flex-shrink-0">
                                      <img src={`https://flagcdn.com/w40/${c.code.toLowerCase()}.png`} alt={c.name} className="w-full h-full object-cover" />
                                    </span>
                                    <span className={selectedCountry === c.code ? "text-salt font-medium" : "text-ash"}>{c.name}</span>
                                    <span className="ml-auto text-xs text-ash">{c.code}</span>
                                  </button>
                                ))}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                  <input type="hidden" {...register("country")} />
                </div>
                {errors.country && (
                  <p className="mt-1 font-dm-mono text-xs text-signal">{errors.country.message}</p>
                )}
              </div>

              {/* Street Address */}
              <div>
                <label htmlFor="streetAddress" className="font-syne font-bold text-ash text-xs uppercase tracking-widest block mb-3">
                  Street Address <span className="text-signal">*</span>
                </label>
                <input
                  {...register("streetAddress")}
                  id="streetAddress"
                  className="input-field"
                  placeholder="e.g. 123 Orchard Road"
                  autoComplete="address-line1"
                />
                {errors.streetAddress && (
                  <p className="mt-1 font-dm-mono text-xs text-signal">{errors.streetAddress.message}</p>
                )}
              </div>

              {/* Apartment */}
              <div>
                <label htmlFor="apartment" className="font-syne font-bold text-ash text-xs uppercase tracking-widest block mb-3">
                  Apartment, suite, etc. <span className="font-dm-mono normal-case tracking-normal text-[10px] text-ash">(optional)</span>
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
                  <label htmlFor="city" className="font-syne font-bold text-ash text-xs uppercase tracking-widest block mb-3">
                    City <span className="text-signal">*</span>
                  </label>
                  <input {...register("city")} id="city" className="input-field" placeholder="e.g. Singapore" autoComplete="address-level2" />
                  {errors.city && (<p className="mt-1 font-dm-mono text-xs text-signal">{errors.city.message}</p>)}
                </div>
                <div>
                  <label htmlFor="stateProvince" className="font-syne font-bold text-ash text-xs uppercase tracking-widest block mb-3">
                    Province / State <span className="text-signal">*</span>
                  </label>
                  <input {...register("stateProvince")} id="stateProvince" className="input-field" placeholder="e.g. Central Region" autoComplete="address-level1" />
                  {errors.stateProvince && (<p className="mt-1 font-dm-mono text-xs text-signal">{errors.stateProvince.message}</p>)}
                </div>
              </div>

              {/* ZIP / Postal Code */}
              <div>
                <label htmlFor="zipCode" className="font-syne font-bold text-ash text-xs uppercase tracking-widest block mb-3">
                  Postal Code <span className="text-signal">*</span>
                </label>
                <input {...register("zipCode")} id="zipCode" className="input-field" style={{ maxWidth: "200px" }} placeholder="e.g. 238801" autoComplete="postal-code" />
                {errors.zipCode && (<p className="mt-1 font-dm-mono text-xs text-signal">{errors.zipCode.message}</p>)}
              </div>

              {/* Shipping Notice */}
              <div className="flex items-start gap-3 p-4 bg-abyss border border-ember mt-4">
                <HiOutlineGlobeAlt className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isInternational ? "text-salt" : "text-ash"}`} />
                <div>
                  <p className={`font-syne font-bold text-xs tracking-widest uppercase mb-1 ${isInternational ? "text-salt" : "text-ash"}`}>
                    {isInternational ? "International Delivery" : "Domestic Delivery (Indonesia)"}
                  </p>
                  <p className="font-dm-mono text-xs text-ash mb-3">
                    {isInternational ? "Est. 3–14 days" : "Domestic standard delivery"}
                  </p>
                  <div className="p-3 bg-dim border border-ember">
                    <p className="font-dm-mono text-[11px] text-ash leading-relaxed">
                      * Price does not include shipping fee. Please complete the checkout first and contact our CS via WhatsApp to coordinate shipping costs.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Payment Method ── */}
            <div className="pt-6 mt-6">
              <div className="flex items-center gap-3 pb-4 mb-6 border-b border-ember">
                <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0 text-salt" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="5" width="20" height="14"/>
                  <path d="M2 10h20"/>
                </svg>
                <p className="font-syne font-bold text-salt uppercase tracking-widest text-sm">Payment Method</p>
              </div>
              <div className="flex items-center gap-4 p-5 bg-abyss border border-ember">
                <div className="w-14 h-auto flex-shrink-0 bg-white p-1.5 flex items-center justify-center">
                  <img src="/images/bca.png" alt="BCA Logo" className="w-full h-auto object-contain" />
                </div>
                <div>
                  <p className="font-syne font-bold text-salt text-sm tracking-widest uppercase mb-1">Bank Transfer (BCA)</p>
                  <p className="font-dm-mono text-xs text-ash">
                    {isInternational ? "International bank transfer · Confirm via WhatsApp" : "Domestic bank transfer · Confirm via WhatsApp"}
                  </p>
                </div>
              </div>
            </div>

            {/* ── Coupon ── */}
            <div className="pt-6 mt-6">
              <p className="font-syne font-bold text-salt uppercase tracking-widest text-sm mb-4">Coupon Code</p>
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
                  <button type="button" onClick={handleApplyCoupon} disabled={!couponCode || validatingCoupon} className="btn-ghost px-6 py-0 disabled:opacity-40 uppercase tracking-widest font-syne font-bold text-xs">
                    {validatingCoupon ? "..." : "Apply"}
                  </button>
                ) : (
                  <button type="button" onClick={handleRemoveCoupon} className="btn-ghost px-6 py-0 uppercase tracking-widest font-syne font-bold text-xs text-signal border-signal hover:bg-signal hover:text-void">
                    Remove
                  </button>
                )}
              </div>
              {appliedCoupon && (
                <p className="mt-3 font-dm-mono text-xs text-salt bg-abyss border border-salt px-3 py-2 inline-block">
                  ✓ Coupon applied: -{formatCurrency(discountAmount)}
                </p>
              )}
            </div>

            {/* ── Submit ── */}
            <div className="pt-8">
              <button
                type="submit"
                id="place-order-btn"
                disabled={loading}
                className="btn-primary w-full py-5 text-sm tracking-[0.2em] uppercase transition-transform active:scale-[0.98]"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  `Place Order — ${isInternational ? formatLocalCurrency(finalTotalLocal, localCurrencyCode) : formatCurrency(finalTotal)}`
                )}
              </button>

              <p className="text-center mt-6 font-dm-mono text-[10px] text-ash leading-relaxed max-w-sm mx-auto">
                By placing your order you agree to our{" "}
                <Link href="/terms" className="text-salt underline underline-offset-4 hover:text-ash">Terms</Link>
                {" "}and{" "}
                <Link href="/privacy" className="text-salt underline underline-offset-4 hover:text-ash">Privacy Policy</Link>.
              </p>
            </div>
          </form>
        </div>

          {/* ── Order Summary ── */}
          <div
            className="lg:col-span-5 p-6 h-fit bg-abyss border border-ember"
            style={{ position: "sticky", top: "120px" }}
          >
            <div className="flex items-center justify-between mb-6">
              <p className="font-syne font-bold text-salt uppercase tracking-widest text-sm">Order Summary</p>
            </div>

            {/* Items */}
            <div className="space-y-4 mb-6 pb-6 border-b border-ember">
              {items.map((item) => (
                <div key={`${item.productId}-${item.variantId}`} className="flex gap-4">
                  <div className="flex-shrink-0 w-16 h-20 bg-dim">
                    <img src={item.image || "/placeholder.svg"} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <p className="font-syne font-bold text-salt text-xs tracking-widest uppercase truncate mb-1">{item.name}</p>
                    <p className="font-dm-mono text-ash text-xs mb-2">Size {item.size} <span className="mx-1">×</span> {item.quantity}</p>
                    <p className="font-dm-mono text-salt text-xs">
                      {formatCurrency(((item.salePrice ?? item.price) * (1 - item.discountRate / 100)) * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="space-y-4 font-dm-mono text-sm">
              <div className="flex justify-between items-start">
                <span className="text-ash uppercase tracking-widest text-xs mt-1">Subtotal</span>
                <div className="text-right">
                  <span className="text-salt">{formatCurrency(getSubtotal())}</span>
                  {isInternational && (<p className="text-xs text-ash mt-1">≈ {formatLocalCurrency(getSubtotal() * localExchangeRate, localCurrencyCode)}</p>)}
                </div>
              </div>
              
              {discountAmount > 0 && (
                <div className="flex justify-between items-start">
                  <span className="text-salt uppercase tracking-widest text-xs mt-1">Discount</span>
                  <div className="text-right">
                    <span className="text-salt">-{formatCurrency(discountAmount)}</span>
                    {isInternational && (<p className="text-xs text-ash mt-1">≈ -{formatLocalCurrency(discountAmount * localExchangeRate, localCurrencyCode)}</p>)}
                  </div>
                </div>
              )}
              
              {applicableTax > 0 && (
                <div className="flex justify-between items-start">
                  <span className="text-ash uppercase tracking-widest text-xs mt-1">{isInternational ? `Tax (${intlTaxRate}%)` : "Tax"}</span>
                  <div className="text-right">
                    <span className="text-ash">+{formatCurrency(applicableTax)}</span>
                    {isInternational && (<p className="text-xs text-ash mt-1">≈ +{formatLocalCurrency(applicableTax * localExchangeRate, localCurrencyCode)}</p>)}
                  </div>
                </div>
              )}
              
              <div className="w-full h-px bg-ember my-6" />

              <div className="flex justify-between items-start">
                <span className="font-syne font-bold text-salt uppercase tracking-widest text-sm mt-1">Total</span>
                <div className="text-right">
                  <span className="text-lg text-salt font-medium">{formatCurrency(finalTotal)}</span>
                  {isInternational && (<p className="text-xs text-ash mt-1">≈ {formatLocalCurrency(finalTotalLocal, localCurrencyCode)}</p>)}
                </div>
              </div>
            </div>

            {/* BCA reminder */}
            <div className="mt-8 pt-6 border-t border-ember">
              <p className="font-syne font-bold text-ash text-[10px] uppercase tracking-widest mb-4">Payment Information</p>
              <div className="flex items-start gap-4">
                <div className="w-12 h-auto flex-shrink-0 bg-white p-1.5 flex items-center justify-center">
                  <img src="/images/bca.png" alt="BCA Logo" className="w-full h-auto object-contain" />
                </div>
                <div>
                  <p className="font-syne font-bold text-salt text-xs tracking-widest uppercase mb-2">BCA Bank Transfer</p>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 font-dm-mono text-xs">
                      <span className="text-ash">No:</span>
                      <span className="text-salt">6768126284</span>
                      <CopyButton text="6768126284" />
                    </div>
                    <p className="font-dm-mono text-xs text-ash">Name: ILYASA MEYDIANSYAH A</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
