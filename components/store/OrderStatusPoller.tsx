"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function OrderStatusPoller({ 
  invoiceNumber, 
  initialStatus 
}: { 
  invoiceNumber: string; 
  initialStatus: string 
}) {
  const router = useRouter();
  const [currentStatus, setCurrentStatus] = useState(initialStatus);

  useEffect(() => {
    // Only poll if the status is UNPAID
    if (currentStatus !== "UNPAID") return;

    let attempts = 0;
    let timeoutId: ReturnType<typeof setTimeout>;

    const poll = async () => {
      try {
        const res = await fetch(`/api/orders/check-status?invoiceNumber=${invoiceNumber}`);
        const data = await res.json();

        if (data.success && data.status !== currentStatus) {
          setCurrentStatus(data.status);
          router.refresh();
          return; // stop polling once status changes
        }
      } catch (error) {
        console.error("Poller error:", error);
      }

      attempts++;

      // Backoff lebih konservatif untuk mengurangi beban DB:
      // attempts  1–3   (0–45s)   → setiap 15s
      // attempts  4–10  (45s–2m)  → setiap 20s
      // attempts  11+   (2m+)     → setiap 60s (cap)
      const interval = attempts <= 3 ? 15000 : attempts <= 10 ? 20000 : 60000;
      timeoutId = setTimeout(poll, interval);
    };

    // Start first poll after 15s (pembayaran tidak mungkin dikonfirmasi dalam detik pertama)
    timeoutId = setTimeout(poll, 15000);

    return () => clearTimeout(timeoutId);
  }, [invoiceNumber, currentStatus, router]);

  return null;
}
