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
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    if (!images || images.length <= 1) return;

    const interval = setInterval(() => {
      setPrevIndex(currentIndex);
      setTransitioning(true);

      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
        setTransitioning(false);
        setTimeout(() => setPrevIndex(null), 100);
      }, 1000); // crossfade duration
    }, 8000); // show each image 8s — slower, more cinematic

    return () => clearInterval(interval);
  }, [images, currentIndex]);

  if (!images || images.length === 0) {
    return (
      <div
        className="absolute inset-0"
        style={{ background: "var(--void)" }}
      />
    );
  }

  return (
    <>
      {images.map((img, i) => {
        const isActive = i === currentIndex;
        const isPrev = i === prevIndex;
        const shouldShow = isActive || isPrev;

        return (
          <div
            key={img}
            className="absolute inset-0 hero-image-drift"
            style={{
              opacity: isActive ? 1 : 0,
              transition: "opacity 1200ms ease-in-out",
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
                style={{
                  filter: "grayscale(20%) brightness(0.55) contrast(1.1)",
                }}
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
                style={{
                  filter: "grayscale(20%) brightness(0.55) contrast(1.1)",
                }}
              />
            )}
          </div>
        );
      })}

      {/* Slide indicators — bottom right, minimal dots */}
      {images.length > 1 && (
        <div
          className="absolute bottom-8 right-10 flex gap-2 z-20"
          aria-hidden="true"
        >
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className="transition-all duration-300"
              style={{
                width: i === currentIndex ? "24px" : "6px",
                height: "1px",
                background:
                  i === currentIndex
                    ? "var(--signal)"
                    : "rgba(232,228,220,0.3)",
              }}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </>
  );
}
