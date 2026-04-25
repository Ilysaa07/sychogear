"use client";

import { useEffect, useRef, useState } from "react";
import { HiOutlineX, HiPlus, HiMinus, HiChevronDown, HiChevronUp } from "react-icons/hi";
import { useCartStore } from "@/stores/cart-store";
import { useUIStore } from "@/stores/ui-store";
import { useCurrency } from "@/components/store/CurrencyProvider";
import Link from "next/link";

const FREE_SHIPPING_THRESHOLD = 1000000;

export default function CartDrawer() {
  const isOpen  = useUIStore((s) => s.isCartDrawerOpen);
  const setOpen = useUIStore((s) => s.setCartDrawerOpen);
  const { items, removeItem, updateQuantity, getSubtotal, syncItemPrices, orderNote, setOrderNote, getTotalTax } = useCartStore();
  const { formatPrice } = useCurrency();
  const drawerRef = useRef<HTMLDivElement>(null);
  
  const [isNoteOpen, setIsNoteOpen] = useState(false);

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
  const estimatedTax = getTotalTax();

  return (
    <>
      {/* Overlay */}
      <div className="cart-overlay fade-in" onClick={() => setOpen(false)} aria-hidden="true" />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className="cart-drawer is-open flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        tabIndex={-1}
      >
        {/* ─── Header ─────────────────────────────────── */}
        <div
          className="flex items-center justify-between px-6 py-5 flex-shrink-0 bg-void"
          style={{ borderBottom: "1px solid var(--ember)" }}
        >
          <div>
            <p className="font-syne font-semibold tracking-[0.2em] text-salt uppercase text-xs">
              Cart {" "}
              <span
                style={{
                  fontFamily: "var(--font-dm-mono), monospace",
                  fontSize: "0.6875rem",
                  color: "var(--ash)",
                  fontWeight: 400,
                  letterSpacing: "0.05em",
                }}
              >
                [{items.length}]
              </span>
            </p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-1 text-ash hover:text-signal transition-colors duration-200"
            aria-label="Close cart"
            style={{ fontSize: "1.25rem", lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        {/* ─── Items ──────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-abyss">
          {items.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center h-full px-8 py-16 text-center">
              <div className="w-16 h-16 border border-ember mb-6 flex items-center justify-center blade-cut" style={{ color: "var(--ash)" }}>
                <span style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: "0.75rem", letterSpacing: "0.1em" }}>00</span>
              </div>
              <p
                className="font-syne font-semibold tracking-[0.1em] text-salt uppercase text-sm mb-2"
              >
                Subject Not Found
              </p>
              <p className="text-ash mb-8 max-w-[200px]" style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: "0.6875rem", lineHeight: 1.5 }}>
                Your archive unit is currently empty.
              </p>
              <Link 
                href="/products" 
                onClick={() => setOpen(false)} 
                className="btn-ghost"
              >
                Access Archive
              </Link>
            </div>
          ) : (
            <div>
              {items.map((item) => {
                const itemPrice = (item.salePrice ?? item.price) * (1 - (item.discountRate || 0) / 100);
                const hasDiscount = item.salePrice || (item.discountRate && item.discountRate > 0);

                return (
                  <div
                    key={`${item.productId}-${item.variantId}`}
                    className="flex gap-4 px-6 py-6 group relative"
                    style={{ borderBottom: "1px solid var(--ember)" }}
                  >
                    {/* Hover indicator line */}
                    <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-signal scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-center" />

                    {/* Thumbnail */}
                    <div
                      className="flex-shrink-0 overflow-hidden bg-dim blade-cut"
                      style={{
                        width: "80px",
                        height: "106px",
                      }}
                    >
                      <img
                        src={item.image || "/placeholder.svg"}
                        alt={item.name}
                        className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start">
                          <p style={{
                            fontFamily: "var(--font-syne), system-ui, sans-serif",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            color: "var(--salt)",
                            lineHeight: 1.4,
                            paddingRight: "12px"
                          }}>
                            {item.name}
                          </p>
                          <button
                            onClick={() => removeItem(item.productId, item.variantId)}
                            className="text-ash hover:text-redline transition-colors"
                            aria-label="Remove item"
                          >
                            <HiOutlineX className="w-4 h-4" />
                          </button>
                        </div>
                        <p style={{
                          fontFamily: "var(--font-dm-mono), monospace",
                          fontSize: "0.625rem",
                          letterSpacing: "0.2em",
                          textTransform: "uppercase",
                          color: "var(--ash)",
                          marginTop: "4px",
                        }}>
                          Unit / {item.size}
                        </p>
                        <div className="flex items-baseline gap-2 mt-2">
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

                      {/* Bracket Qty Controls */}
                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-1 select-none">
                          <button
                            onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}
                            className="text-ash hover:text-signal transition-colors px-1"
                            style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: "0.75rem" }}
                            aria-label="Decrease quantity"
                          >
                            [ - ]
                          </button>
                          <span style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: "0.75rem", color: "var(--salt)", width: "24px", textAlign: "center" }}>
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                            className="text-ash hover:text-signal transition-colors px-1"
                            style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: "0.75rem" }}
                            aria-label="Increase quantity"
                          >
                            [ + ]
                          </button>
                        </div>
                        
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
            className="flex-shrink-0 bg-void"
            style={{ borderTop: "1px solid var(--ember)" }}
          >
            {/* Order Note Accordion */}
            <div className="border-b border-ember">
              <button 
                onClick={() => setIsNoteOpen(!isNoteOpen)}
                className="w-full flex items-center justify-between px-6 py-4 text-ash hover:text-salt transition-colors"
              >
                <span style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: "0.625rem", letterSpacing: "0.15em", textTransform: "uppercase" }}>
                  Add Note / Instructions
                </span>
                {isNoteOpen ? <HiChevronUp className="w-4 h-4" /> : <HiChevronDown className="w-4 h-4" />}
              </button>
              
              <div 
                className="overflow-hidden transition-all duration-300 ease-compose px-6"
                style={{ height: isNoteOpen ? '100px' : '0px', opacity: isNoteOpen ? 1 : 0 }}
              >
                <textarea 
                  value={orderNote}
                  onChange={(e) => setOrderNote(e.target.value)}
                  placeholder="Enter special instructions..."
                  className="w-full h-20 bg-dim border border-ember text-salt p-3 resize-none focus:border-signal transition-colors custom-scrollbar"
                  style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: "0.75rem" }}
                />
              </div>
            </div>

            <div className="px-6 py-6 space-y-4">
              {/* Totals */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: "0.625rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--ash)" }}>
                    Subtotal
                  </span>
                  <span style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: "0.8125rem", color: "var(--pale)" }}>
                    {formatPrice(subtotal)}
                  </span>
                </div>
                
                {estimatedTax > 0 && (
                  <div className="flex items-center justify-between">
                    <span style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: "0.625rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--ash)" }}>
                      Estimated Tax
                    </span>
                    <span style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: "0.8125rem", color: "var(--pale)" }}>
                      {formatPrice(estimatedTax)}
                    </span>
                  </div>
                )}
                
                <div style={{ height: "1px", background: "var(--ember)" }} />
                
                <div className="flex items-center justify-between pt-1">
                  <span style={{ fontFamily: "var(--font-syne), system-ui, sans-serif", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--salt)" }}>
                    Estimated Total
                  </span>
                  <span style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: "1.125rem", fontWeight: 500, color: "var(--signal)" }}>
                    {formatPrice(subtotal + estimatedTax)}
                  </span>
                </div>
                
                <p style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: "0.625rem", color: "var(--ash)", textAlign: "center", paddingTop: "0.5rem" }}>
                  Taxes & shipping calculated at checkout
                </p>
              </div>

              {/* CTA */}
              <Link
                href="/checkout"
                onClick={() => setOpen(false)}
                className="btn-primary w-full text-center block py-4 mt-2"
                id="cart-checkout-btn"
              >
                Proceed to Checkout
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
