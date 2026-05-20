"use client";

import { useRef, useCallback } from "react";

/**
 * useMagnetic — applies a magnetic pull to a button/element
 * based on cursor proximity. Returns ref + event handlers to attach.
 *
 * Usage:
 *   const { ref, onMouseMove, onMouseLeave } = useMagnetic();
 *   <button ref={ref} onMouseMove={onMouseMove} onMouseLeave={onMouseLeave}>...</button>
 */
export function useMagnetic(strength = 0.35) {
  const ref = useRef<HTMLElement>(null);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    el.style.transform = `translate(${dx * strength}px, ${dy * strength}px)`;
    el.style.transition = "transform 0.1s ease-out";
  }, [strength]);

  const onMouseLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "translate(0, 0)";
    el.style.transition = "transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)";
  }, []);

  return { ref, onMouseMove, onMouseLeave };
}
