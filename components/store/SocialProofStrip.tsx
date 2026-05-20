"use client";

import React from "react";

export default function SocialProofStrip() {
  const brandAttributes = [
    "AUTHENTIC SYCHOGEAR SYSTEM",
    "LIMITED RUN ARCHIVE ONLY",
    "PREMIUM HEAVYWEIGHT FABRICS",
    "WORLDWIDE SPECIFICATION SHIPPING",
    "SYNDICATE ENCRYPTED COMM",
    "DESIGNED IN-HOUSE // INDEPENDENT DEVIATION",
    "100% SECURE PROTOCOLS",
  ];
  return (
    <section className="relative w-full bg-[#020202] border-t border-b border-ember py-12 overflow-hidden flex flex-col gap-6 select-none">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-radial-glow opacity-5 pointer-events-none" />

      {/* Row 1: Brand attributes (Left-to-Right Scrolling) */}
      <div className="relative w-full flex items-center overflow-hidden py-1">
        <div className="flex whitespace-nowrap animate-marquee-left hover:[animation-play-state:paused] cursor-pointer">
          {[...Array(3)].map((_, groupIdx) => (
            <div key={groupIdx} className="flex items-center">
              {brandAttributes.map((attr, idx) => (
                <div key={idx} className="flex items-center mx-8 font-dm-mono text-[10px] font-bold tracking-[0.25em] text-salt/60 uppercase">
                  <span className="mr-4 text-signal">⚡</span>
                  {attr}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      {/* Embedded Animations for fully self-contained component */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .border-ember {
          border-color: var(--ember, #222222);
        }
        .text-signal {
          color: var(--signal, #c8a96e);
        }
        .text-salt {
          color: var(--salt, #e8e4dc);
        }
        .text-redline {
          color: var(--redline, #c0392b);
        }
        
        .animate-marquee-left {
          animation: marquee-left 35s linear infinite;
        }
        .animate-marquee-right {
          animation: marquee-right 40s linear infinite;
        }

        @keyframes marquee-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
        @keyframes marquee-right {
          0% { transform: translateX(-33.333%); }
          100% { transform: translateX(0); }
        }

        .bg-radial-glow {
          background: radial-gradient(
            circle 600px at 50% 50%,
            rgba(200, 169, 110, 0.08) 0%,
            transparent 80%
          );
        }
      `}} />
    </section>
  );
}
