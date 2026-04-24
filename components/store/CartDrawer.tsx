"use client";

import { useEffect, useRef } from "react";
import { HiOutlineX, HiPlus, HiMinus } from "react-icons/hi";
import { useCartStore } from "@/stores/cart-store";
import { useUIStore } from "@/stores/ui-store";
import { useCurrency } from "@/components/store/CurrencyProvider";
import Link from "next/link";

export default function CartDrawer() {
  const isOpen  = useUIStore((s) => s.isCartDrawerOpen);
  const setOpen = useUIStore((s) => s.setCartDrawerOpen);
  const { items, removeItem, updateQuantity, getSubtotal, syncItemPrices } = useCartStore();
  const { formatPrice } = useCurrency();
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (isOpen) syncItemPrices(); }, [isOpen, syncItemPrices]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    drawerRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, setOpen]);

  if (!isOpen) return null;

  const subtotal = getSubtotal();

  return (
    <>
      {/* Overlay */}
      <div className="cart-overlay fade-in" onClick={() => setOpen(false)} aria-hidden="true" />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className="cart-drawer is-open"
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        tabIndex={-1}
      >
        {/* ─── Header ─────────────────────────────────── */}
        <div
          className="flex items-center justify-between px-6 py-5 flex-shrink-0"
          style={{ borderBottom: "1px solid var(--ember)" }}
        >
          <div>
            <p className="label-syne text-salt">
              Your Cart{" "}
              <span
                style={{
                  fontFamily: "var(--font-dm-mono), monospace",
                  fontSize: "0.75rem",
                  color: "var(--ash)",
                  fontWeight: 400,
                  letterSpacing: "0.05em",
                }}
              >
                ({items.length})
              </span>
            </p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-1 text-ash hover:text-salt transition-colors duration-200"
            aria-label="Close cart"
            style={{ fontSize: "1.25rem", lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        {/* Thin signal line under header */}
        <div style={{ height: "1px", background: "var(--signal)", flexShrink: 0, opacity: 0.3 }} aria-hidden="true" />

        {/* ─── Items ──────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {items.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-start justify-center h-full px-8 py-16">
              <p
                className="font-metal text-salt mb-6"
                style={{ fontSize: "clamp(28px, 5vw, 42px)", lineHeight: 1 }}
              >
                Cart is empty.
              </p>
              <button onClick={() => setOpen(false)} className="btn-link text-[10px]">
                Explore the archive →
              </button>
            </div>
          ) : (
            <div>
              {items.map((item) => {
                const itemPrice = (item.salePrice ?? item.price) * (1 - (item.discountRate || 0) / 100);
                const hasDiscount = item.salePrice || (item.discountRate && item.discountRate > 0);

                return (
                  <div
                    key={`${item.productId}-${item.variantId}`}
                    className="flex gap-4 px-6 py-5"
                    style={{ borderBottom: "1px solid var(--ember)" }}
                  >
                    {/* Thumbnail */}
                    <div
                      className="flex-shrink-0 overflow-hidden bg-dim"
                      style={{
                        width: "72px",
                        height: "90px",
                        borderLeft: "2px solid var(--signal)",
                      }}
                    >
                      <img
                        src={item.image || "/placeholder.svg"}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        style={{ filter: "grayscale(15%) brightness(0.9)" }}
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <p style={{
                          fontFamily: "var(--font-syne), system-ui, sans-serif",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          color: "var(--salt)",
                          lineHeight: 1.4,
                        }}>
                          {item.name}
                        </p>
                        <p style={{
                          fontFamily: "var(--font-dm-mono), monospace",
                          fontSize: "0.5625rem",
                          letterSpacing: "0.2em",
                          textTransform: "uppercase",
                          color: "var(--ash)",
                          marginTop: "2px",
                        }}>
                          Size / {item.size}
                        </p>
                        <div className="flex items-baseline gap-2 mt-1">
                          <p style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: "0.8125rem", color: "var(--signal)" }}>
                            {formatPrice(itemPrice)}
                          </p>
                          {hasDiscount && (
                            <p style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: "0.6875rem", color: "var(--fog)", textDecoration: "line-through" }}>
                              {formatPrice(item.price)}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Qty + Remove */}
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}
                            className="text-ash hover:text-salt transition-colors w-5 h-5 flex items-center justify-center"
                            aria-label="Decrease quantity"
                          >
                            <HiMinus className="w-3 h-3" />
                          </button>
                          <span style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: "0.8125rem", color: "var(--salt)", width: "16px", textAlign: "center" }}>
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                            className="text-ash hover:text-salt transition-colors w-5 h-5 flex items-center justify-center"
                            aria-label="Increase quantity"
                          >
                            <HiPlus className="w-3 h-3" />
                          </button>
                        </div>
                        <button
                          onClick={() => removeItem(item.productId, item.variantId)}
                          className="btn-link text-[9px]"
                          style={{ color: "var(--fog)", borderBottomColor: "transparent" }}
                          onMouseEnter={e => (e.currentTarget.style.color = "var(--redline)")}
                          onMouseLeave={e => (e.currentTarget.style.color = "var(--fog)")}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ─── Footer — Totals + CTA ───────────────────── */}
        {items.length > 0 && (
          <div
            className="flex-shrink-0 px-6 py-6 space-y-4"
            style={{ borderTop: "1px solid var(--ember)" }}
          >
            {/* Totals */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: "0.5625rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--ash)" }}>
                  Subtotal
                </span>
                <span style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: "0.8125rem", color: "var(--pale)" }}>
                  {formatPrice(subtotal)}
                </span>
              </div>
              <div style={{ height: "1px", background: "var(--ember)" }} />
              <div className="flex items-center justify-between pt-1">
                <span style={{ fontFamily: "var(--font-syne), system-ui, sans-serif", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--salt)" }}>
                  Total
                </span>
                <span style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: "1.125rem", fontWeight: 500, color: "var(--signal)" }}>
                  {formatPrice(subtotal)}
                </span>
              </div>
            </div>

            {/* CTA */}
            <Link
              href="/checkout"
              onClick={() => setOpen(false)}
              className="btn-primary w-full text-center block py-4"
              id="cart-checkout-btn"
              style={{ fontSize: "0.625rem", letterSpacing: "0.3em" }}
            >
              Checkout →
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
