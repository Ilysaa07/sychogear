"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function GlobalLoader() {
  const [loading, setLoading] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Handle initial load
  useEffect(() => {
    const isInitial = !sessionStorage.getItem("sg_global_preloader_shown");
    const duration = isInitial ? 2000 : 500;
    
    if (isInitial) {
      sessionStorage.setItem("sg_global_preloader_shown", "true");
    }

    const timeout = setTimeout(() => {
      setLoading(false);
    }, duration); // 2000ms for first visit, 500ms otherwise

    return () => clearTimeout(timeout);
  }, []);

  // Handle route changes
  useEffect(() => {
    // Only trigger route change loader if it's not the initial mount
    // to avoid conflicting with the initial load useEffect
    if (!loading && isHidden) {
      setIsHidden(false);
      setIsExiting(false);
      setLoading(true);
      
      const timeout = setTimeout(() => {
        setLoading(false);
      }, 500);
      
      return () => clearTimeout(timeout);
    }
  }, [pathname, searchParams]);

  // Handle exit animation
  useEffect(() => {
    if (!loading) {
      setIsExiting(true);
      const timeout = setTimeout(() => {
        setIsHidden(true);
      }, 1000); // 1000ms exit animation duration
      return () => clearTimeout(timeout);
    }
  }, [loading]);

  if (isHidden) return null;

  return (
    <div 
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-void transition-all duration-1000 ease-[cubic-bezier(0.8,0,0.2,1)] ${
        isExiting ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div 
        className={`relative flex flex-col items-center justify-center transition-transform duration-1000 ease-[cubic-bezier(0.8,0,0.2,1)] origin-center ${
          isExiting ? "scale-[40]" : "scale-100"
        }`}
      >
        {/* Breathing/Pulsing Logo */}
        <div className={!isExiting ? "animate-pulse" : ""}>
          <img
            src="/images/logo-sychogear.webp"
            alt="SYCHOGEAR Logo"
            className="w-32 h-auto object-contain"
            onError={(e) => {
              // Fallback if logo not found
              e.currentTarget.src = "/logo.png";
            }}
          />
        </div>
      </div>
    </div>
  );
}
