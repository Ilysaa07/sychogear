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
import { useTranslation } from "@/components/store/LanguageProvider";
import { State, City } from "country-state-city";
import {
  HiOutlineShoppingBag,
  HiOutlineGlobeAlt,
  HiOutlineUser,
  HiOutlineLocationMarker,
  HiOutlineSearch,
  HiChevronDown,
  HiOutlineCheckCircle,
} from "react-icons/hi";
import CopyButton from "@/components/store/CopyButton";
import Image from "next/image";
import Script from "next/script";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotal, getSubtotal, getTotalTax, clearCart, orderNote, setOrderNote } = useCartStore();
  const { countryCode: detectedCountry, isReady: currencyReady } = useCurrency();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [exchangeRate, setExchangeRate] = useState(16000); // fallback IDR to USD
  const [localCurrencyRate, setLocalCurrencyRate] = useState<number | null>(null);
  const [countrySearch, setCountrySearch] = useState("");
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const [showOrderSummaryMobile, setShowOrderSummaryMobile] = useState(false);

  // Address Selector States - Indonesia (Rajaongkir)
  const [subdistrictSearch, setSubdistrictSearch] = useState("");
  const [subdistrictResults, setSubdistrictResults] = useState<any[]>([]);
  const [isSearchingSubdistrict, setIsSearchingSubdistrict] = useState(false);
  const [selSubdistrict, setSelSubdistrict] = useState<{ id: string; name: string } | null>(null);
  const [showSubdistrictDropdown, setShowSubdistrictDropdown] = useState(false);

  // Available Couriers
  const [availableCouriers, setAvailableCouriers] = useState<any[]>([]);
  const [selCourier, setSelCourier] = useState<any | null>(null);

  // Address Selector States - International
  const [intlStates, setIntlStates] = useState<any[]>([]);
  const [intlCities, setIntlCities] = useState<any[]>([]);
  const [selIntlStateCode, setSelIntlStateCode] = useState<string>("");

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
      orderNote: orderNote || "",
    },
  });

  const selectedCountry = watch("country");
  const stateProvince = watch("stateProvince");
  const isInternational = selectedCountry !== "ID";
  const countryInfo = getCountryByCode(selectedCountry);

  // Shipping calculation
  const totalWeightGrams = items.reduce((sum, item) => {
    const isShorts = item.name.toLowerCase().includes('short');
    return sum + ((isShorts ? 200 : 300) * item.quantity);
  }, 0);
  
  const weightKg = Math.max(1, Math.ceil(totalWeightGrams / 1000));
  
  const shippingCost = isInternational 
    ? -1 // Contact WA for international rates
    : (selCourier ? selCourier.cost : 0);

  const subtotal = getSubtotal();
  const applicableTax = 0;
  // If shippingCost is -1, it means we don't have the rate, so we don't add it to total.
  const finalTotal = Math.max(0, subtotal + applicableTax + (shippingCost > 0 ? shippingCost : 0) - discountAmount);
  
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
        }
      } catch {
        console.warn("Failed to fetch settings");
      }
    };

    fetchSettings();
  }, []);

  // Fetch Rajaongkir Subdistricts
  useEffect(() => {
    if (selectedCountry !== "ID" || subdistrictSearch.length < 3) {
      setSubdistrictResults([]);
      return;
    }

    // Do not search if the search text exactly matches the currently selected subdistrict name
    if (selSubdistrict && subdistrictSearch === selSubdistrict.name) {
      return;
    }
    
    const debounce = setTimeout(async () => {
      setIsSearchingSubdistrict(true);
      try {
        const { data } = await axios.get(`/api/shipping/coverage?q=${encodeURIComponent(subdistrictSearch)}`);
        if (data.success) {
          setSubdistrictResults(data.data);
          setShowSubdistrictDropdown(true);
        }
      } catch (err) {
        console.error("Failed to search subdistricts");
      } finally {
        setIsSearchingSubdistrict(false);
      }
    }, 500);
    
    return () => clearTimeout(debounce);
  }, [subdistrictSearch, selectedCountry]);

  // Fetch Rajaongkir Rates when subdistrict is selected
  useEffect(() => {
    if (selectedCountry === "ID" && selSubdistrict && items.length > 0) {
      const fetchRates = async () => {
        try {
          const { data } = await axios.post("/api/shipping/rates", {
            subdistrictId: selSubdistrict.id,
            items: items
          });
          if (data.success && data.data && data.data.length > 0) {
            let allRates = data.data.map((rate: any) => ({
              courierCode: rate.courier_code,
              courierName: rate.courier_name,
              service: rate.service_name,
              description: rate.description,
              cost: rate.price,
              etd: rate.estimated_delivery_time
            }));
            setAvailableCouriers(allRates);
            // Auto-select first available rate if none selected
            if (allRates.length > 0) {
              setSelCourier(allRates[0]);
            }
          } else {
            setAvailableCouriers([]);
            setSelCourier(null);
          }
        } catch (err) {
          console.error("Failed to fetch shipping rates", err);
          toast.error("Gagal mengambil tarif pengiriman.");
        }
      };
      fetchRates();
    } else {
      setAvailableCouriers([]);
      setSelCourier(null);
    }
  }, [selSubdistrict, items, selectedCountry]);

  // Fetch International States/Cities
  useEffect(() => {
    if (isInternational) {
      const states = State.getStatesOfCountry(selectedCountry);
      setIntlStates(states);
      setSelIntlStateCode("");
      setIntlCities([]);
      setValue("stateProvince", "", { shouldValidate: true });
      setValue("city", "", { shouldValidate: true });
    }
  }, [selectedCountry, isInternational, setValue]);

  useEffect(() => {
    if (isInternational && selIntlStateCode) {
      const cities = City.getCitiesOfState(selectedCountry, selIntlStateCode);
      setIntlCities(cities);
      setValue("city", "", { shouldValidate: true });
    } else {
      setIntlCities([]);
    }
  }, [selIntlStateCode, selectedCountry, isInternational, setValue]);

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

  const onSubmit = async (formData: CheckoutFormData) => {
    setLoading(true);
    try {
      let finalStreetAddress = formData.streetAddress;
      if (selectedCountry === "ID" && selSubdistrict) {
        finalStreetAddress = `${formData.streetAddress}, ${selSubdistrict.name}`;
      }
      const payloadData = { 
        ...formData, 
        streetAddress: finalStreetAddress,
        subdistrictId: selSubdistrict?.id || undefined,
      };

      const turnstileToken = (document.querySelector('[name="cf-turnstile-response"]') as HTMLInputElement)?.value;
      if (!turnstileToken) {
        toast.error("Please complete the security check.");
        setLoading(false);
        return;
      }

      const { data } = await axios.post("/api/orders/create", {
        customer: payloadData,
        items,
        couponCode: couponCode || undefined,
        shippingCost: shippingCost > 0 ? shippingCost : 0,
        turnstileToken,
      });

      if (data.success) {
        setOrderNote(""); // Clear order note on success
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


  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-void text-salt flex flex-col items-center justify-center p-8">
        <HiOutlineShoppingBag className="w-16 h-16 text-ash mb-4" />
        <h1 className="font-syne text-2xl font-bold mb-2 uppercase tracking-widest text-brand-500">Your Cart is Empty</h1>
        <p className="text-sm text-ash mb-8 text-center max-w-md">Looks like you haven't added any gear yet. Return to the store and find something you like.</p>
        <Link href="/" className="bg-salt text-void px-8 py-3 rounded-lg font-bold uppercase tracking-widest hover:bg-ash transition-colors">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-void flex flex-col-reverse lg:flex-row font-sans selection:bg-salt selection:text-void">
      <Script 
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" 
        strategy="afterInteractive" 
        onLoad={() => {
          const turnstile = (window as any).turnstile;
          if (turnstile && turnstileRef.current) {
            turnstile.render(turnstileRef.current, {
              sitekey: "0x4AAAAAAElyQyM0Ru1Qj7kv",
              action: "checkout",
              theme: "dark"
            });
          }
        }}
      />
      {/* ─── Left Column (Form) ─── */}
      <div className="w-full lg:w-[55%] xl:w-[60%] bg-void pt-8 pb-24 px-4 sm:px-8 lg:px-16 xl:px-24">
        
        {/* Mobile Accordion Toggle */}
        <button 
          type="button"
          className="lg:hidden w-full flex items-center justify-between py-4 mb-8 border-b border-salt/10 text-sm font-bold text-salt"
          onClick={() => setShowOrderSummaryMobile(!showOrderSummaryMobile)}
        >
          <span className="flex items-center gap-2 text-salt">
            <HiOutlineShoppingBag className="w-5 h-5" />
            {showOrderSummaryMobile ? "Hide order summary" : "Show order summary"}
            <HiChevronDown className={`w-4 h-4 transition-transform ${showOrderSummaryMobile ? "rotate-180" : ""}`} />
          </span>
          <span className="font-dm-mono text-lg">{isInternational ? formatLocalCurrency(finalTotalLocal, localCurrencyCode) : formatCurrency(finalTotal)}</span>
        </button>


        <form id="checkout-form" onSubmit={handleSubmit(onSubmit)} className="space-y-10 max-w-2xl mx-auto lg:mx-0">

              {/* ── Contact Information ── */}
              <section>
                <h2 className="font-syne font-bold text-salt text-2xl tracking-wide mb-6">Contact</h2>
                
                <div className="space-y-4">
                  {/* Floating Label: Email */}
                  <div className="relative">
                    <input
                      {...register("email")}
                      id="email"
                      type="email"
                      className="peer w-full bg-[#0a0a0a] border border-salt/10 rounded-lg px-4 pt-6 pb-2 text-base text-salt placeholder-transparent focus:border-salt/40 focus:outline-none focus:ring-1 focus:ring-salt/40 transition-all"
                      placeholder="Email Address"
                      autoComplete="email"
                    />
                    <label
                      htmlFor="email"
                      className="absolute left-4 top-2 text-[10px] text-fog uppercase tracking-widest transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-placeholder-shown:text-ash peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-fog pointer-events-none"
                    >
                      Email Address <span className="text-signal">*</span>
                    </label>
                    {errors.email && (
                      <p className="mt-1 font-dm-mono text-xs text-signal px-1">{errors.email.message}</p>
                    )}
                  </div>
                </div>
              </section>

              {/* ── Delivery ── */}
              <section>
                <h2 className="font-syne font-bold text-salt text-2xl tracking-wide mb-6">Delivery</h2>
                
                <div className="space-y-4">
                  {/* Floating Label: Country Select */}
                  <div className="relative">
                    <div
                      className="peer w-full bg-[#0a0a0a] border border-salt/10 rounded-lg px-4 pt-6 pb-2 text-base text-salt focus-within:border-salt/40 focus-within:ring-1 focus-within:ring-salt/40 transition-all cursor-pointer flex items-center justify-between"
                      onClick={() => setCountryDropdownOpen(!countryDropdownOpen)}
                    >
                      <span>{countryInfo ? countryInfo.name : ""}</span>
                      <HiChevronDown className="w-5 h-5 text-ash" />
                    </div>
                    <label className="absolute left-4 top-2 text-[10px] text-fog uppercase tracking-widest pointer-events-none">
                      Country/Region <span className="text-signal">*</span>
                    </label>

                    {countryDropdownOpen && (
                      <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-[#111111] border border-salt/10 rounded-lg shadow-2xl max-h-64 overflow-y-auto overflow-x-hidden">
                        <div className="sticky top-0 bg-[#111111] p-3 border-b border-salt/10">
                          <div className="relative">
                            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-ash" />
                            <input
                              type="text"
                              value={countrySearch}
                              onChange={e => setCountrySearch(e.target.value)}
                              className="w-full pl-9 py-2 bg-[#0a0a0a] rounded border border-salt/5 font-dm-mono text-sm text-salt outline-none focus:border-salt/20"
                              placeholder="Search country..."
                              autoFocus
                            />
                          </div>
                        </div>
                        <div className="py-2">
                          {filteredCountries.map(c => (
                            <div
                              key={c.code}
                              className="px-4 py-3 hover:bg-[#1a1a1a] cursor-pointer flex items-center justify-between group transition-colors"
                              onClick={() => handleCountrySelect(c.code)}
                            >
                              <span className="font-dm-mono text-sm text-salt group-hover:text-white">{c.name}</span>
                              {selectedCountry === c.code && <HiOutlineCheckCircle className="w-5 h-5 text-brand-500" />}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Floating Label: Full Name */}
                    <div className="relative sm:col-span-2">
                      <input
                        {...register("fullName")}
                        id="fullName"
                        className="peer w-full bg-[#0a0a0a] border border-salt/10 rounded-lg px-4 pt-6 pb-2 text-base text-salt placeholder-transparent focus:border-salt/40 focus:outline-none focus:ring-1 focus:ring-salt/40 transition-all"
                        placeholder="Full Name"
                        autoComplete="name"
                      />
                      <label
                        htmlFor="fullName"
                        className="absolute left-4 top-2 text-[10px] text-fog uppercase tracking-widest transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-placeholder-shown:text-ash peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-fog pointer-events-none"
                      >
                        Full Name <span className="text-signal">*</span>
                      </label>
                      {errors.fullName && (
                        <p className="mt-1 font-dm-mono text-xs text-signal px-1">{errors.fullName.message}</p>
                      )}
                    </div>

                    {/* Floating Label: Phone */}
                    <div className="relative sm:col-span-2 flex">
                      {countryInfo && (
                        <div className="absolute left-1 top-1 bottom-1 bg-[#111111] border-r border-salt/10 rounded-l-md px-3 flex items-center justify-center pointer-events-none z-10">
                          <span className="text-sm font-dm-mono text-salt">{countryInfo.phonePrefix}</span>
                        </div>
                      )}
                      <input
                        {...register("phone")}
                        id="phone"
                        className={`peer w-full bg-[#0a0a0a] border border-salt/10 rounded-lg ${countryInfo ? "pl-20" : "px-4"} pt-6 pb-2 text-base text-salt placeholder-transparent focus:border-salt/40 focus:outline-none focus:ring-1 focus:ring-salt/40 transition-all`}
                        placeholder="Phone Number"
                        autoComplete="tel"
                      />
                      <label
                        htmlFor="phone"
                        className={`absolute ${countryInfo ? "left-20" : "left-4"} top-2 text-[10px] text-fog uppercase tracking-widest transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-placeholder-shown:text-ash peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-fog pointer-events-none z-10`}
                      >
                        Phone Number <span className="text-signal">*</span>
                      </label>
                      {errors.phone && (
                        <p className="absolute -bottom-6 left-1 font-dm-mono text-xs text-signal">{errors.phone.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Spacer for phone error */}
                  {errors.phone && <div className="h-6"></div>}

                  {/* Floating Label: Street Address */}
                  <div className="relative">
                    <input
                      {...register("streetAddress")}
                      id="streetAddress"
                      className="peer w-full bg-[#0a0a0a] border border-salt/10 rounded-lg px-4 pt-6 pb-2 text-base text-salt placeholder-transparent focus:border-salt/40 focus:outline-none focus:ring-1 focus:ring-salt/40 transition-all"
                      placeholder="Street Name, Building, House No."
                      autoComplete="address-line1"
                    />
                    <label
                      htmlFor="streetAddress"
                      className="absolute left-4 top-2 text-[10px] text-fog uppercase tracking-widest transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-placeholder-shown:text-ash peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-fog pointer-events-none"
                    >
                      Street Name, Building, House No. <span className="text-signal">*</span>
                    </label>
                    {errors.streetAddress && (
                      <p className="mt-1 font-dm-mono text-xs text-signal px-1">{errors.streetAddress.message}</p>
                    )}
                  </div>

                  {/* Floating Label: Apartment */}
                  <div className="relative">
                    <input
                      {...register("apartment")}
                      id="apartment"
                      className="peer w-full bg-[#0a0a0a] border border-salt/10 rounded-lg px-4 pt-6 pb-2 text-base text-salt placeholder-transparent focus:border-salt/40 focus:outline-none focus:ring-1 focus:ring-salt/40 transition-all"
                      placeholder="Apartment, suite, etc."
                      autoComplete="address-line2"
                    />
                    <label
                      htmlFor="apartment"
                      className="absolute left-4 top-2 text-[10px] text-fog uppercase tracking-widest transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-placeholder-shown:text-ash peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-fog pointer-events-none"
                    >
                      Apartment, suite, etc. (optional)
                    </label>
                  </div>

                  {/* Area Search / City / State */}
                  {!isInternational ? (
                    <div className="relative">
                      <div className="relative">
                        <input
                          type="text"
                          value={subdistrictSearch}
                          onChange={(e) => {
                            setSubdistrictSearch(e.target.value);
                            setSelSubdistrict(null);
                            setAvailableCouriers([]);
                            setSelCourier(null);
                            setValue("stateProvince", "", { shouldValidate: true });
                            setValue("city", "", { shouldValidate: true });
                          }}
                          onFocus={() => {
                            if (subdistrictResults.length > 0) setShowSubdistrictDropdown(true);
                          }}
                          className="peer w-full bg-[#0a0a0a] border border-salt/10 rounded-lg px-4 pt-6 pb-2 text-base text-salt placeholder-transparent focus:border-salt/40 focus:outline-none focus:ring-1 focus:ring-salt/40 transition-all"
                          placeholder="Search Village, District, or City"
                        />
                        <label className="absolute left-4 top-2 text-[10px] text-fog uppercase tracking-widest transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-placeholder-shown:text-ash peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-fog pointer-events-none">
                          Search Village, District, or City <span className="text-signal">*</span>
                        </label>
                        {isSearchingSubdistrict && (
                          <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        )}
                        {errors.stateProvince && (<p className="mt-1 font-dm-mono text-xs text-signal px-1">Please select a valid delivery area</p>)}
                      </div>

                      {/* Dropdown Results */}
                      {showSubdistrictDropdown && subdistrictResults.length > 0 && (
                        <div className="absolute z-50 top-full mt-2 left-0 right-0 bg-[#111111] border border-salt/10 rounded-lg shadow-2xl max-h-60 overflow-y-auto">
                          {subdistrictResults.map((res: any) => (
                            <div
                              key={res.id}
                              className="px-4 py-3 hover:bg-[#1a1a1a] cursor-pointer border-b border-salt/5 last:border-0"
                              onClick={() => {
                                const name = `${res.name}, ${res.city_name}, ${res.province_name}`;
                                setSelSubdistrict({ id: res.id, name });
                                setSubdistrictSearch(name);
                                setShowSubdistrictDropdown(false);
                                // Satisfy zod validation
                                setValue("stateProvince", res.province_name, { shouldValidate: true });
                                setValue("city", res.city_name, { shouldValidate: true });
                                if (res.postal_code) {
                                  setValue("zipCode", res.postal_code.toString(), { shouldValidate: true });
                                }
                              }}
                            >
                              <p className="font-bold text-sm text-salt">{res.name}</p>
                              <p className="text-xs text-ash mt-0.5">{res.type} {res.city_name}, {res.province_name}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* State/Province */}
                      <div className="relative">
                        {intlStates.length > 0 ? (
                          <>
                            <select 
                              className="peer w-full bg-[#0a0a0a] border border-salt/10 rounded-lg px-4 pt-6 pb-2 text-base text-salt focus:border-salt/40 focus:outline-none focus:ring-1 focus:ring-salt/40 transition-all appearance-none cursor-pointer pr-10" 
                              value={selIntlStateCode} 
                              onChange={e => {
                                setSelIntlStateCode(e.target.value);
                                const st = intlStates.find(x => x.isoCode === e.target.value);
                                setValue("stateProvince", st ? st.name : e.target.value, { shouldValidate: true });
                              }}
                            >
                              <option value="" disabled>Select State/Province</option>
                              {intlStates.map(p => <option key={p.isoCode} value={p.isoCode}>{p.name}</option>)}
                            </select>
                            <HiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-ash w-5 h-5 pointer-events-none" />
                          </>
                        ) : (
                          <input 
                            {...register("stateProvince")} 
                            className="peer w-full bg-[#0a0a0a] border border-salt/10 rounded-lg px-4 pt-6 pb-2 text-base text-salt placeholder-transparent focus:border-salt/40 focus:outline-none focus:ring-1 focus:ring-salt/40 transition-all" 
                            placeholder="State / Province" 
                          />
                        )}
                        <label className="absolute left-4 top-2 text-[10px] text-fog uppercase tracking-widest transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-placeholder-shown:text-ash peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-fog pointer-events-none">
                          State / Province <span className="text-signal">*</span>
                        </label>
                        {errors.stateProvince && (<p className="mt-1 font-dm-mono text-xs text-signal px-1">{errors.stateProvince.message}</p>)}
                      </div>

                      {/* City */}
                      <div className="relative">
                        {intlCities.length > 0 ? (
                          <>
                            <select 
                              className="peer w-full bg-[#0a0a0a] border border-salt/10 rounded-lg px-4 pt-6 pb-2 text-base text-salt focus:border-salt/40 focus:outline-none focus:ring-1 focus:ring-salt/40 transition-all appearance-none cursor-pointer pr-10" 
                              defaultValue="" 
                              onChange={e => {
                                setValue("city", e.target.value, { shouldValidate: true });
                              }}
                            >
                              <option value="" disabled>Select City</option>
                              {intlCities.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                            </select>
                            <HiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-ash w-5 h-5 pointer-events-none" />
                          </>
                        ) : (
                          <input 
                            {...register("city")} 
                            className="peer w-full bg-[#0a0a0a] border border-salt/10 rounded-lg px-4 pt-6 pb-2 text-base text-salt placeholder-transparent focus:border-salt/40 focus:outline-none focus:ring-1 focus:ring-salt/40 transition-all" 
                            placeholder="City" 
                          />
                        )}
                        <label className="absolute left-4 top-2 text-[10px] text-fog uppercase tracking-widest transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-placeholder-shown:text-ash peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-fog pointer-events-none">
                          City <span className="text-signal">*</span>
                        </label>
                        {errors.city && (<p className="mt-1 font-dm-mono text-xs text-signal px-1">{errors.city.message}</p>)}
                      </div>
                    </div>
                  )}

                  {/* ZIP / Postal Code */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="relative">
                      <input 
                        {...register("zipCode")} 
                        id="zipCode" 
                        className="peer w-full bg-[#0a0a0a] border border-salt/10 rounded-lg px-4 pt-6 pb-2 text-base text-salt placeholder-transparent focus:border-salt/40 focus:outline-none focus:ring-1 focus:ring-salt/40 transition-all"
                        placeholder="ZIP Code" 
                        autoComplete="postal-code" 
                      />
                      <label
                        htmlFor="zipCode"
                        className="absolute left-4 top-2 text-[10px] text-fog uppercase tracking-widest transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-placeholder-shown:text-ash peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-fog pointer-events-none"
                      >
                        ZIP / Postal Code <span className="text-signal">*</span>
                      </label>
                      {errors.zipCode && (<p className="mt-1 font-dm-mono text-xs text-signal px-1">{errors.zipCode.message}</p>)}
                    </div>
                  </div>
                </div>
              </section>

              {/* ── Shipping Method ── */}
              <section>
                <h2 className="font-syne font-bold text-salt text-2xl tracking-wide mb-6">Shipping Method</h2>
                
                <div className="bg-[#0a0a0a] border border-salt/10 rounded-xl overflow-hidden">
                  {!isInternational ? (
                    availableCouriers.length > 0 ? (
                      <div className="divide-y divide-salt/10">
                        {availableCouriers.map((rate, idx) => {
                          const isSelected = selCourier?.courierCode === rate.courierCode && selCourier?.service === rate.service;
                          return (
                            <div 
                              key={idx} 
                              className={`p-5 flex items-center justify-between cursor-pointer transition-colors ${isSelected ? 'bg-[#1a1a1a]' : 'hover:bg-[#111111]'}`}
                              onClick={() => {
                                setSelCourier(rate);
                                // For Prisma: save courier service
                                setValue("shippingService", `${rate.courierCode.toUpperCase()} - ${rate.service}`, { shouldValidate: true });
                              }}
                            >
                              <div className="flex items-center gap-4">
                                <div className={`w-5 h-5 rounded-full border flex-shrink-0 flex items-center justify-center ${isSelected ? 'border-[#E2202C] bg-[#E2202C]' : 'border-salt/30'}`}>
                                  {isSelected && <div className="w-1.5 h-1.5 bg-void rounded-full" />}
                                </div>
                                <div>
                                  <p className="font-bold text-sm text-salt uppercase tracking-wider">{rate.courierName} ({rate.service})</p>
                                  <p className="text-xs text-ash mt-1">{rate.description} {rate.etd ? `— Est. ${rate.etd} Hari` : ''}</p>
                                </div>
                              </div>
                              <div className="font-dm-mono text-sm font-bold text-salt">
                                {formatCurrency(rate.cost)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-5 flex items-center justify-between bg-[#111111]">
                        <div className="flex items-center gap-4">
                          <div className="w-5 h-5 rounded-full border border-salt/30 flex items-center justify-center">
                          </div>
                          <div>
                            <p className="font-bold text-sm text-ash uppercase tracking-wider">Select a delivery area</p>
                            <p className="text-[10px] text-fog mt-1 uppercase tracking-widest">To see available shipping rates</p>
                          </div>
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="p-5 flex items-center justify-between bg-[#1a1a1a]">
                      <div className="flex items-center gap-4">
                        <div className="w-5 h-5 rounded-full border border-brand-500 bg-brand-500 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 bg-void rounded-full" />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-salt uppercase tracking-wider">International Shipping</p>
                          <p className="text-xs text-ash mt-1">Calculated based on weight and destination</p>
                        </div>
                      </div>
                      <div className="font-dm-mono text-sm font-bold text-salt">
                        {shippingCost > 0 ? formatCurrency(shippingCost) : "TBD"}
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* ── Order Notes ── */}
              <section>
                <div className="relative">
                  <textarea
                    {...register("orderNote")}
                    id="orderNote"
                    rows={2}
                    className="peer w-full bg-[#0a0a0a] border border-salt/10 rounded-lg px-4 pt-6 pb-2 text-base text-salt placeholder-transparent focus:border-salt/40 focus:outline-none focus:ring-1 focus:ring-salt/40 transition-all resize-none"
                    placeholder="Order Notes"
                  />
                  <label
                    htmlFor="orderNote"
                    className="absolute left-4 top-2 text-[10px] text-fog uppercase tracking-widest transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-placeholder-shown:text-ash peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-fog pointer-events-none"
                  >
                    Order Notes (optional)
                  </label>
                </div>
              </section>

              {/* ── Payment ── */}
              <section>
                <h2 className="font-syne font-bold text-salt text-2xl tracking-wide mb-6">Payment</h2>
                <div className="bg-[#0a0a0a] border border-salt/10 rounded-xl overflow-hidden">
                  <div className="p-5 flex items-center justify-between bg-[#1a1a1a]">
                    <div className="flex items-center gap-4">
                      <div className="w-5 h-5 rounded-full border border-[#E2202C] bg-[#E2202C] flex items-center justify-center flex-shrink-0">
                        <div className="w-1.5 h-1.5 bg-void rounded-full" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-salt uppercase tracking-wider">DOKU Secure Payment</p>
                        <p className="text-[10px] text-ash mt-1 uppercase tracking-widest">Credit Card, Virtual Account, e-Wallet</p>
                      </div>
                    </div>
                    <div className="flex-shrink-0 bg-white px-2.5 py-1 rounded ml-4 flex items-center justify-center shadow-inner">
                      <img src="/images/doku.jpg" alt="DOKU" className="h-5 w-auto object-contain mix-blend-multiply" />
                    </div>
                  </div>
                  <div className="p-5 border-t border-salt/5 bg-[#0a0a0a] flex flex-col items-center text-center">
                    <svg className="w-8 h-8 text-ash/30 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <p className="text-[11px] text-ash max-w-sm uppercase tracking-wider leading-relaxed">
                      After clicking "Pay Now", you will be redirected to DOKU to complete your purchase securely.
                    </p>
                  </div>
                </div>
              </section>

              {/* Sticky Submit Button on Mobile */}
              {/* Sticky Submit Button on Mobile */}
              <div className="fixed bottom-0 left-0 right-0 p-4 bg-void/90 backdrop-blur-md border-t border-salt/10 z-40 lg:hidden">
                <button
                  type="submit"
                  form="checkout-form"
                  disabled={loading}
                  className="w-full bg-[#E2202C] text-white hover:bg-red-600 font-black uppercase tracking-widest py-4 rounded-xl transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(226,32,44,0.4)] hover:shadow-[0_0_30px_rgba(226,32,44,0.6)] flex items-center justify-center gap-2 text-lg"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="flex gap-1 mr-1">
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                      <span>PROCESSING</span>
                    </div>
                  ) : (
                    "Pay Now"
                  )}
                </button>
              </div>

              {/* ── Turnstile ── */}
              <section className="flex justify-center my-6">
                <div ref={turnstileRef} className="min-h-[65px]"></div>
              </section>

        </form>
      </div>

      {/* ─── Right Column (Order Summary) ─── */}
      <div className={`w-full lg:w-[45%] xl:w-[40%] bg-[#0a0a0a] ${showOrderSummaryMobile ? "block" : "hidden"} lg:block border-l border-salt/5`}>
        <div className="sticky top-0 p-6 sm:p-10 lg:p-12 xl:p-16 h-auto lg:h-screen lg:overflow-y-auto custom-scrollbar">
          
          <div className="hidden lg:block mb-10">
            <h2 className="font-syne font-bold text-salt text-xl tracking-widest uppercase">Order Summary</h2>
          </div>

          {/* Items List */}
          <div className="space-y-5 mb-10">
            {items.map((item) => {
              const itemPrice = (item.salePrice ?? item.price) * (1 - (item.discountRate || 0) / 100);
              return (
                <div key={`${item.productId}-${item.variantId}`} className="flex gap-4 items-center group">
                  <div className="relative flex-shrink-0 w-16 h-16 bg-[#111111] rounded-md border border-salt/10 overflow-hidden flex items-center justify-center">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <HiOutlineShoppingBag className="w-5 h-5 text-ash" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-salt uppercase leading-tight truncate">{item.name}</p>
                    <p className="text-[10px] text-ash uppercase tracking-widest mt-1">
                      {item.size} <span className="mx-1">•</span> QTY: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-dm-mono text-sm text-salt">{formatCurrency(itemPrice * item.quantity)}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Coupon Code Section */}
          <div className="mb-10">
            <div className="relative flex items-center">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                disabled={!!appliedCoupon}
                className="w-full bg-[#111111] border border-salt/10 rounded-full pl-5 pr-24 py-3 text-xs text-salt placeholder-ash uppercase tracking-widest focus:border-salt/40 focus:outline-none transition-all disabled:opacity-50"
                placeholder="Gift card or discount code"
              />
              <button
                type="button"
                onClick={appliedCoupon ? handleRemoveCoupon : handleApplyCoupon}
                disabled={(!couponCode && !appliedCoupon) || validatingCoupon}
                className={`absolute right-1 top-1 bottom-1 px-4 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-50 ${appliedCoupon ? 'bg-signal/10 text-signal hover:bg-signal/20' : 'bg-salt text-void hover:bg-ash'}`}
              >
                {validatingCoupon ? "..." : appliedCoupon ? "Remove" : "Apply"}
              </button>
            </div>
            {appliedCoupon && (
              <p className="text-[10px] text-brand-500 uppercase tracking-widest font-bold flex items-center gap-1 mt-3 pl-2">
                <HiOutlineCheckCircle className="w-3.5 h-3.5" /> Code '{appliedCoupon}' active
              </p>
            )}
          </div>

          {/* Summary Details */}
          <div className="border-t border-salt/10 pt-6 space-y-3 mb-8">
            <div className="flex justify-between items-center text-xs uppercase tracking-widest text-ash">
              <span>Subtotal</span>
              <span className="font-dm-mono text-sm text-salt">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between items-center text-xs uppercase tracking-widest text-ash">
              <span>Shipping</span>
              <span className="font-dm-mono text-sm text-salt">{shippingCost === 0 ? "Calculated next step" : shippingCost === -1 ? "TBD" : formatCurrency(shippingCost)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between items-center text-xs uppercase tracking-widest text-brand-500 font-bold">
                <span>Discount</span>
                <span className="font-dm-mono text-sm">-{formatCurrency(discountAmount)}</span>
              </div>
            )}
            {isInternational && (
              <div className="mt-4 p-3 bg-brand-900/30 border border-brand-500/20 rounded text-[10px] text-brand-400 uppercase tracking-widest leading-relaxed">
                Import duties and local taxes are not included. You may be billed by the local customs office upon delivery.
              </div>
            )}
          </div>

          {/* Total */}
          <div className="border-t border-salt/10 pt-6 flex items-end justify-between">
            <span className="font-syne text-xs uppercase tracking-widest text-ash">Total</span>
            <div className="text-right flex items-baseline gap-2">
              <span className="text-xs text-ash uppercase font-bold tracking-widest">IDR</span>
              <span className="font-dm-mono text-3xl font-bold text-salt leading-none">{formatCurrency(finalTotal).replace('Rp', '').trim()}</span>
            </div>
          </div>
          {isInternational && (
            <div className="text-right mt-2">
              <p className="text-[10px] text-brand-500 uppercase tracking-widest">
                ~ {formatLocalCurrency(finalTotalLocal, localCurrencyCode)}
              </p>
            </div>
          )}
          
          {/* Submit Button for Desktop */}
          <div className="hidden lg:block mt-8">
            <button
              type="submit"
              form="checkout-form"
              disabled={loading}
              className="w-full bg-[#E2202C] text-white hover:bg-red-600 font-black uppercase tracking-widest py-4 rounded-xl transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(226,32,44,0.4)] hover:shadow-[0_0_30px_rgba(226,32,44,0.6)] flex items-center justify-center gap-2 text-lg"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="flex gap-1 mr-1">
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <span>PROCESSING</span>
                </div>
              ) : (
                "Pay Now"
              )}
            </button>
          </div>
          
        </div>
      </div>

    </div>
  );
}
