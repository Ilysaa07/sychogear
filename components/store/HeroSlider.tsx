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
  const [direction, setDirection] = useState<"forward" | "back">("forward");

  useEffect(() => {
    if (!images || images.length <= 1) return;

    const interval = setInterval(() => {
      setPrevIndex(currentIndex);
      setDirection("forward");
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
    setDirection(i > currentIndex ? "forward" : "back");
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
      {images.map((img, i) => {
        const isActive = i === currentIndex;
        const isPrev = i === prevIndex;

        return (
          <div
            key={img}
            className="absolute inset-0"
            style={{
              opacity: isActive ? 1 : 0,
              transition: "opacity 1400ms ease-in-out",
              zIndex: isActive ? 1 : isPrev ? 0 : -1,
              pointerEvents: "none",
            }}
            aria-hidden="true"
          >
            {isVideo(img) ? (
              <video
                src={img}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover object-center"
                style={{ filter: "grayscale(25%) brightness(0.7) contrast(1.1)" }}
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
                style={{ filter: "grayscale(25%) brightness(0.7) contrast(1.1)" }}
              />
            )}
          </div>
        );
      })}

      {/* Slide indicators — clean horizontal lines */}
      {images.length > 1 && (
        <div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20"
          aria-label="Slide navigation"
        >
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className="py-2 transition-all duration-400 group"
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === currentIndex ? "true" : undefined}
            >
              <span
                style={{
                  display: "block",
                  height: "2px",
                  width: i === currentIndex ? "32px" : "16px",
                  background: i === currentIndex ? "var(--salt)" : "rgba(255,255,255,0.3)",
                  transition: "width 400ms ease, background 400ms ease",
                }}
                className="group-hover:bg-salt"
              />
            </button>
          ))}
        </div>
      )}
    </>
  );
}
