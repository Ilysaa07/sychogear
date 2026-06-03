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
import { State, City } from "country-state-city";
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
  const { items, getTotal, getSubtotal, getTotalTax, clearCart, orderNote, setOrderNote } = useCartStore();
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

  // Address Selector States - Indonesia
  const [indoProvinces, setIndoProvinces] = useState<any[]>([]);
  const [indoRegencies, setIndoRegencies] = useState<any[]>([]);
  const [indoDistricts, setIndoDistricts] = useState<any[]>([]);
  const [indoVillages, setIndoVillages] = useState<any[]>([]);

  const [selProvince, setSelProvince] = useState<{ id: string, name: string } | null>(null);
  const [selRegency, setSelRegency] = useState<{ id: string, name: string } | null>(null);
  const [selDistrict, setSelDistrict] = useState<{ id: string, name: string } | null>(null);
  const [selVillage, setSelVillage] = useState<{ id: string, name: string } | null>(null);

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
  const getShippingRate = (province: string, regency: string) => {
    if (!province) return 0;
    const p = province.toLowerCase();
    const r = regency ? regency.toLowerCase() : "";
    
    // Soreang, Bandung as origin
    if (r.includes('bandung')) return 8000;
    if (p.includes('jakarta') || p.includes('banten') || p.includes('jabar') || p.includes('jawa barat') || p.includes('west java')) return 10000;
    if (p.includes('jateng') || p.includes('jawa tengah') || p.includes('central java') || p.includes('yogyakarta') || p.includes('diy') || p.includes('jatim') || p.includes('jawa timur') || p.includes('east java')) return 15000;
    if (p.includes('bali') || p.includes('sumatera') || p.includes('sumatra')) return 30000;
    if (p.includes('kalimantan') || p.includes('sulawesi')) return 40000;
    if (p.includes('papua') || p.includes('maluku') || p.includes('nusa tenggara') || p.includes('ntb') || p.includes('ntt')) return 60000;
    return 25000; // default for ID
  };

  const totalWeightGrams = items.reduce((sum, item) => {
    const isShorts = item.name.toLowerCase().includes('short');
    return sum + ((isShorts ? 200 : 300) * item.quantity);
  }, 0);
  
  const weightKg = Math.max(1, Math.ceil(totalWeightGrams / 1000));
  const shippingCost = isInternational ? 0 : (stateProvince ? getShippingRate(stateProvince, watch("city")) * weightKg : 0);

  const subtotal = getSubtotal();
  const domesticTax = 0; // Forced inactive for domestic as per requirement
  // Single global PPN rate for all international orders — automatically active
  const intlTaxRate = isInternational ? (internationalTaxRates["_global"] ?? 11) : 0;
  const internationalTax = isInternational ? Math.round(subtotal * (intlTaxRate / 100)) : 0;
  const applicableTax = isInternational ? internationalTax : domesticTax;
  const finalTotal = Math.max(0, subtotal + applicableTax + shippingCost - discountAmount);
  
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
    return (<div></div>);
}