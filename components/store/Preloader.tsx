"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function Preloader() {
  const pathname = usePathname();
  const [phase, setPhase] = useState<"enter" | "split" | "done">("enter");
  const [progress, setProgress] = useState(0);
  const [isInitial, setIsInitial] = useState(false);

  useEffect(() => {
    const initial = !sessionStorage.getItem("sg_preloader_shown");
    setIsInitial(initial);

    if (!initial) {
      // Subsequent page visits: fast simple fade
      const t = setTimeout(() => setPhase("done"), 600);
      return () => clearTimeout(t);
    }

    sessionStorage.setItem("sg_preloader_shown", "true");
    setPhase("enter");
    setProgress(0);

    // Animate progress bar
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) { clearInterval(progressInterval); return 100; }
        return Math.min(prev + Math.floor(Math.random() * 12) + 8, 100);
      });
    }, 100);

    // After 2s, trigger split reveal
    const splitTimer = setTimeout(() => {
      setProgress(100);
      setPhase("split");
      // After split animation completes, done
      setTimeout(() => setPhase("done"), 900);
    }, 2000);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(splitTimer);
    };
  }, [pathname]);

  if (phase === "done") return null;

  if (!isInitial) {
    return (
      <div
        className="fixed inset-0 z-[9999] bg-void pointer-events-none"
        style={{ opacity: 0, animation: "preloaderFastFade 600ms ease forwards" }}
      >
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes preloaderFastFade {
            0% { opacity: 1; }
            100% { opacity: 0; }
          }
        `}} />
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[9999] overflow-hidden pointer-events-auto"
      aria-label="Loading"
      role="status"
    >
      {/* Left Panel */}
      <div
        className="absolute top-0 left-0 h-full bg-void flex items-center justify-end pr-8 md:pr-16"
        style={{
          width: "50%",
          transform: phase === "split" ? "translateX(-100%)" : "translateX(0)",
          transition: "transform 800ms cubic-bezier(0.76, 0, 0.24, 1)",
        }}
      />

      {/* Right Panel */}
      <div
        className="absolute top-0 right-0 h-full bg-void"
        style={{
          width: "50%",
          transform: phase === "split" ? "translateX(100%)" : "translateX(0)",
          transition: "transform 800ms cubic-bezier(0.76, 0, 0.24, 1)",
        }}
      />

      {/* Center content (sits above both panels) */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center"
        style={{
          opacity: phase === "split" ? 0 : 1,
          transition: "opacity 300ms ease",
          pointerEvents: "none",
        }}
      >
        {/* Big text reveal */}
        <div className="overflow-hidden mb-2">
          <p
            className="font-syne font-bold uppercase tracking-[0.6em] text-salt/40 text-xs md:text-sm"
            style={{ animation: "slideUpIn 800ms 200ms cubic-bezier(0.25,1,0.5,1) both" }}
          >
            Official Archive
          </p>
        </div>
        <div className="overflow-hidden mb-8">
          <h1
            className="font-syne font-bold uppercase text-salt leading-none"
            style={{
              fontSize: "clamp(48px, 12vw, 140px)",
              letterSpacing: "-0.02em",
              animation: "slideUpIn 900ms 100ms cubic-bezier(0.25,1,0.5,1) both",
            }}
          >
            SYCHOGEAR
          </h1>
        </div>

        {/* Progress */}
        <div
          className="overflow-hidden"
          style={{ animation: "slideUpIn 600ms 400ms cubic-bezier(0.25,1,0.5,1) both" }}
        >
          <p className="font-dm-mono text-salt/30 text-[10px] tracking-[0.4em] uppercase mb-4 text-center">
            Loading Archive
          </p>
          <div className="w-48 md:w-64 h-[1px] bg-white/10">
            <div
              className="h-full bg-signal transition-all duration-150 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="font-dm-mono text-salt/20 text-[9px] tracking-widest mt-2 text-center">
            {progress}%
          </p>
        </div>
      </div>

      {/* Horizontal center line (decorative) */}
      <div
        className="absolute top-1/2 left-0 right-0 h-[1px] bg-white/5 pointer-events-none"
        style={{ transform: "translateY(-1px)" }}
        aria-hidden="true"
      />

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slideUpIn {
          0% { transform: translateY(100%); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
      `}} />
    </div>
  );
}
