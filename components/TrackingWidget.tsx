"use client";

import { HiOutlineExternalLink } from "react-icons/hi";

interface Props {
  awb: string;
}

/**
 * TrackingWidget — displays AWB number with a direct link to track on Lion Parcel.
 * Free, no API balance required.
 */
export default function TrackingWidget({ awb }: Props) {
  const trackingUrl = `https://lionparcel.com/cek-resi?awb=${encodeURIComponent(awb)}`;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-sm">
          📦
        </span>
        <div>
          <p className="text-xs font-bold text-brand-400 uppercase tracking-wider">Shipment Tracking</p>
          <p className="text-[11px] text-brand-600">Lion Parcel INTERPACK</p>
        </div>
      </div>

      {/* AWB Card */}
      <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] text-brand-500 uppercase tracking-widest font-bold mb-1">
            Tracking Number (AWB)
          </p>
          <p className="font-mono font-bold text-white text-lg tracking-widest">{awb}</p>
        </div>
        <button
          onClick={() => navigator.clipboard?.writeText(awb).catch(() => {})}
          title="Copy AWB"
          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-brand-400 hover:text-white"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
        </button>
      </div>

      {/* How to track */}
      <div className="p-3 rounded-xl bg-white/3 border border-white/10 space-y-2">
        <p className="text-xs font-bold text-brand-300">How to track your shipment:</p>
        <ol className="text-[11px] text-brand-500 space-y-1 list-decimal list-inside">
          <li>Click the button below to open Lion Parcel tracking page</li>
          <li>Your AWB number is pre-filled — just press Track</li>
          <li>View real-time updates for your INTERPACK shipment</li>
        </ol>
      </div>

      {/* CTA */}
      <a
        href={trackingUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl transition-colors"
      >
        Track on Lion Parcel <HiOutlineExternalLink className="w-4 h-4" />
      </a>

      <p className="text-center text-[10px] text-brand-700">
        Powered by Lion Parcel INTERPACK · Free international tracking
      </p>
    </div>
  );
}
