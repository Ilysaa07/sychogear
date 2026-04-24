"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function Preloader() {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const hasLoaded = sessionStorage.getItem("sg_preloader_shown");
    if (hasLoaded) { setLoading(false); return; }

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) { clearInterval(progressInterval); return 100; }
        return prev + Math.floor(Math.random() * 14) + 5;
      });
    }, 120);

    const timeout = setTimeout(() => {
      setExiting(true);
      sessionStorage.setItem("sg_preloader_shown", "true");
      setTimeout(() => setLoading(false), 700);
    }, 2200);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(timeout);
    };
  }, []);

  if (!loading) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-void flex flex-col items-center justify-center"
      style={{
        opacity: exiting ? 0 : 1,
        transition: "opacity 600ms ease",
      }}
    >
      {/* Logo */}
      <div
        style={{
          width: "clamp(120px, 16vw, 200px)",
          height: "clamp(120px, 16vw, 200px)",
          position: "relative",
          opacity: exiting ? 0 : 1,
          transform: exiting ? "scale(0.96)" : "scale(1)",
          transition: "opacity 500ms ease, transform 500ms ease",
        }}
      >
        <Image
          src="/images/logo.gif"
          alt="Sychogear"
          fill
          className="object-contain mix-blend-screen"
          priority
          unoptimized
        />
      </div>

      {/* Progress line — fixed at bottom */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "1px",
          background: "var(--ember)",
        }}
        aria-hidden="true"
      >
        <div
          style={{
            height: "100%",
            background: "var(--signal)",
            width: `${Math.min(progress, 100)}%`,
            transition: "width 140ms ease-out",
          }}
        />
      </div>
    </div>
  );
}
