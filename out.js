"use strict";
"use client";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { checkoutSchema } from "@/lib/validations";
import { WORLDWIDE_COUNTRIES, getCountryByCode } from "@/lib/countries";
import { useCartStore } from "@/stores/cart-store";
import { formatCurrency } from "@/lib/utils";
import axios from "axios";
import toast from "react-hot-toast";
import Link from "next/link";
import { useCurrency } from "@/components/store/CurrencyProvider";
import { State, City } from "country-state-city";
import {
  HiOutlineShoppingBag,
  HiOutlineGlobeAlt,
  HiOutlineSearch,
  HiChevronDown
} from "react-icons/hi";
export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotal, getSubtotal, getTotalTax, clearCart, orderNote, setOrderNote } = useCartStore();
  const { countryCode: detectedCountry, isReady: currencyReady } = useCurrency();
  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [exchangeRate, setExchangeRate] = useState(16e3);
  const [localCurrencyRate, setLocalCurrencyRate] = useState(null);
  const [internationalTaxRates, setInternationalTaxRates] = useState({});
  const [countrySearch, setCountrySearch] = useState("");
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [indoProvinces, setIndoProvinces] = useState([]);
  const [indoRegencies, setIndoRegencies] = useState([]);
  const [indoDistricts, setIndoDistricts] = useState([]);
  const [indoVillages, setIndoVillages] = useState([]);
  const [selProvince, setSelProvince] = useState(null);
  const [selRegency, setSelRegency] = useState(null);
  const [selDistrict, setSelDistrict] = useState(null);
  const [selVillage, setSelVillage] = useState(null);
  const [intlStates, setIntlStates] = useState([]);
  const [intlCities, setIntlCities] = useState([]);
  const [selIntlStateCode, setSelIntlStateCode] = useState("");
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      country: "ID",
      orderNote: orderNote || ""
    }
  });
  const selectedCountry = watch("country");
  const stateProvince = watch("stateProvince");
  const isInternational = selectedCountry !== "ID";
  const countryInfo = getCountryByCode(selectedCountry);
  const getShippingRate = (province, regency) => {
    if (!province) return 0;
    const p = province.toLowerCase();
    const r = regency ? regency.toLowerCase() : "";
    if (r.includes("bandung")) return 8e3;
    if (p.includes("jakarta") || p.includes("banten") || p.includes("jabar") || p.includes("jawa barat") || p.includes("west java")) return 1e4;
    if (p.includes("jateng") || p.includes("jawa tengah") || p.includes("central java") || p.includes("yogyakarta") || p.includes("diy") || p.includes("jatim") || p.includes("jawa timur") || p.includes("east java")) return 15e3;
    if (p.includes("bali") || p.includes("sumatera") || p.includes("sumatra")) return 3e4;
    if (p.includes("kalimantan") || p.includes("sulawesi")) return 4e4;
    if (p.includes("papua") || p.includes("maluku") || p.includes("nusa tenggara") || p.includes("ntb") || p.includes("ntt")) return 6e4;
    return 25e3;
  };
  const totalWeightGrams = items.reduce((sum, item) => {
    const isShorts = item.name.toLowerCase().includes("short");
    return sum + (isShorts ? 200 : 300) * item.quantity;
  }, 0);
  const weightKg = Math.max(1, Math.ceil(totalWeightGrams / 1e3));
  const shippingCost = isInternational ? 0 : stateProvince ? getShippingRate(stateProvince, watch("city")) * weightKg : 0;
  const subtotal = getSubtotal();
  const domesticTax = 0;
  const intlTaxRate = isInternational ? internationalTaxRates["_global"] ?? 11 : 0;
  const internationalTax = isInternational ? Math.round(subtotal * (intlTaxRate / 100)) : 0;
  const applicableTax = isInternational ? internationalTax : domesticTax;
  const finalTotal = Math.max(0, subtotal + applicableTax + shippingCost - discountAmount);
  const localCurrencyCode = countryInfo?.currency || "USD";
  const localExchangeRate = localCurrencyRate ?? 1 / exchangeRate;
  const finalTotalLocal = Math.round(finalTotal * localExchangeRate * 100) / 100;
  const formatLocalCurrency = (amount, currency) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2
    }).format(amount);
  };
  const regions = Array.from(new Set(WORLDWIDE_COUNTRIES.map((c) => c.region)));
  const filteredCountries = countrySearch ? WORLDWIDE_COUNTRIES.filter(
    (c) => c.name.toLowerCase().includes(countrySearch.toLowerCase()) || c.code.toLowerCase().includes(countrySearch.toLowerCase())
  ) : WORLDWIDE_COUNTRIES;
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setCountryDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  useEffect(() => {
    if (currencyReady && detectedCountry) {
      setValue("country", detectedCountry);
    }
  }, [currencyReady, detectedCountry, setValue]);
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await axios.get("/api/settings");
        if (data.success) {
          if (data.data.idrToUsdRate) {
            setExchangeRate(parseFloat(data.data.idrToUsdRate) || 16e3);
          }
          if (data.data.internationalTaxRate) {
            const rate = parseFloat(data.data.internationalTaxRate) || 11;
            setInternationalTaxRates({ _global: rate });
          } else {
            setInternationalTaxRates({ _global: 11 });
          }
        }
      } catch {
        console.warn("Failed to fetch settings");
      }
    };
    fetchSettings();
  }, []);
  useEffect(() => {
    if (selectedCountry === "ID") {
      axios.get("https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json").then((res) => setIndoProvinces(res.data)).catch(console.error);
    }
  }, [selectedCountry]);
  useEffect(() => {
    if (selProvince) {
      axios.get(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${selProvince.id}.json`).then((res) => setIndoRegencies(res.data)).catch(console.error);
      setValue("stateProvince", selProvince.name, { shouldValidate: true });
    } else {
      setIndoRegencies([]);
      if (selectedCountry === "ID") setValue("stateProvince", "", { shouldValidate: true });
    }
    setSelRegency(null);
  }, [selProvince, setValue, selectedCountry]);
  useEffect(() => {
    if (selRegency) {
      axios.get(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${selRegency.id}.json`).then((res) => setIndoDistricts(res.data)).catch(console.error);
      setValue("city", selRegency.name, { shouldValidate: true });
    } else {
      setIndoDistricts([]);
      if (selectedCountry === "ID") setValue("city", "", { shouldValidate: true });
    }
    setSelDistrict(null);
  }, [selRegency, setValue, selectedCountry]);
  useEffect(() => {
    if (selDistrict) {
      axios.get(`https://www.emsifa.com/api-wilayah-indonesia/api/villages/${selDistrict.id}.json`).then((res) => setIndoVillages(res.data)).catch(console.error);
    } else {
      setIndoVillages([]);
    }
    setSelVillage(null);
  }, [selDistrict]);
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
          setLocalCurrencyRate(null);
        }
      } catch (err) {
        console.warn("Failed to fetch live currency rate", err);
        setLocalCurrencyRate(null);
      }
    };
    fetchCurrencyRate();
  }, [selectedCountry]);
  if (items.length === 0) {
    return /* @__PURE__ */ jsxs(
      "div",
      {
        className: "min-h-screen bg-void flex flex-col items-center justify-center text-center px-6",
        style: { paddingTop: "clamp(100px, 16vw, 160px)" },
        children: [
          /* @__PURE__ */ jsx(HiOutlineShoppingBag, { className: "w-10 h-10 text-ash mb-6" }),
          /* @__PURE__ */ jsx(
            "h1",
            {
              className: "font-syne text-salt mb-4 uppercase font-bold",
              style: { fontSize: "clamp(32px, 5vw, 52px)", lineHeight: 0.95 },
              children: "Your cart is empty."
            }
          ),
          /* @__PURE__ */ jsx("p", { className: "font-dm-mono text-ash mb-10 max-w-[380px] text-sm", children: "Add products to your cart before proceeding to checkout." }),
          /* @__PURE__ */ jsx(Link, { href: "/", className: "btn-primary py-4 px-10", children: "Explore Archive" })
        ]
      }
    );
  }
  const onSubmit = async (formData) => {
    setLoading(true);
    try {
      let finalStreetAddress = formData.streetAddress;
      if (selectedCountry === "ID" && selDistrict && selVillage) {
        finalStreetAddress = `${formData.streetAddress}, Desa/Kel. ${selVillage.name}, Kec. ${selDistrict.name}`;
      }
      const payloadData = { ...formData, streetAddress: finalStreetAddress };
      const { data } = await axios.post("/api/orders/create", {
        customer: payloadData,
        items,
        couponCode: couponCode || void 0,
        shippingCost
      });
      if (data.success) {
        setOrderNote("");
        clearCart();
        toast.success("Order created! Redirecting...");
        router.push(data.data.invoiceUrl);
      } else {
        toast.error(data.error || "Failed to create order");
      }
    } catch (err) {
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
        subtotal: getSubtotal()
      });
      if (data.success) {
        setDiscountAmount(data.data.discountAmount);
        setAppliedCoupon(data.data.code);
        toast.success("Coupon applied!");
      }
    } catch (err) {
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
  const handleCountrySelect = (code) => {
    setValue("country", code, { shouldValidate: true });
    setCountryDropdownOpen(false);
    setCountrySearch("");
  };
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: "min-h-screen bg-void",
      style: { paddingTop: "clamp(100px, 16vw, 160px)" },
      children: /* @__PURE__ */ jsxs(
        "div",
        {
          className: "container-main",
          style: {
            paddingTop: "clamp(40px, 6vw, 60px)",
            paddingBottom: "clamp(60px, 10vw, 120px)"
          },
          children: [
            /* @__PURE__ */ jsx("div", { className: "mb-12 pb-8 border-b border-ember", children: /* @__PURE__ */ jsx(
              "h1",
              {
                className: "font-syne font-bold text-salt uppercase",
                style: { fontSize: "clamp(42px, 8vw, 80px)", lineHeight: 0.88 },
                children: "Checkout"
              }
            ) }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-16", children: [
              /* @__PURE__ */ jsx("div", { className: "lg:col-span-7", children: /* @__PURE__ */ jsxs("form", { id: "checkout-form", onSubmit: handleSubmit(onSubmit), className: "space-y-10", children: [
                /* @__PURE__ */ jsxs("div", { className: "border border-ember bg-abyss p-6 md:p-8 relative", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 pb-6 mb-6 border-b border-ember", children: [
                    /* @__PURE__ */ jsx("span", { className: "font-dm-mono text-signal font-bold", children: "01" }),
                    /* @__PURE__ */ jsx("p", { className: "font-syne font-bold text-salt uppercase tracking-[0.2em] text-sm", children: "Contact Details" })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsxs("label", { htmlFor: "fullName", className: "font-syne font-bold text-ash text-[10px] uppercase tracking-widest block mb-2", children: [
                        "Full Name ",
                        /* @__PURE__ */ jsx("span", { className: "text-signal", children: "*" })
                      ] }),
                      /* @__PURE__ */ jsx(
                        "input",
                        {
                          ...register("fullName"),
                          id: "fullName",
                          className: "input-field bg-void",
                          placeholder: "e.g. John Doe",
                          autoComplete: "name"
                        }
                      ),
                      errors.fullName && /* @__PURE__ */ jsx("p", { className: "mt-1 font-dm-mono text-xs text-signal", children: errors.fullName.message })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-6", children: [
                      /* @__PURE__ */ jsxs("div", { children: [
                        /* @__PURE__ */ jsxs("label", { htmlFor: "email", className: "font-syne font-bold text-ash text-[10px] uppercase tracking-widest block mb-2", children: [
                          "Email Address ",
                          /* @__PURE__ */ jsx("span", { className: "text-signal", children: "*" })
                        ] }),
                        /* @__PURE__ */ jsx(
                          "input",
                          {
                            ...register("email"),
                            id: "email",
                            type: "email",
                            className: "input-field bg-void",
                            placeholder: "you@example.com",
                            autoComplete: "email"
                          }
                        ),
                        errors.email && /* @__PURE__ */ jsx("p", { className: "mt-1 font-dm-mono text-xs text-signal", children: errors.email.message })
                      ] }),
                      /* @__PURE__ */ jsxs("div", { children: [
                        /* @__PURE__ */ jsxs("label", { htmlFor: "phone", className: "font-syne font-bold text-ash text-[10px] uppercase tracking-widest block mb-2", children: [
                          "Phone (WhatsApp) ",
                          /* @__PURE__ */ jsx("span", { className: "text-signal", children: "*" })
                        ] }),
                        /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                          countryInfo && /* @__PURE__ */ jsx("span", { className: "absolute top-1/2 -translate-y-1/2 left-4 font-dm-mono text-sm text-salt pointer-events-none select-none", children: countryInfo.phonePrefix }),
                          /* @__PURE__ */ jsx(
                            "input",
                            {
                              ...register("phone"),
                              id: "phone",
                              className: `input-field bg-void ${countryInfo ? "pl-14" : ""}`,
                              placeholder: isInternational ? "8123456789" : "8xxxxxxxxxx",
                              autoComplete: "tel"
                            }
                          )
                        ] }),
                        errors.phone && /* @__PURE__ */ jsx("p", { className: "mt-1 font-dm-mono text-xs text-signal", children: errors.phone.message })
                      ] })
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "border border-ember bg-abyss p-6 md:p-8 relative", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 pb-6 mb-6 border-b border-ember", children: [
                    /* @__PURE__ */ jsx("span", { className: "font-dm-mono text-signal font-bold", children: "02" }),
                    /* @__PURE__ */ jsx("p", { className: "font-syne font-bold text-salt uppercase tracking-[0.2em] text-sm", children: "Shipping Destination" })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsxs("label", { className: "font-syne font-bold text-ash text-[10px] uppercase tracking-widest block mb-2", children: [
                        "Country ",
                        /* @__PURE__ */ jsx("span", { className: "text-signal", children: "*" })
                      ] }),
                      /* @__PURE__ */ jsxs("div", { className: "relative", ref: dropdownRef, children: [
                        /* @__PURE__ */ jsxs(
                          "button",
                          {
                            id: "country-selector",
                            type: "button",
                            onClick: () => setCountryDropdownOpen(!countryDropdownOpen),
                            className: `w-full flex items-center justify-between gap-2 text-left p-4 border transition-colors bg-void ${countryDropdownOpen ? "border-salt" : "border-ember"}`,
                            children: [
                              /* @__PURE__ */ jsx("span", { className: "flex items-center gap-3 font-dm-mono text-sm", children: countryInfo ? /* @__PURE__ */ jsxs(Fragment, { children: [
                                /* @__PURE__ */ jsx("span", { className: "w-6 h-4 overflow-hidden flex-shrink-0 border border-ember", children: /* @__PURE__ */ jsx(
                                  "img",
                                  {
                                    src: `https://flagcdn.com/w40/${selectedCountry.toLowerCase()}.png`,
                                    alt: countryInfo.name,
                                    className: "w-full h-full object-cover"
                                  }
                                ) }),
                                /* @__PURE__ */ jsx("span", { className: "text-salt", children: countryInfo.name })
                              ] }) : /* @__PURE__ */ jsx("span", { className: "text-ash", children: "Select your country" }) }),
                              /* @__PURE__ */ jsx(HiChevronDown, { className: `w-5 h-5 text-ash transition-transform duration-200 ${countryDropdownOpen ? "rotate-180" : ""}` })
                            ]
                          }
                        ),
                        countryDropdownOpen && /* @__PURE__ */ jsxs("div", { className: "absolute z-50 top-full left-0 right-0 mt-2 overflow-hidden bg-abyss border border-ember shadow-[0_10px_40px_rgba(0,0,0,0.8)]", children: [
                          /* @__PURE__ */ jsxs("div", { className: "p-3 border-b border-ember relative bg-void", children: [
                            /* @__PURE__ */ jsx(HiOutlineSearch, { className: "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ash" }),
                            /* @__PURE__ */ jsx(
                              "input",
                              {
                                type: "text",
                                value: countrySearch,
                                onChange: (e) => setCountrySearch(e.target.value),
                                className: "w-full pl-10 py-2 bg-transparent border-none font-dm-mono text-sm text-salt outline-none placeholder:text-ash",
                                placeholder: "Search country...",
                                autoFocus: true
                              }
                            )
                          ] }),
                          /* @__PURE__ */ jsx("div", { className: "max-h-64 overflow-y-auto custom-scrollbar", children: countrySearch ? filteredCountries.length > 0 ? filteredCountries.map((c) => /* @__PURE__ */ jsxs(
                            "button",
                            {
                              type: "button",
                              onClick: () => handleCountrySelect(c.code),
                              className: "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-dim font-dm-mono text-sm",
                              children: [
                                /* @__PURE__ */ jsx("span", { className: "w-5 h-3.5 overflow-hidden flex-shrink-0", children: /* @__PURE__ */ jsx("img", { src: `https://flagcdn.com/w40/${c.code.toLowerCase()}.png`, alt: c.name, className: "w-full h-full object-cover" }) }),
                                /* @__PURE__ */ jsx("span", { className: selectedCountry === c.code ? "text-salt font-bold" : "text-ash", children: c.name }),
                                /* @__PURE__ */ jsx("span", { className: "ml-auto text-[10px] text-ash", children: c.code })
                              ]
                            },
                            c.code
                          )) : /* @__PURE__ */ jsx("p", { className: "text-center py-6 font-dm-mono text-sm text-ash", children: "No countries found" }) : regions.map((region) => {
                            const regionCountries = WORLDWIDE_COUNTRIES.filter((c) => c.region === region);
                            return /* @__PURE__ */ jsxs("div", { children: [
                              /* @__PURE__ */ jsx("p", { className: "px-4 pt-4 pb-2 font-syne font-bold text-[10px] text-fog uppercase tracking-widest bg-void", children: region }),
                              regionCountries.map((c) => /* @__PURE__ */ jsxs(
                                "button",
                                {
                                  type: "button",
                                  onClick: () => handleCountrySelect(c.code),
                                  className: "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-dim font-dm-mono text-sm",
                                  children: [
                                    /* @__PURE__ */ jsx("span", { className: "w-5 h-3.5 overflow-hidden flex-shrink-0 border border-ember", children: /* @__PURE__ */ jsx("img", { src: `https://flagcdn.com/w40/${c.code.toLowerCase()}.png`, alt: c.name, className: "w-full h-full object-cover" }) }),
                                    /* @__PURE__ */ jsx("span", { className: selectedCountry === c.code ? "text-salt font-bold" : "text-ash", children: c.name }),
                                    /* @__PURE__ */ jsx("span", { className: "ml-auto text-[10px] text-ash", children: c.code })
                                  ]
                                },
                                c.code
                              ))
                            ] }, region);
                          }) })
                        ] }),
                        /* @__PURE__ */ jsx("input", { type: "hidden", ...register("country") })
                      ] }),
                      errors.country && /* @__PURE__ */ jsx("p", { className: "mt-1 font-dm-mono text-xs text-signal", children: errors.country.message })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-6", children: [
                      /* @__PURE__ */ jsxs("div", { className: "sm:col-span-2", children: [
                        /* @__PURE__ */ jsxs("label", { htmlFor: "streetAddress", className: "font-syne font-bold text-ash text-[10px] uppercase tracking-widest block mb-2", children: [
                          "Street Address ",
                          /* @__PURE__ */ jsx("span", { className: "text-signal", children: "*" })
                        ] }),
                        /* @__PURE__ */ jsx(
                          "input",
                          {
                            ...register("streetAddress"),
                            id: "streetAddress",
                            className: "input-field bg-void",
                            placeholder: "e.g. 123 Orchard Road",
                            autoComplete: "address-line1"
                          }
                        ),
                        errors.streetAddress && /* @__PURE__ */ jsx("p", { className: "mt-1 font-dm-mono text-xs text-signal", children: errors.streetAddress.message })
                      ] }),
                      /* @__PURE__ */ jsxs("div", { className: "sm:col-span-2", children: [
                        /* @__PURE__ */ jsxs("label", { htmlFor: "apartment", className: "font-syne font-bold text-ash text-[10px] uppercase tracking-widest block mb-2", children: [
                          "Apartment, suite, etc. ",
                          /* @__PURE__ */ jsx("span", { className: "font-dm-mono normal-case tracking-normal text-[10px] text-fog", children: "(optional)" })
                        ] }),
                        /* @__PURE__ */ jsx(
                          "input",
                          {
                            ...register("apartment"),
                            id: "apartment",
                            className: "input-field bg-void",
                            placeholder: "e.g. Unit 12-B, Floor 3",
                            autoComplete: "address-line2"
                          }
                        )
                      ] })
                    ] }),
                    !isInternational ? /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-6", children: [
                      /* @__PURE__ */ jsxs("div", { children: [
                        /* @__PURE__ */ jsxs("label", { className: "font-syne font-bold text-ash text-[10px] uppercase tracking-widest block mb-2", children: [
                          "Provinsi ",
                          /* @__PURE__ */ jsx("span", { className: "text-signal", children: "*" })
                        ] }),
                        /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                          /* @__PURE__ */ jsxs("select", { className: "input-field bg-void appearance-none cursor-pointer pr-10", value: selProvince?.id || "", onChange: (e) => {
                            const p = indoProvinces.find((x) => x.id === e.target.value);
                            setSelProvince(p || null);
                          }, children: [
                            /* @__PURE__ */ jsx("option", { value: "", disabled: true, children: "Select Province" }),
                            indoProvinces.map((p) => /* @__PURE__ */ jsx("option", { value: p.id, children: p.name }, p.id))
                          ] }),
                          /* @__PURE__ */ jsx(HiChevronDown, { className: "absolute right-4 top-1/2 -translate-y-1/2 text-ash w-5 h-5 pointer-events-none" })
                        ] }),
                        errors.stateProvince && /* @__PURE__ */ jsx("p", { className: "mt-1 font-dm-mono text-xs text-signal", children: errors.stateProvince.message })
                      ] }),
                      /* @__PURE__ */ jsxs("div", { children: [
                        /* @__PURE__ */ jsxs("label", { className: "font-syne font-bold text-ash text-[10px] uppercase tracking-widest block mb-2", children: [
                          "Kabupaten / Kota ",
                          /* @__PURE__ */ jsx("span", { className: "text-signal", children: "*" })
                        ] }),
                        /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                          /* @__PURE__ */ jsxs("select", { className: "input-field bg-void appearance-none cursor-pointer pr-10", value: selRegency?.id || "", onChange: (e) => {
                            const p = indoRegencies.find((x) => x.id === e.target.value);
                            setSelRegency(p || null);
                          }, disabled: !selProvince, children: [
                            /* @__PURE__ */ jsx("option", { value: "", disabled: true, children: "Select City" }),
                            indoRegencies.map((p) => /* @__PURE__ */ jsx("option", { value: p.id, children: p.name }, p.id))
                          ] }),
                          /* @__PURE__ */ jsx(HiChevronDown, { className: "absolute right-4 top-1/2 -translate-y-1/2 text-ash w-5 h-5 pointer-events-none" })
                        ] }),
                        errors.city && /* @__PURE__ */ jsx("p", { className: "mt-1 font-dm-mono text-xs text-signal", children: errors.city.message })
                      ] }),
                      /* @__PURE__ */ jsxs("div", { children: [
                        /* @__PURE__ */ jsxs("label", { className: "font-syne font-bold text-ash text-[10px] uppercase tracking-widest block mb-2", children: [
                          "Kecamatan ",
                          /* @__PURE__ */ jsx("span", { className: "text-signal", children: "*" })
                        ] }),
                        /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                          /* @__PURE__ */ jsxs("select", { className: "input-field bg-void appearance-none cursor-pointer pr-10", value: selDistrict?.id || "", onChange: (e) => {
                            const p = indoDistricts.find((x) => x.id === e.target.value);
                            setSelDistrict(p || null);
                          }, disabled: !selRegency, children: [
                            /* @__PURE__ */ jsx("option", { value: "", disabled: true, children: "Select District" }),
                            indoDistricts.map((p) => /* @__PURE__ */ jsx("option", { value: p.id, children: p.name }, p.id))
                          ] }),
                          /* @__PURE__ */ jsx(HiChevronDown, { className: "absolute right-4 top-1/2 -translate-y-1/2 text-ash w-5 h-5 pointer-events-none" })
                        ] })
                      ] }),
                      /* @__PURE__ */ jsxs("div", { children: [
                        /* @__PURE__ */ jsxs("label", { className: "font-syne font-bold text-ash text-[10px] uppercase tracking-widest block mb-2", children: [
                          "Desa / Kelurahan ",
                          /* @__PURE__ */ jsx("span", { className: "text-signal", children: "*" })
                        ] }),
                        /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                          /* @__PURE__ */ jsxs("select", { className: "input-field bg-void appearance-none cursor-pointer pr-10", value: selVillage?.id || "", onChange: (e) => {
                            const p = indoVillages.find((x) => x.id === e.target.value);
                            setSelVillage(p || null);
                          }, disabled: !selDistrict, children: [
                            /* @__PURE__ */ jsx("option", { value: "", disabled: true, children: "Select Village" }),
                            indoVillages.map((p) => /* @__PURE__ */ jsx("option", { value: p.id, children: p.name }, p.id))
                          ] }),
                          /* @__PURE__ */ jsx(HiChevronDown, { className: "absolute right-4 top-1/2 -translate-y-1/2 text-ash w-5 h-5 pointer-events-none" })
                        ] })
                      ] })
                    ] }) : /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-6", children: [
                      /* @__PURE__ */ jsxs("div", { children: [
                        /* @__PURE__ */ jsxs("label", { className: "font-syne font-bold text-ash text-[10px] uppercase tracking-widest block mb-2", children: [
                          "State / Province ",
                          /* @__PURE__ */ jsx("span", { className: "text-signal", children: "*" })
                        ] }),
                        intlStates.length > 0 ? /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                          /* @__PURE__ */ jsxs("select", { className: "input-field bg-void appearance-none cursor-pointer pr-10", value: selIntlStateCode, onChange: (e) => {
                            setSelIntlStateCode(e.target.value);
                            const st = intlStates.find((x) => x.isoCode === e.target.value);
                            setValue("stateProvince", st ? st.name : e.target.value, { shouldValidate: true });
                          }, children: [
                            /* @__PURE__ */ jsx("option", { value: "", disabled: true, children: "Select State" }),
                            intlStates.map((p) => /* @__PURE__ */ jsx("option", { value: p.isoCode, children: p.name }, p.isoCode))
                          ] }),
                          /* @__PURE__ */ jsx(HiChevronDown, { className: "absolute right-4 top-1/2 -translate-y-1/2 text-ash w-5 h-5 pointer-events-none" })
                        ] }) : /* @__PURE__ */ jsx("input", { ...register("stateProvince"), className: "input-field bg-void", placeholder: "e.g. California" }),
                        errors.stateProvince && /* @__PURE__ */ jsx("p", { className: "mt-1 font-dm-mono text-xs text-signal", children: errors.stateProvince.message })
                      ] }),
                      /* @__PURE__ */ jsxs("div", { children: [
                        /* @__PURE__ */ jsxs("label", { className: "font-syne font-bold text-ash text-[10px] uppercase tracking-widest block mb-2", children: [
                          "City ",
                          /* @__PURE__ */ jsx("span", { className: "text-signal", children: "*" })
                        ] }),
                        intlCities.length > 0 ? /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                          /* @__PURE__ */ jsxs("select", { className: "input-field bg-void appearance-none cursor-pointer pr-10", onChange: (e) => {
                            setValue("city", e.target.value, { shouldValidate: true });
                          }, children: [
                            /* @__PURE__ */ jsx("option", { value: "", disabled: true, selected: true, children: "Select City" }),
                            intlCities.map((p) => /* @__PURE__ */ jsx("option", { value: p.name, children: p.name }, p.name))
                          ] }),
                          /* @__PURE__ */ jsx(HiChevronDown, { className: "absolute right-4 top-1/2 -translate-y-1/2 text-ash w-5 h-5 pointer-events-none" })
                        ] }) : /* @__PURE__ */ jsx("input", { ...register("city"), className: "input-field bg-void", placeholder: "e.g. Los Angeles" }),
                        errors.city && /* @__PURE__ */ jsx("p", { className: "mt-1 font-dm-mono text-xs text-signal", children: errors.city.message })
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsxs("label", { htmlFor: "zipCode", className: "font-syne font-bold text-ash text-[10px] uppercase tracking-widest block mb-2", children: [
                        "Postal Code ",
                        /* @__PURE__ */ jsx("span", { className: "text-signal", children: "*" })
                      ] }),
                      /* @__PURE__ */ jsx("input", { ...register("zipCode"), id: "zipCode", className: "input-field bg-void w-full sm:w-1/2", placeholder: "e.g. 238801", autoComplete: "postal-code" }),
                      errors.zipCode && /* @__PURE__ */ jsx("p", { className: "mt-1 font-dm-mono text-xs text-signal", children: errors.zipCode.message })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-4 p-5 bg-void border border-ember relative mt-4", children: [
                      /* @__PURE__ */ jsx("div", { className: "absolute top-0 left-0 w-2 h-2 border-t border-l border-signal" }),
                      /* @__PURE__ */ jsx("div", { className: "absolute bottom-0 right-0 w-2 h-2 border-b border-r border-signal" }),
                      isInternational ? /* @__PURE__ */ jsxs(Fragment, { children: [
                        /* @__PURE__ */ jsx(HiOutlineGlobeAlt, { className: "w-6 h-6 flex-shrink-0 mt-0.5 text-signal" }),
                        /* @__PURE__ */ jsxs("div", { children: [
                          /* @__PURE__ */ jsx("p", { className: "font-syne font-bold text-sm tracking-widest uppercase mb-1 text-salt", children: "International Dispatch" }),
                          /* @__PURE__ */ jsx("p", { className: "font-dm-mono text-[10px] text-ash mb-3 uppercase tracking-widest", children: "Transit: 3\u201314 days" }),
                          /* @__PURE__ */ jsx("p", { className: "font-dm-mono text-[10px] text-fog leading-relaxed uppercase", children: "> Shipping fee calculated post-checkout via WhatsApp coordinator." })
                        ] })
                      ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                        /* @__PURE__ */ jsx("div", { className: "flex-shrink-0 px-3 py-1 flex items-center justify-center rounded bg-white", children: /* @__PURE__ */ jsx("img", { src: "/images/jnt.png", alt: "J&T Express", className: "object-contain", style: { width: "50px", height: "auto", minHeight: "20px" } }) }),
                        /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
                          /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start", children: [
                            /* @__PURE__ */ jsxs("div", { children: [
                              /* @__PURE__ */ jsx("p", { className: "font-syne font-bold text-sm tracking-widest uppercase mb-1 text-salt", children: "J&T Express" }),
                              /* @__PURE__ */ jsx("p", { className: "font-dm-mono text-[10px] text-ash uppercase tracking-widest", children: "Local Delivery (Indonesia)" })
                            ] }),
                            /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                              /* @__PURE__ */ jsx("p", { className: "font-dm-mono font-bold text-signal text-sm", children: shippingCost > 0 ? formatCurrency(shippingCost) : "Calculate" }),
                              /* @__PURE__ */ jsxs("p", { className: "font-dm-mono text-[10px] text-ash text-right mt-1", children: [
                                weightKg,
                                " kg"
                              ] })
                            ] })
                          ] }),
                          /* @__PURE__ */ jsx("div", { className: "mt-3", children: stateProvince ? /* @__PURE__ */ jsxs("p", { className: "font-dm-mono text-[10px] text-fog leading-relaxed uppercase border-t border-ember pt-2 mt-2", children: [
                            "> Rate applied for ",
                            stateProvince,
                            "."
                          ] }) : /* @__PURE__ */ jsx("p", { className: "font-dm-mono text-[10px] text-fog leading-relaxed uppercase border-t border-ember pt-2 mt-2", children: "> Please enter your Province/State above." }) })
                        ] })
                      ] })
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "border border-ember bg-abyss p-6 md:p-8 relative", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 pb-6 mb-6 border-b border-ember", children: [
                    /* @__PURE__ */ jsx("span", { className: "font-dm-mono text-signal font-bold", children: "03" }),
                    /* @__PURE__ */ jsx("p", { className: "font-syne font-bold text-salt uppercase tracking-[0.2em] text-sm", children: "Special Instructions" })
                  ] }),
                  /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx(
                    "textarea",
                    {
                      ...register("orderNote"),
                      id: "orderNote",
                      className: "input-field bg-void w-full h-28 resize-none text-sm placeholder:text-fog",
                      placeholder: "Enter any notes or special instructions for this order..."
                    }
                  ) })
                ] })
              ] }) }),
              /* @__PURE__ */ jsxs("div", { className: "lg:col-span-5 flex flex-col gap-8", children: [
                /* @__PURE__ */ jsxs("div", { className: "border border-ember bg-abyss p-6 relative", children: [
                  /* @__PURE__ */ jsx("p", { className: "font-syne font-bold text-salt uppercase tracking-widest text-sm mb-4", children: "Have a Coupon?" }),
                  /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        value: couponCode,
                        onChange: (e) => {
                          setCouponCode(e.target.value.toUpperCase());
                          if (appliedCoupon && e.target.value.toUpperCase() !== appliedCoupon) {
                            setAppliedCoupon(null);
                            setDiscountAmount(0);
                          }
                        },
                        disabled: !!appliedCoupon || validatingCoupon,
                        className: "input-field bg-void flex-1 py-3 text-sm",
                        placeholder: "Enter code"
                      }
                    ),
                    !appliedCoupon ? /* @__PURE__ */ jsx("button", { type: "button", onClick: handleApplyCoupon, disabled: !couponCode || validatingCoupon, className: "btn-base bg-salt text-void border-salt hover:bg-void hover:text-salt px-6 py-0 disabled:opacity-40 uppercase tracking-widest font-syne font-bold text-[10px]", children: validatingCoupon ? "..." : "Apply" }) : /* @__PURE__ */ jsx("button", { type: "button", onClick: handleRemoveCoupon, className: "btn-base bg-transparent text-signal border-signal hover:bg-signal hover:text-void px-6 py-0 uppercase tracking-widest font-syne font-bold text-[10px]", children: "Remove" })
                  ] }),
                  appliedCoupon && /* @__PURE__ */ jsxs("p", { className: "mt-4 font-dm-mono text-[10px] text-salt bg-void border border-salt px-3 py-2 inline-block", children: [
                    "\u2713 Applied: -",
                    formatCurrency(discountAmount)
                  ] })
                ] }),
                /* @__PURE__ */ jsx("div", { className: "sticky top-28 mb-10", children: /* @__PURE__ */ jsxs(
                  "div",
                  {
                    className: "bg-slate-50 text-black p-8 relative w-full shadow-[0_20px_50px_rgba(0,0,0,0.5)] font-dm-mono border-x border-slate-200",
                    children: [
                      /* @__PURE__ */ jsx("div", { className: "absolute top-0 left-0 w-full h-[6px] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjYiPjxwb2x5Z29uIHBvaW50cz0iMCAwLCA0IDYsIDggMCIgZmlsbD0iI2Y4ZmFmYyIvPjwvc3ZnPg==')] repeat-x" }),
                      /* @__PURE__ */ jsxs("div", { className: "text-center mb-6 pb-6 border-b-2 border-dashed border-gray-400/60 relative", children: [
                        /* @__PURE__ */ jsx("img", { src: "/images/logo-sychogear.webp", alt: "SYCHOGEAR", className: "h-10 mx-auto mb-3 object-contain opacity-90" }),
                        /* @__PURE__ */ jsx("p", { className: "font-syne font-bold uppercase tracking-widest text-xl mb-1", children: "SychoGear" }),
                        /* @__PURE__ */ jsx("p", { className: "text-[10px] text-gray-500 uppercase tracking-widest leading-relaxed mb-4", children: "VIOLENCE IS OUR AESTHETIC" }),
                        /* @__PURE__ */ jsxs("div", { className: "text-left text-[10px] text-gray-600 flex flex-col gap-1 w-full bg-gray-100 p-3 rounded-sm border border-gray-200", children: [
                          /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
                            /* @__PURE__ */ jsx("span", { children: "DATE:" }),
                            /* @__PURE__ */ jsxs("span", { className: "font-bold", children: [
                              (/* @__PURE__ */ new Date()).toLocaleDateString("en-GB"),
                              " ",
                              (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" })
                            ] })
                          ] }),
                          /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
                            /* @__PURE__ */ jsx("span", { children: "TERMINAL:" }),
                            /* @__PURE__ */ jsxs("span", { className: "font-bold", children: [
                              Math.floor(1e3 + Math.random() * 9e3),
                              "-SYS"
                            ] })
                          ] }),
                          /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
                            /* @__PURE__ */ jsx("span", { children: "CASHIER:" }),
                            /* @__PURE__ */ jsx("span", { className: "font-bold", children: "AUTO/WEB" })
                          ] })
                        ] })
                      ] }),
                      /* @__PURE__ */ jsxs("div", { className: "space-y-4 mb-6 pb-6 border-b-2 border-dashed border-gray-400/60", children: [
                        /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-[10px] text-gray-500 font-bold border-b border-gray-200 pb-2 mb-4", children: [
                          /* @__PURE__ */ jsx("span", { children: "ITEM DESC" }),
                          /* @__PURE__ */ jsx("span", { children: "AMOUNT" })
                        ] }),
                        items.map((item) => /* @__PURE__ */ jsxs("div", { className: "flex gap-4 items-start", children: [
                          /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
                            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold tracking-wider uppercase", children: item.name }),
                            /* @__PURE__ */ jsxs("p", { className: "text-[10px] text-gray-500 mt-1", children: [
                              "SIZE ",
                              item.size,
                              " ",
                              /* @__PURE__ */ jsx("span", { className: "mx-1", children: "|" }),
                              " QTY ",
                              item.quantity
                            ] })
                          ] }),
                          /* @__PURE__ */ jsx("div", { className: "text-right", children: /* @__PURE__ */ jsx("p", { className: "text-xs font-bold", children: formatCurrency((item.salePrice ?? item.price) * (1 - item.discountRate / 100) * item.quantity) }) })
                        ] }, `${item.productId}-${item.variantId}`))
                      ] }),
                      /* @__PURE__ */ jsxs("div", { className: "space-y-2 text-[11px] tracking-wider text-gray-700 mb-6 pb-6 border-b-2 border-dashed border-gray-400/60", children: [
                        /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start", children: [
                          /* @__PURE__ */ jsx("span", { className: "uppercase", children: "Subtotal" }),
                          /* @__PURE__ */ jsx("div", { className: "text-right", children: /* @__PURE__ */ jsx("span", { className: "text-black font-bold", children: formatCurrency(getSubtotal()) }) })
                        ] }),
                        discountAmount > 0 && /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start", children: [
                          /* @__PURE__ */ jsx("span", { className: "uppercase text-green-700", children: "Discount" }),
                          /* @__PURE__ */ jsx("div", { className: "text-right", children: /* @__PURE__ */ jsxs("span", { className: "text-green-700 font-bold", children: [
                            "-",
                            formatCurrency(discountAmount)
                          ] }) })
                        ] }),
                        !isInternational && shippingCost > 0 && /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start", children: [
                          /* @__PURE__ */ jsx("span", { className: "uppercase", children: "Shipping (J&T)" }),
                          /* @__PURE__ */ jsx("div", { className: "text-right", children: /* @__PURE__ */ jsx("span", { className: "text-black font-bold", children: formatCurrency(shippingCost) }) })
                        ] }),
                        applicableTax > 0 && /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start", children: [
                          /* @__PURE__ */ jsx("span", { className: "uppercase", children: isInternational ? `Tax [${intlTaxRate}%]` : "Tax" }),
                          /* @__PURE__ */ jsx("div", { className: "text-right", children: /* @__PURE__ */ jsxs("span", { className: "text-black font-bold", children: [
                            "+",
                            formatCurrency(applicableTax)
                          ] }) })
                        ] }),
                        /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-end pt-4 mt-4 border-t-2 border-black", children: [
                          /* @__PURE__ */ jsx("span", { className: "uppercase font-black text-black text-sm", children: "Total Due" }),
                          /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                            /* @__PURE__ */ jsx("span", { className: "text-xl font-black text-black", children: formatCurrency(finalTotal) }),
                            isInternational && /* @__PURE__ */ jsxs("p", { className: "text-[10px] text-gray-500 mt-1", children: [
                              "\u2248 ",
                              formatLocalCurrency(finalTotalLocal, localCurrencyCode)
                            ] })
                          ] })
                        ] })
                      ] }),
                      /* @__PURE__ */ jsxs("div", { className: "mt-8 pt-4", children: [
                        /* @__PURE__ */ jsx(
                          "button",
                          {
                            type: "submit",
                            form: "checkout-form",
                            disabled: loading,
                            className: "w-full bg-black text-white hover:bg-neutral-800 border-none py-4 text-xs tracking-[0.2em] uppercase font-syne font-bold disabled:opacity-50 transition-colors",
                            children: loading ? /* @__PURE__ */ jsxs("span", { className: "flex items-center justify-center gap-3", children: [
                              /* @__PURE__ */ jsx("span", { className: "font-dm-mono text-signal", children: "[]" }),
                              "PROCESSING..."
                            ] }) : "Lanjut Bayar"
                          }
                        ),
                        /* @__PURE__ */ jsxs("p", { className: "text-center mt-4 font-dm-mono text-[9px] text-gray-500 leading-relaxed", children: [
                          "By placing your order you agree to our",
                          " ",
                          /* @__PURE__ */ jsx(Link, { href: "/terms", className: "text-black underline", children: "Terms" }),
                          " ",
                          "and",
                          " ",
                          /* @__PURE__ */ jsx(Link, { href: "/privacy", className: "text-black underline", children: "Privacy Policy" }),
                          "."
                        ] })
                      ] }),
                      /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center mt-6", children: [
                        /* @__PURE__ */ jsx(
                          "img",
                          {
                            src: `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent("https://sychogear.com/")}`,
                            alt: "QR Code",
                            className: "w-12 h-12 opacity-80 mix-blend-multiply"
                          }
                        ),
                        /* @__PURE__ */ jsxs("p", { className: "text-[7px] tracking-[0.2em] mt-2 font-bold text-gray-400 uppercase text-center", children: [
                          "Scan to",
                          /* @__PURE__ */ jsx("br", {}),
                          "Track Order"
                        ] })
                      ] }),
                      /* @__PURE__ */ jsx("div", { className: "absolute bottom-0 left-0 w-full h-[6px] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjYiPjxwb2x5Z29uIHBvaW50cz0iMCAwLCA0IDYsIDggMCIgZmlsbD0iI2Y4ZmFmYyIvPjwvc3ZnPg==')] repeat-x rotate-180" })
                    ]
                  }
                ) })
              ] })
            ] })
          ]
        }
      )
    }
  );
}
