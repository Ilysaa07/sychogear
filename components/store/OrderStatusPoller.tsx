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

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/check-status?invoiceNumber=${invoiceNumber}`);
        const data = await res.json();

        if (data.success && data.status !== currentStatus) {
          setCurrentStatus(data.status);
          router.refresh();
        }
      } catch (error) {
        console.error("Poller error:", error);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [invoiceNumber, currentStatus, router]);

  return null;
}
