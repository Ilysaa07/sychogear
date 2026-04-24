"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

function getOrCreateSessionId(): string {
  try {
    const key = "sg_visitor_session";
    let id = sessionStorage.getItem(key);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(key, id);
    }
    return id;
  } catch {
    return "anonymous";
  }
}

/**
 * VisitorTracker — invisible component that records page visits.
 * Fires once per pathname change and sends data to /api/visitors.
 */
export default function VisitorTracker() {
  const pathname = usePathname();
  const prevPathRef = useRef<string | null>(null);

  useEffect(() => {
    // Avoid recording the same page twice on strict-mode double mount
    if (prevPathRef.current === pathname) return;
    prevPathRef.current = pathname;

    const sessionId = getOrCreateSessionId();
    const referrer =
      typeof document !== "undefined" ? document.referrer : "";

    // Fire-and-forget — we don't block the UI
    fetch("/api/visitors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, page: pathname, referrer }),
      // Use keepalive so the request finishes even if the user navigates away
      keepalive: true,
    }).catch(() => {
      // Silently swallow errors — tracking must never break the storefront
    });
  }, [pathname]);

  return null;
}
