"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/types";

interface CartStore {
  items: CartItem[];
  orderNote: string;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, variantId: string) => void;
  updateQuantity: (productId: string, variantId: string, quantity: number) => void;
  setOrderNote: (note: string) => void;
  clearCart: () => void;
  getTotal: () => number;
  getSubtotal: () => number;
  getTotalTax: () => number;
  getItemCount: () => number;
  // Bug #10 fix: refresh stale prices from server (call on cart open or checkout entry)
  syncItemPrices: () => Promise<void>;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      orderNote: "",

      setOrderNote: (note: string) => set({ orderNote: note }),

      addItem: (item: CartItem) => {
        const items = get().items;
        const existingIndex = items.findIndex(
          (i) => i.productId === item.productId && i.variantId === item.variantId
        );

        if (existingIndex > -1) {
          const updated = [...items];
          const newQty = updated[existingIndex].quantity + item.quantity;
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: Math.min(newQty, updated[existingIndex].stock),
          };
          set({ items: updated });
        } else {
          set({ items: [...items, item] });
        }
      },

      removeItem: (productId: string, variantId: string) => {
        set({
          items: get().items.filter(
            (i) => !(i.productId === productId && i.variantId === variantId)
          ),
        });
      },

      updateQuantity: (productId: string, variantId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(productId, variantId);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.productId === productId && i.variantId === variantId
              ? { ...i, quantity: Math.min(quantity, i.stock) }
              : i
          ),
        });
      },

      clearCart: () => set({ items: [] }),

      getTotal: () => {
        return get().getSubtotal() + get().getTotalTax();
      },
      
      getSubtotal: () => {
        return get().items.reduce((sum, item) => {
          const price = item.salePrice ?? item.price;
          const discountedPrice = item.discountRate > 0 
            ? price * (1 - item.discountRate / 100) 
            : price;
          return sum + discountedPrice * item.quantity;
        }, 0);
      },

      getTotalTax: () => {
        return get().items.reduce((sum, item) => {
          const price = item.salePrice ?? item.price;
          const discountedPrice = item.discountRate > 0 
            ? price * (1 - item.discountRate / 100) 
            : price;
          
          const ppn = (discountedPrice * (item.ppnRate / 100));
          const pph23 = (discountedPrice * (item.pph23Rate / 100));
          
          return sum + (ppn + pph23) * item.quantity;
        }, 0);
      },

      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      // Bug #10 fix: re-fetch live product data to clear stale flash sale prices
      // and remove items that no longer exist or are out of stock.
      syncItemPrices: async () => {
        const items = get().items;
        if (items.length === 0) return;
        try {
          const productIds = [...new Set(items.map((i) => i.productId))];
          const results = await Promise.all(
            productIds.map((id) =>
              fetch(`/api/products/${id}`).then((r) => (r.ok ? r.json() : null))
            )
          );
          const productMap = new Map(
            results
              .filter(Boolean)
              .filter((r) => r?.success && r?.data)
              .map((r) => [r.data.id, r.data])
          );
          set({
            items: items
              .map((item) => {
                const product = productMap.get(item.productId);
                if (!product) return item; // keep if can't fetch
                const variant = product.variants?.find((v: { id: string }) => v.id === item.variantId);
                return {
                  ...item,
                  price: product.price,
                  salePrice: product.salePrice ?? undefined,
                  stock: variant?.stock ?? item.stock,
                  discountRate: product.discountRate ?? 0,
                  ppnRate: product.ppnRate ?? 0,
                  pph23Rate: product.pph23Rate ?? 0,
                };
              })
              .filter((item) => item.stock > 0), // remove out-of-stock
          });
        } catch (err) {
          console.warn("[Cart] Failed to sync item prices:", err);
        }
      },
    }),
    {
      name: "sychogear-cart",
    }
  )
);
