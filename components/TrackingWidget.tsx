"use client";

import { HiOutlineExternalLink } from "react-icons/hi";

interface Props {
  awb: string;
  courier?: string | null;
}

const COURIER_CONFIG: Record<string, { name: string; url: string }> = {
  "J&T": {
    name: "J&T Express",
    url: "https://jet.co.id",
  },
  "JNE": {
    name: "JNE",
    url: "https://www.jne.co.id",
  },
  "SHOPEE EXPRESS (SPX)": {
    name: "SPX Express",
    url: "https://spx.co.id",
  },
  "SiCepat": {
    name: "SiCepat",
    url: "https://www.sicepat.com",
  },
  "Lion Parcel": {
    name: "Lion Parcel",
    url: "https://lionparcel.com/cek-resi",
  },
};

/**
 * TrackingWidget — displays AWB number with a link to track on the specific courier's website.
 */
export default function TrackingWidget({ awb, courier }: Props) {
  const selectedCourier = (courier && COURIER_CONFIG[courier]) || COURIER_CONFIG["J&T"];
  const trackingUrl = courier === "Lion Parcel" 
    ? `${selectedCourier.url}?awb=${encodeURIComponent(awb)}`
    : selectedCourier.url;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-sm shadow-inner">
          🚚
        </span>
        <div>
          <p className="text-[10px] font-bold text-brand-500 uppercase tracking-widest leading-none mb-1">Shipment Method</p>
          <p className="text-sm font-bold text-white">{selectedCourier.name}</p>
        </div>
      </div>

      {/* AWB Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20 flex items-center justify-between gap-3 shadow-xl">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-brand-500 uppercase tracking-widest font-bold mb-1.5 opacity-80">
            Tracking Number (AWB/Resi)
          </p>
          <p className="font-mono font-bold text-white text-xl tracking-widest truncate select-all">{awb}</p>
        </div>
        <button
          onClick={() => {
            navigator.clipboard?.writeText(awb);
            // Optional: add a tiny temporary success state here if needed
          }}
          title="Copy AWB"
          className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-white/5 hover:border-white/10 text-brand-400 hover:text-white"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
        </button>
      </div>

      {/* Info Box */}
      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2.5">
        <div className="flex items-center gap-2">
          <div className="w-1 h-1 bg-brand-400 rounded-full" />
          <p className="text-xs font-bold text-brand-300">Tracking Instructions:</p>
        </div>
        <ul className="text-[11px] text-brand-500 space-y-1.5 list-none pl-1">
          <li className="flex items-start gap-2">
            <span className="text-brand-600">1.</span>
            <span>Copy the tracking number above</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-brand-600">2.</span>
            <span>Visit <strong>{selectedCourier.name}</strong> official website via the button below</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-brand-600">3.</span>
            <span>Paste your number into their tracking tool to see real-time status</span>
          </li>
        </ul>
      </div>

      {/* CTA Button */}
      <a
        href={trackingUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-4 px-6 bg-white hover:bg-brand-50 text-black font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] hover:-translate-y-0.5"
      >
        Track on {selectedCourier.name} Website <HiOutlineExternalLink className="w-4 h-4" />
      </a>

      <p className="text-center text-[10px] text-brand-700 tracking-wider">
        SYCHOGEAR × {selectedCourier.name.toUpperCase()} · GLOBAL SHIPPING
      </p>
    </div>
  );
}
