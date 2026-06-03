"use client";

import { HiOutlinePrinter } from "react-icons/hi";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-bold uppercase tracking-wider rounded-lg hover:bg-gray-800 transition-colors shadow-md"
      title="Print Receipt"
    >
      <HiOutlinePrinter className="w-5 h-5" />
      <span>Print / Save PDF</span>
    </button>
  );
}
