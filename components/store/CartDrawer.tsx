"use client";

import { useEffect, useRef, useState } from "react";
import { HiOutlineX, HiOutlineShoppingBag, HiOutlineTrash, HiChevronDown, HiChevronUp, HiArrowRight } from "react-icons/hi";
import { useCartStore } from "@/stores/cart-store";
import { useUIStore } from "@/stores/ui-store";
import { useCurrency } from "@/components/store/CurrencyProvider";
import { useTranslation } from "./LanguageProvider";
import Link from "next/link";
import Image from "next/image";



export default function CartDrawer() {
  const isOpen  = useUIStore((s) => s.isCartDrawerOpen);
  const setOpen = useUIStore((s) => s.setCartDrawerOpen);
  const { items, removeItem, updateQuantity, getSubtotal, syncItemPrices, orderNote, setOrderNote } = useCartStore();
  const { formatPrice } = useCurrency();
  const { t } = useTranslation();
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

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm"
        onClick={() => setOpen(false)}
        aria-hidden="true"
        style={{ animation: "fadeIn 200ms ease forwards" }}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className="fixed right-0 top-0 h-full z-[70] flex flex-col w-full max-w-[420px] bg-[#0a0a0a]"
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        tabIndex={-1}
        style={{ animation: "slideInRight 300ms cubic-bezier(0.4,0,0.2,1) forwards", boxShadow: "-8px 0 40px rgba(0,0,0,0.8)" }}
      >
        {/* ─── Header ─────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-5 flex-shrink-0 border-b border-white/10">
          <div className="flex items-center gap-3">
            <HiOutlineShoppingBag className="w-5 h-5 text-white" />
            <div>
              <p className="font-sans font-bold tracking-[0.2em] text-white uppercase text-xs">
                {t("cart.drawerTitle")}
              </p>
              <p className="text-[10px] text-white/40 mt-0.5">{items.length} {items.length === 1 ? "item" : "items"}</p>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all duration-200"
            aria-label="Close cart"
          >
            <HiOutlineX className="w-4 h-4" />
          </button>
        </div>



        {/* ─── Items ──────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
          {items.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center h-full px-8 py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-white/[0.03] flex items-center justify-center mb-6">
                <HiOutlineShoppingBag className="w-6 h-6 text-white/30" />
              </div>
              <p className="font-sans font-bold tracking-[0.15em] text-white uppercase text-sm mb-2">
                {t("cart.empty")}
              </p>
              <p className="text-white/40 mb-8 max-w-[200px] text-[11px] uppercase tracking-widest leading-relaxed">
                {t("cart.emptySubtitle")}
              </p>
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-black text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-white/90 transition-all duration-200"
              >
                {t("cart.accessArchive")} <HiArrowRight className="w-3 h-3" />
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {items.map((item) => {
                const itemPrice = (item.salePrice ?? item.price) * (1 - (item.discountRate || 0) / 100);
                const hasDiscount = item.salePrice || (item.discountRate && item.discountRate > 0);
                const lineTotal = itemPrice * item.quantity;

                return (
                  <div
                    key={`${item.productId}-${item.variantId}`}
                    className="flex gap-5 px-6 py-6 group hover:bg-white/[0.02] transition-colors duration-200"
                  >
                    {/* Thumbnail */}
                    <div className="flex-shrink-0 relative overflow-hidden bg-[#111111] flex items-center justify-center rounded-sm" style={{ width: "70px", height: "90px" }}>
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="70px"
                        />
                      ) : (
                        <HiOutlineShoppingBag className="w-6 h-6 text-white/30" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <Link
                            href={`/products/${item.slug}`}
                            onClick={() => setOpen(false)}
                            className="font-sans font-medium text-xs tracking-widest uppercase text-white hover:text-white/70 transition-colors leading-snug line-clamp-2"
                          >
                            {item.name}
                          </Link>
                          <button
                            onClick={() => removeItem(item.productId, item.variantId)}
                            className="flex-shrink-0 text-white/30 hover:text-signal transition-colors duration-200"
                            aria-label="Remove item"
                          >
                            <HiOutlineTrash className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex items-center mt-1.5">
                          <span className="text-[9px] text-white/50 uppercase tracking-[0.2em]">SIZE: {item.size}</span>
                        </div>

                        <div className="flex items-baseline gap-2 mt-2">
                          <span className="text-xs font-bold text-white">{formatPrice(itemPrice)}</span>
                          {hasDiscount && (
                            <span className="text-[10px] text-white/30 line-through">{formatPrice(item.price)}</span>
                          )}
                        </div>
                      </div>

                      {/* Qty Controls */}
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center bg-white/5 rounded-sm">
                          <button
                            onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}
                            className="w-8 h-7 flex items-center justify-center text-white/50 hover:text-white transition-all text-xs"
                            aria-label="Decrease"
                          >
                            −
                          </button>
                          <span className="w-6 text-center text-[10px] font-bold text-white">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                            className="w-8 h-7 flex items-center justify-center text-white/50 hover:text-white transition-all text-xs"
                            aria-label="Increase"
                          >
                            +
                          </button>
                        </div>
                        <span className="text-xs font-dm-mono text-white/80">{formatPrice(lineTotal)}</span>
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
          <div className="flex-shrink-0 border-t border-white/[0.04] bg-[#0a0a0a]">

            {/* Order Note Accordion */}
            <div className="border-b border-white/[0.04]">
              <button
                onClick={() => setIsNoteOpen(!isNoteOpen)}
                className="w-full flex items-center justify-between px-6 py-4 text-white/40 hover:text-white/70 transition-colors group"
              >
                <span className="text-[10px] uppercase tracking-[0.2em] font-medium">{t("cart.addNote")}</span>
                {isNoteOpen ? <HiChevronUp className="w-4 h-4 transition-transform" /> : <HiChevronDown className="w-4 h-4 transition-transform group-hover:translate-y-0.5" />}
              </button>
              <div
                className="overflow-hidden transition-all duration-300 px-6"
                style={{ height: isNoteOpen ? "96px" : "0px", opacity: isNoteOpen ? 1 : 0 }}
              >
                <textarea
                  value={orderNote}
                  onChange={(e) => setOrderNote(e.target.value)}
                  placeholder="Special instructions for your order..."
                  className="w-full h-20 bg-[#111111] border border-white/5 text-white/80 placeholder-white/20 p-3 resize-none text-[11px] leading-relaxed focus:outline-none focus:border-white/20 transition-colors rounded-sm tracking-wide"
                />
              </div>
            </div>

            <div className="px-6 py-6 space-y-5">
              {/* Subtotal */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-[0.2em] text-white/50">{t("cart.subtotal")}</span>
                <span className="text-lg font-bold text-white font-dm-mono">{formatPrice(subtotal)}</span>
              </div>

              {/* Tax info */}
              <p className="text-[9px] text-white/30 uppercase tracking-widest text-center">
                {t("cart.taxesNote")}
              </p>

              {/* Checkout CTA */}
              <Link
                href="/checkout"
                onClick={() => setOpen(false)}
                id="cart-checkout-btn"
                className="flex items-center justify-center gap-3 w-full py-4 bg-white text-black font-sans font-bold text-[10px] tracking-[0.25em] uppercase hover:bg-gray-200 transition-all duration-300 group"
              >
                {t("cart.checkout")}
                <HiArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform duration-200" />
              </Link>

              {/* Continue Shopping */}
              <button
                onClick={() => setOpen(false)}
                className="w-full text-center text-[9px] text-white/40 hover:text-white uppercase tracking-[0.2em] transition-colors py-1"
              >
                CONTINUE SHOPPING
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </>
  );
}
