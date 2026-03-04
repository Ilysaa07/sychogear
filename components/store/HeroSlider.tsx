"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

export default function HeroSlider({ images }: { images: string[] }) {
  const isVideo = (url: string) => url.toLowerCase().endsWith(".mp4") || url.toLowerCase().endsWith(".webm");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!images || images.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 5000); // Change image every 5 seconds

    return () => clearInterval(interval);
  }, [images]);

  if (!images || images.length === 0) {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-brand-900 via-brand-950 to-black" />
    );
  }

  return (
    <>
      {images.map((img, i) => (
        <div
          key={img}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            i === currentIndex ? "opacity-100 z-0" : "opacity-0 -z-10"
          }`}
        >
          {isVideo(img) ? (
            <video
              src={img}
              autoPlay
              loop
              muted
              playsInline
              className="object-cover object-center w-full h-full"
            />
          ) : (
            <Image
              src={img}
              alt={`Hero Slide ${i + 1}`}
              fill
              className="object-cover object-center"
              priority={i === 0}
              quality={90}
            />
          )}
        </div>
      ))}
    </>
  );
}
