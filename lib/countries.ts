export interface Country {
  code: string;
  name: string;
  flag: string;
  currency: string;
  phonePrefix: string;
  region: string;
}

export const WORLDWIDE_COUNTRIES: Country[] = [
  // Southeast Asia
  { code: "ID", name: "Indonesia", flag: "🇮🇩", currency: "IDR", phonePrefix: "+62", region: "Southeast Asia" },
  { code: "MY", name: "Malaysia", flag: "🇲🇾", currency: "MYR", phonePrefix: "+60", region: "Southeast Asia" },
  { code: "SG", name: "Singapore", flag: "🇸🇬", currency: "SGD", phonePrefix: "+65", region: "Southeast Asia" },
  { code: "TH", name: "Thailand", flag: "🇹🇭", currency: "THB", phonePrefix: "+66", region: "Southeast Asia" },
  { code: "PH", name: "Philippines", flag: "🇵🇭", currency: "PHP", phonePrefix: "+63", region: "Southeast Asia" },
  { code: "VN", name: "Vietnam", flag: "🇻🇳", currency: "VND", phonePrefix: "+84", region: "Southeast Asia" },
  { code: "MM", name: "Myanmar", flag: "🇲🇲", currency: "MMK", phonePrefix: "+95", region: "Southeast Asia" },
  { code: "KH", name: "Cambodia", flag: "🇰🇭", currency: "KHR", phonePrefix: "+855", region: "Southeast Asia" },
  { code: "LA", name: "Laos", flag: "🇱🇦", currency: "LAK", phonePrefix: "+856", region: "Southeast Asia" },
  { code: "BN", name: "Brunei", flag: "🇧🇳", currency: "BND", phonePrefix: "+673", region: "Southeast Asia" },
  { code: "TL", name: "Timor-Leste", flag: "🇹🇱", currency: "USD", phonePrefix: "+670", region: "Southeast Asia" },
  // East Asia
  { code: "JP", name: "Japan", flag: "🇯🇵", currency: "JPY", phonePrefix: "+81", region: "East Asia" },
  { code: "KR", name: "South Korea", flag: "🇰🇷", currency: "KRW", phonePrefix: "+82", region: "East Asia" },
  { code: "CN", name: "China", flag: "🇨🇳", currency: "CNY", phonePrefix: "+86", region: "East Asia" },
  { code: "HK", name: "Hong Kong", flag: "🇭🇰", currency: "HKD", phonePrefix: "+852", region: "East Asia" },
  { code: "TW", name: "Taiwan", flag: "🇹🇼", currency: "TWD", phonePrefix: "+886", region: "East Asia" },
  // South Asia
  { code: "IN", name: "India", flag: "🇮🇳", currency: "INR", phonePrefix: "+91", region: "South Asia" },
  { code: "PK", name: "Pakistan", flag: "🇵🇰", currency: "PKR", phonePrefix: "+92", region: "South Asia" },
  { code: "BD", name: "Bangladesh", flag: "🇧🇩", currency: "BDT", phonePrefix: "+880", region: "South Asia" },
  { code: "LK", name: "Sri Lanka", flag: "🇱🇰", currency: "LKR", phonePrefix: "+94", region: "South Asia" },
  // Middle East
  { code: "AE", name: "United Arab Emirates", flag: "🇦🇪", currency: "AED", phonePrefix: "+971", region: "Middle East" },
  { code: "SA", name: "Saudi Arabia", flag: "🇸🇦", currency: "SAR", phonePrefix: "+966", region: "Middle East" },
  { code: "QA", name: "Qatar", flag: "🇶🇦", currency: "QAR", phonePrefix: "+974", region: "Middle East" },
  { code: "KW", name: "Kuwait", flag: "🇰🇼", currency: "KWD", phonePrefix: "+965", region: "Middle East" },
  // Oceania
  { code: "AU", name: "Australia", flag: "🇦🇺", currency: "AUD", phonePrefix: "+61", region: "Oceania" },
  { code: "NZ", name: "New Zealand", flag: "🇳🇿", currency: "NZD", phonePrefix: "+64", region: "Oceania" },
  // Europe
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", currency: "GBP", phonePrefix: "+44", region: "Europe" },
  { code: "DE", name: "Germany", flag: "🇩🇪", currency: "EUR", phonePrefix: "+49", region: "Europe" },
  { code: "FR", name: "France", flag: "🇫🇷", currency: "EUR", phonePrefix: "+33", region: "Europe" },
  { code: "NL", name: "Netherlands", flag: "🇳🇱", currency: "EUR", phonePrefix: "+31", region: "Europe" },
  { code: "IT", name: "Italy", flag: "🇮🇹", currency: "EUR", phonePrefix: "+39", region: "Europe" },
  { code: "ES", name: "Spain", flag: "🇪🇸", currency: "EUR", phonePrefix: "+34", region: "Europe" },
  // Americas
  { code: "US", name: "United States", flag: "🇺🇸", currency: "USD", phonePrefix: "+1", region: "Americas" },
  { code: "CA", name: "Canada", flag: "🇨🇦", currency: "CAD", phonePrefix: "+1", region: "Americas" },
  { code: "BR", name: "Brazil", flag: "🇧🇷", currency: "BRL", phonePrefix: "+55", region: "Americas" },
  { code: "MX", name: "Mexico", flag: "🇲🇽", currency: "MXN", phonePrefix: "+52", region: "Americas" },
];

// Backward compat - alias for existing code that uses ASEAN_COUNTRIES
export const ASEAN_COUNTRIES = WORLDWIDE_COUNTRIES.filter(c =>
  ["ID","MY","SG","TH","PH","VN","MM","KH","LA","BN","TL"].includes(c.code)
);

export const WORLDWIDE_COUNTRY_CODES = WORLDWIDE_COUNTRIES.map((c) => c.code);

export function getCountryByCode(code: string): Country | undefined {
  return WORLDWIDE_COUNTRIES.find((c) => c.code === code);
}

export function isInternationalOrder(countryCode: string): boolean {
  return countryCode !== "ID";
}

/** All countries now use MANUAL_TRANSFER (PayPal removed) */
export function getPaymentMethodForCountry(_countryCode: string): "MANUAL_TRANSFER" {
  return "MANUAL_TRANSFER";
}
