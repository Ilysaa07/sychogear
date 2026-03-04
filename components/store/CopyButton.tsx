"use client";

import { useState } from "react";
import { HiOutlineDocumentDuplicate, HiOutlineCheck } from "react-icons/hi";
import { toast } from "react-hot-toast";

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy");
    }
  };

  return (
    <button 
      onClick={handleCopy}
      className="p-2 hover:bg-white/10 rounded-md transition-all duration-200 active:scale-90"
      title="Copy"
    >
      {copied ? (
        <HiOutlineCheck className="w-5 h-5 text-green-400 animate-pulse-once" />
      ) : (
        <HiOutlineDocumentDuplicate className="w-5 h-5 text-brand-400" />
      )}
    </button>
  );
}
