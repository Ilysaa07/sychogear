"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

export interface PromoSettings {
  active: boolean;
  image?: string;
  title: string;
  subtitle: string;
  linkUrl: string;
  linkText: string;
}

let hasShownInMemory = false;

export default function PromoModal({ settings }: { settings: PromoSettings }) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasRendered, setHasRendered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!settings.active || hasShownInMemory) return;
    setHasRendered(true);
    const timer = setTimeout(() => {
      setIsOpen(true);
      hasShownInMemory = true;
      requestAnimationFrame(() => requestAnimationFrame(() => setIsVisible(true)));
    }, 2000);
    return () => clearTimeout(timer);
  }, [settings.active]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      setIsOpen(false);
      window.dispatchEvent(new CustomEvent("promoClosed"));
    }, 450);
  };

  if (!hasRendered || !isOpen || !settings.active) return null;

  const titleLines = settings.title ? settings.title.split("\\n") : ["New Arrival"];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Promotion"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{
          background: "rgba(8, 8, 8, 0.88)",
          backdropFilter: "blur(6px)",
          opacity: isVisible ? 1 : 0,
        }}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal — clean scale entrance */}
      <div
        className="relative z-10 w-full max-w-[680px] bg-void border border-ember overflow-hidden"
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? "scale(1)" : "scale(0.96)",
          transition: "opacity 450ms ease, transform 450ms var(--ease-out-expo)",
        }}
      >
        {/* Close button */}
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleClose(); }}
          className="absolute top-4 right-4 z-30 group flex items-center justify-center w-8 h-8 rounded-full bg-void/50 text-salt hover:bg-salt hover:text-void transition-colors duration-300"
          aria-label="Close"
        >
          <span className="text-xl leading-none">×</span>
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Image Panel */}
          {settings.image && (
            <div className="relative aspect-[4/3] md:aspect-auto md:h-full min-h-[260px] overflow-hidden" style={{ borderRight: "1px solid var(--ember)" }}>
              <Image
                src={settings.image}
                alt={settings.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 340px"
              />
            </div>
          )}

          {/* Content Panel */}
          <div className="p-8 md:p-10 flex flex-col justify-center">
            {/* Eyebrow */}
            <p
              className="mb-4 text-ash"
              style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase" }}
            >
              {settings.subtitle || "Latest Drop"}
            </p>

            {/* Title */}
            <h2
              className="font-syne text-salt mb-8"
              style={{
                fontSize: "clamp(28px, 4vw, 42px)",
                fontWeight: 700,
                lineHeight: 1.1,
                textTransform: "uppercase"
              }}
            >
              {titleLines.map((line, i) => (
                <span key={i} className="block">{line}</span>
              ))}
            </h2>

            {/* CTAs */}
            <div className="space-y-3">
              <Link
                href={settings.linkUrl}
                onClick={handleClose}
                className="btn-primary w-full text-center py-4"
                id="promo-modal-cta"
              >
                {settings.linkText || "Shop Now"}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
