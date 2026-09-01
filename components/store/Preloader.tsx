"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function Preloader() {
  const pathname = usePathname();
  const [phase, setPhase] = useState<"enter" | "exit" | "done">("enter");
  const [isInitial, setIsInitial] = useState(false);

  useEffect(() => {
    const initial = !sessionStorage.getItem("sg_preloader_shown");
    setIsInitial(initial);

    if (!initial) {
      const t = setTimeout(() => setPhase("done"), 100);
      return () => clearTimeout(t);
    }

    sessionStorage.setItem("sg_preloader_shown", "true");
    setPhase("enter");

    const exitTimer = setTimeout(() => {
      setPhase("exit");
      setTimeout(() => setPhase("done"), 1000);
    }, 2000);

    return () => {
      clearTimeout(exitTimer);
    };
  }, [pathname]);

  if (phase === "done" || !isInitial) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-void pointer-events-auto transition-all duration-1000 ease-[cubic-bezier(0.8,0,0.2,1)] ${
        phase === "exit" ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      aria-label="Loading"
      role="status"
    >
      <div 
        className={`relative flex flex-col items-center justify-center transition-transform duration-1000 ease-[cubic-bezier(0.8,0,0.2,1)] origin-center ${
          phase === "exit" ? "scale-[40]" : "scale-100"
        }`}
      >
        <div className={phase !== "exit" ? "animate-pulse" : ""}>
          <img
            src="/images/logo-sychogear.webp"
            alt="SYCHOGEAR Logo"
            className="w-32 h-auto object-contain"
            onError={(e) => {
              e.currentTarget.src = "/logo.png";
            }}
          />
        </div>
      </div>
    </div>
  );
}
