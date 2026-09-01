"use client";

import { useEffect, useRef } from "react";
import { useCartStore } from "@/stores/cart-store";

export default function ClearCart() {
  const clearCart = useCartStore((state) => state.clearCart);
  const cleared = useRef(false);

  useEffect(() => {
    if (!cleared.current) {
      clearCart();
      cleared.current = true;
    }
  }, [clearCart]);

  return null;
}
