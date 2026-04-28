"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function Preloader() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    // Reset state on pathname change to trigger loading screen
    setLoading(true);
    setProgress(0);
    setExiting(false);

    // First visit is longer, subsequent navigations are faster
    const isInitial = !sessionStorage.getItem("sg_preloader_shown");
    const duration = isInitial ? 2200 : 800; 

    if (isInitial) {
      sessionStorage.setItem("sg_preloader_shown", "true");
    }

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) { clearInterval(progressInterval); return 100; }
        return prev + Math.floor(Math.random() * (isInitial ? 14 : 30)) + 10;
      });
    }, isInitial ? 120 : 60);

    const timeout = setTimeout(() => {
      setExiting(true);
      setTimeout(() => setLoading(false), 500);
    }, duration);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(timeout);
    };
  }, [pathname]);

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
