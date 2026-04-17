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

    // Show after 2s delay — let the page settle first
    const timer = setTimeout(() => {
      setIsOpen(true);
      hasShownInMemory = true;
      // Trigger entrance transition
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setIsVisible(true));
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, [settings.active]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => setIsOpen(false), 400);
  };

  if (!hasRendered || !isOpen || !settings.active) return null;

  const titleLines = settings.title
    ? settings.title.split("\\n")
    : ["New Arrival"];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Promotion"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 transition-opacity duration-400"
        style={{
          background: "rgba(8, 8, 8, 0.8)",
          backdropFilter: "blur(4px)",
          opacity: isVisible ? 1 : 0,
        }}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="relative z-10 overflow-hidden"
        style={{
          width: "100%",
          maxWidth: "340px",
          background: "var(--abyss)",
          border: "1px solid var(--ember)",
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 400ms ease, transform 400ms var(--ease-compose)",
        }}
      >
        {/* Close button — absolute top right */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleClose();
          }}
          className="absolute top-4 right-4 z-30 text-ash hover:text-salt transition-colors duration-200"
          aria-label="Close"
          style={{
            fontFamily: "var(--font-dm-mono), monospace",
            fontSize: "1.25rem",
            lineHeight: 1,
            padding: "4px",
          }}
        >
          ×
        </button>

        {/* Image — full width, 16:10 aspect */}
        {settings.image && (
          <div
            className="relative w-full overflow-hidden"
            style={{ aspectRatio: "4 / 3" }}
          >
            <Image
              src={settings.image}
              alt={settings.title}
              fill
              className="object-cover"
              style={{
                filter: "grayscale(15%) brightness(0.85) contrast(1.1)",
              }}
              sizes="340px"
            />
            {/* Bottom gradient for text readability */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to top, rgba(15,15,15,0.7) 0%, transparent 60%)",
              }}
            />
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {/* Eyebrow */}
          <p className="label-eyebrow mb-3">{settings.subtitle}</p>

          {/* Title */}
          <h2
            className="font-display text-salt mb-6"
            style={{
              fontSize: "clamp(28px, 5vw, 40px)",
              lineHeight: 0.95,
            }}
          >
            {titleLines.map((line, i) => (
              <span key={i}>
                {line}
                {i < titleLines.length - 1 && <br />}
              </span>
            ))}
          </h2>

          {/* CTA */}
          <Link
            href={settings.linkUrl}
            onClick={handleClose}
            className="btn-primary block text-center py-3.5 text-xs"
            id="promo-modal-cta"
          >
            {settings.linkText || "Explore"} ↗
          </Link>

          {/* Dismiss */}
          <button
            onClick={handleClose}
            className="btn-link w-full justify-center mt-4 text-[10px]"
          >
            No thanks
          </button>
        </div>
      </div>
    </div>
  );
}
