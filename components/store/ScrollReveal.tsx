"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * ScrollReveal — wires up IntersectionObserver globally.
 * Adds `.is-visible` to any element with `.reveal` or `.reveal-stagger`
 * when it enters the viewport. Triggers immediately for those already visible.
 * Re-runs on route change via pathname watch.
 */
export default function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    // Small delay so DOM is ready after hydration
    const timeout = setTimeout(() => {
      setupObserver();
    }, 80);

    return () => clearTimeout(timeout);
  }, [pathname]); // Re-run on every route change

  return null;
}

function setupObserver() {
  const elements = document.querySelectorAll<HTMLElement>(
    ".reveal, .reveal-stagger, .reveal-clip, .reveal-scale"
  );

  if (!elements.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.05,
      rootMargin: "0px 0px -20px 0px",
    }
  );

  elements.forEach((el) => {
    // If already in viewport — make visible immediately, no animation delay
    const rect = el.getBoundingClientRect();
    const inViewport =
      rect.top < window.innerHeight && rect.bottom > 0;

    if (inViewport) {
      // Slight stagger so it doesn't feel instant on load
      setTimeout(() => {
        el.classList.add("is-visible");
      }, 50);
    } else {
      observer.observe(el);
    }
  });

  return () => observer.disconnect();
}
