"use client";

import { useEffect, useRef } from "react";
import { HiOutlineX, HiPlus, HiMinus, HiOutlineShoppingBag } from "react-icons/hi";
import { useCartStore } from "@/stores/cart-store";
import { useUIStore } from "@/stores/ui-store";
import { useCurrency } from "@/components/store/CurrencyProvider";
import Link from "next/link";

export default function CartDrawer() {
  const isOpen = useUIStore((s) => s.isCartDrawerOpen);
  const setOpen = useUIStore((s) => s.setCartDrawerOpen);
  const { items, removeItem, updateQuantity, getTotal, getSubtotal, getTotalTax, syncItemPrices } =
    useCartStore();
  const { formatPrice } = useCurrency();

  const drawerRef = useRef<HTMLDivElement>(null);

  // Sync prices each time drawer opens
  useEffect(() => {
    if (isOpen) {
      syncItemPrices();
    }
  }, [isOpen, syncItemPrices]);

  // Trap focus & close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
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
  const tax = getTotalTax();
  const total = getTotal();

  return (
    <>
      {/* Overlay */}
      <div
        className="cart-overlay fade-in"
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

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
        <div className="flex items-center justify-between px-6 py-5 border-b border-ember flex-shrink-0">
          <div className="flex items-center gap-3">
            <HiOutlineShoppingBag className="w-4 h-4 text-signal" />
            <p className="label-syne text-salt">YOUR KIT</p>
            <span
              className="text-fog"
              style={{
                fontFamily: "var(--font-dm-mono), monospace",
                fontSize: "0.6875rem",
                letterSpacing: "0.1em",
              }}
            >
              [{items.length}]
            </span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-1 text-ash hover:text-salt transition-colors duration-200"
            aria-label="Close cart"
          >
            <HiOutlineX className="w-4 h-4" />
          </button>
        </div>

        {/* ─── Items ──────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center h-full text-center px-8 py-16">
              <HiOutlineShoppingBag className="w-10 h-10 text-fog mb-8" />
              <p
                className="text-fog mb-5"
                style={{
                  fontFamily: "var(--font-dm-mono), monospace",
                  fontSize: "0.75rem",
                  letterSpacing: "0.15em",
                }}
              >
                (nothing yet.)
              </p>
              <button onClick={() => setOpen(false)} className="btn-link text-[10px]">
                Explore the gear →
              </button>
            </div>
          ) : (
            <div className="divide-y divide-ember">
              {items.map((item) => {
                const itemPrice =
                  (item.salePrice ?? item.price) *
                  (1 - (item.discountRate || 0) / 100);
                const hasDiscount =
                  item.salePrice || (item.discountRate && item.discountRate > 0);

                return (
                  <div
                    key={`${item.productId}-${item.variantId}`}
                    className="flex gap-4 px-6 py-5"
                  >
                    {/* Thumbnail */}
                    <div
                      className="flex-shrink-0 overflow-hidden bg-dim"
                      style={{ width: "72px", height: "90px" }}
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
                        <p
                          className="text-salt truncate"
                          style={{
                            fontFamily: "var(--font-syne), system-ui, sans-serif",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            lineHeight: 1.4,
                          }}
                        >
                          {item.name}
                        </p>
                        <p
                          className="text-ash mt-1"
                          style={{
                            fontFamily: "var(--font-dm-mono), monospace",
                            fontSize: "0.6875rem",
                            letterSpacing: "0.15em",
                            textTransform: "uppercase",
                          }}
                        >
                          SIZE / {item.size}
                        </p>
                        <div className="flex items-baseline gap-2 mt-1">
                          <p
                            className="text-signal"
                            style={{
                              fontFamily: "var(--font-dm-mono), monospace",
                              fontSize: "0.8125rem",
                            }}
                          >
                            {formatPrice(itemPrice)}
                          </p>
                          {hasDiscount && (
                            <p
                              className="text-fog line-through"
                              style={{
                                fontFamily: "var(--font-dm-mono), monospace",
                                fontSize: "0.6875rem",
                              }}
                            >
                              {formatPrice(item.price)}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Qty + Remove */}
                      <div className="flex items-center justify-between mt-3">
                        {/* Qty controls — inline, minimal */}
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() =>
                              updateQuantity(item.productId, item.variantId, item.quantity - 1)
                            }
                            className="text-ash hover:text-salt transition-colors w-5 h-5 flex items-center justify-center"
                            aria-label="Decrease quantity"
                          >
                            <HiMinus className="w-3 h-3" />
                          </button>
                          <span
                            className="text-salt w-4 text-center"
                            style={{
                              fontFamily: "var(--font-dm-mono), monospace",
                              fontSize: "0.8125rem",
                            }}
                          >
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(item.productId, item.variantId, item.quantity + 1)
                            }
                            className="text-ash hover:text-salt transition-colors w-5 h-5 flex items-center justify-center"
                            aria-label="Increase quantity"
                          >
                            <HiPlus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Remove */}
                        <button
                          onClick={() => removeItem(item.productId, item.variantId)}
                          className="btn-link text-[10px] text-fog hover:text-error"
                          style={{ borderBottomColor: "transparent" }}
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
          <div className="border-t border-ember px-6 py-6 flex-shrink-0 space-y-4">
            {/* Totals — invoice style */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span
                  className="text-ash"
                  style={{
                    fontFamily: "var(--font-dm-mono), monospace",
                    fontSize: "0.6875rem",
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                  }}
                >
                  SUBTOTAL
                </span>
                <span
                  className="text-pale"
                  style={{
                    fontFamily: "var(--font-dm-mono), monospace",
                    fontSize: "0.8125rem",
                  }}
                >
                  {formatPrice(subtotal)}
                </span>
              </div>

              {tax > 0 && (
                <div className="flex items-center justify-between">
                  <span
                    className="text-fog"
                    style={{
                      fontFamily: "var(--font-dm-mono), monospace",
                      fontSize: "0.6875rem",
                      letterSpacing: "0.1em",
                    }}
                  >
                    Pajak (PPN/PPH 23)
                  </span>
                  <span
                    className="text-fog"
                    style={{
                      fontFamily: "var(--font-dm-mono), monospace",
                      fontSize: "0.6875rem",
                    }}
                  >
                    +{formatPrice(tax)}
                  </span>
                </div>
              )}

              {/* Divider */}
              <div className="section-divider" />

              <div className="flex items-center justify-between pt-1">
                <span
                  className="text-salt"
                  style={{
                    fontFamily: "var(--font-syne), system-ui, sans-serif",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                  }}
                >
                  TOTAL
                </span>
                <span
                  className="text-signal"
                  style={{
                    fontFamily: "var(--font-dm-mono), monospace",
                    fontSize: "1.125rem",
                    fontWeight: 500,
                  }}
                >
                  {formatPrice(total)}
                </span>
              </div>
            </div>

            {/* Checkout CTA */}
            <Link
              href="/checkout"
              onClick={() => setOpen(false)}
              className="btn-primary w-full text-center block py-4"
              id="cart-checkout-btn"
              style={{ fontSize: "0.75rem", letterSpacing: "0.2em" }}
            >
              PROCEED →
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
