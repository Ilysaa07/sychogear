"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface HeroSliderProps {
  images: string[];
}

const isVideo = (url: string) =>
  url.toLowerCase().endsWith(".mp4") || url.toLowerCase().endsWith(".webm");

export default function HeroSlider({ images }: HeroSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState<number | null>(null);
  const [time, setTime] = useState(0);

  // Timecode simulation for technical aesthetic
  useEffect(() => {
    const timer = setInterval(() => setTime((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}:00`;
  };

  useEffect(() => {
    if (!images || images.length <= 1) return;

    const interval = setInterval(() => {
      setPrevIndex(currentIndex);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
        setTimeout(() => setPrevIndex(null), 200);
      }, 1200);
    }, 9000);

    return () => clearInterval(interval);
  }, [images, currentIndex]);

  const goTo = (i: number) => {
    if (i === currentIndex) return;
    setPrevIndex(currentIndex);
    setTimeout(() => {
      setCurrentIndex(i);
      setTimeout(() => setPrevIndex(null), 200);
    }, 1200);
  };

  if (!images || images.length === 0) {
    return <div className="absolute inset-0 bg-void" />;
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes recBlink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
      `}} />

      {/* Main Slider Media */}
      {images.map((img, i) => {
        const isActive = i === currentIndex;
        const isPrev = i === prevIndex;

        return (
          <div
            key={img}
            className="absolute inset-0 overflow-hidden"
            style={{
              opacity: isActive ? 1 : 0,
              transition: "opacity 1600ms cubic-bezier(0.4, 0, 0.2, 1)",
              zIndex: isActive ? 1 : isPrev ? 0 : -1,
              pointerEvents: "none",
            }}
            aria-hidden="true"
          >
            <div
               className="w-full h-full"
               style={{
                 transform: isActive ? "scale(1.05)" : "scale(1)",
                 transition: "transform 10s ease-out", 
               }}
            >
              {isVideo(img) ? (
                <video
                  src={img}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover object-center"
                  style={{ filter: "brightness(0.8)" }} 
                />
              ) : (
                <Image
                  src={img}
                  alt=""
                  fill
                  className="object-cover object-center"
                  priority={i === 0}
                  quality={90}
                  sizes="100vw"
                  style={{ filter: "brightness(0.8)" }}
                />
              )}
            </div>
          </div>
        );
      })}

      {/* Subtle CRT Scanlines Overlay (NO color distortion) */}
      <div className="absolute inset-0 pointer-events-none z-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,255,255,0.02),rgba(0,0,0,0.02),rgba(255,255,255,0.02))] bg-[length:100%_4px,3px_100%] opacity-30 mix-blend-overlay" />
      <div className="absolute inset-0 pointer-events-none z-10 shadow-[inset_0_0_150px_rgba(0,0,0,0.7)]" />

      {/* Green CRT OSD Overlay (Sync with TV component) */}
      <div className="absolute inset-0 pointer-events-none z-20 p-6 sm:p-10 pt-32 sm:pt-40 flex flex-col justify-between font-dm-mono text-[#0f0] font-bold text-xs sm:text-base tracking-widest uppercase" style={{ textShadow: "0 0 8px #0f0" }}>

      </div>

      {/* Subtle Minimalist Indicators - Bottom Edge */}
      <div className="absolute bottom-8 sm:bottom-12 left-0 right-0 z-30 flex justify-center pointer-events-auto px-6 sm:px-10">
        <div className="flex items-center gap-4 sm:gap-6 max-w-2xl w-full">
          {images.length > 1 && images.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className="flex-1 group py-4"
              aria-label={`Go to slide ${i + 1}`}
            >
              <div className="relative h-[1px] w-full bg-white/10 overflow-hidden">
                <div 
                  className={`absolute inset-0 bg-white/40 transition-transform origin-left ${i === currentIndex ? "scale-x-100" : "scale-x-0"}`}
                  style={{ 
                    transitionDuration: i === currentIndex ? "9000ms" : "0ms",
                    transitionTimingFunction: "linear"
                  }}
                />
              </div>
            </button>
          ))}
        </div>
      </div>

    </>
  );
}
