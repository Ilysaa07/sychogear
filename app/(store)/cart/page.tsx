"use client";

import { useCartStore } from "@/stores/cart-store";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { HiMinus, HiPlus, HiOutlineShoppingBag } from "react-icons/hi";

export default function CartPage() {
  const { items, removeItem, updateQuantity, getTotal, getSubtotal, getTotalTax } =
    useCartStore();

  /* ── Empty state ────────────────────────────────────── */
  if (items.length === 0) {
    return (
      <div
        className="min-h-screen bg-void flex flex-col items-center justify-center text-center px-6"
        style={{ paddingTop: "clamp(100px, 16vw, 160px)" }}
      >
        <HiOutlineShoppingBag className="w-10 h-10 text-fog mb-6" />
        <h1
          className="font-display text-salt mb-3"
          style={{ fontSize: "clamp(32px, 5vw, 52px)", lineHeight: 0.95 }}
        >
          The archive is empty.
        </h1>
        <p
          className="text-ash mb-10"
          style={{
            fontFamily: "var(--font-dm-mono), monospace",
            fontSize: "0.8125rem",
            letterSpacing: "0.05em",
            maxWidth: "380px",
            lineHeight: 1.7,
          }}
        >
          Nothing selected yet. Browse the collection and add pieces to your
          cart.
        </p>
        <Link href="/products" className="btn-primary py-4 px-10">
          Explore Archive ↗
        </Link>
      </div>
    );
  }

  const subtotal = getSubtotal();
  const total = subtotal; // Tax calculated at checkout stage based on location

  return (
    <div
      className="min-h-screen bg-void"
      style={{ paddingTop: "clamp(100px, 16vw, 160px)" }}
    >
      <div
        className="container-main"
        style={{
          paddingTop: "clamp(40px, 6vw, 60px)",
          paddingBottom: "clamp(60px, 10vw, 120px)",
        }}
      >
        {/* Page heading */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12 pb-8 border-b border-ember">
          <div>
            <p className="label-eyebrow mb-3">Your selection</p>
            <h1
              className="font-display text-salt"
              style={{ fontSize: "clamp(48px, 8vw, 88px)", lineHeight: 0.9 }}
            >
              Cart
            </h1>
          </div>
          <p
            className="text-ash flex-shrink-0"
            style={{
              fontFamily: "var(--font-dm-mono), monospace",
              fontSize: "0.6875rem",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
            }}
          >
            {items.length} {items.length === 1 ? "piece" : "pieces"}
          </p>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

          {/* Items — spans 7 of 12 */}
          <div className="lg:col-span-7 divide-y divide-ember">
            {items.map((item) => {
              const itemPrice =
                (item.salePrice ?? item.price) *
                (1 - (item.discountRate || 0) / 100);
              const hasDiscount =
                item.salePrice || (item.discountRate && item.discountRate > 0);

              return (
                <div
                  key={`${item.productId}-${item.variantId}`}
                  className="flex gap-5 py-7"
                >
                  {/* Thumbnail */}
                  <div
                    className="flex-shrink-0 overflow-hidden bg-dim"
                    style={{ width: "88px", height: "112px" }}
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
                        className="text-salt"
                        style={{
                          fontFamily: "var(--font-syne), system-ui, sans-serif",
                          fontWeight: 600,
                          fontSize: "0.8125rem",
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          lineHeight: 1.4,
                        }}
                      >
                        {item.name}
                      </p>
                      <p
                        className="text-ash mt-1.5"
                        style={{
                          fontFamily: "var(--font-dm-mono), monospace",
                          fontSize: "0.6875rem",
                          letterSpacing: "0.15em",
                          textTransform: "uppercase",
                        }}
                      >
                        Size: {item.size}
                      </p>
                      <div className="flex items-baseline gap-2 mt-1.5">
                        <span
                          className="text-signal"
                          style={{
                            fontFamily: "var(--font-dm-mono), monospace",
                            fontSize: "0.875rem",
                          }}
                        >
                          {formatCurrency(itemPrice)}
                        </span>
                        {hasDiscount && (
                          <span
                            className="text-fog line-through"
                            style={{
                              fontFamily: "var(--font-dm-mono), monospace",
                              fontSize: "0.6875rem",
                            }}
                          >
                            {formatCurrency(item.price)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-between mt-4">
                      {/* Qty */}
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.productId,
                              item.variantId,
                              item.quantity - 1
                            )
                          }
                          className="text-ash hover:text-salt transition-colors duration-150 w-5 h-5 flex items-center justify-center"
                          aria-label="Decrease quantity"
                        >
                          <HiMinus className="w-3 h-3" />
                        </button>
                        <span
                          className="text-salt"
                          style={{
                            fontFamily: "var(--font-dm-mono), monospace",
                            fontSize: "0.8125rem",
                            minWidth: "20px",
                            textAlign: "center",
                          }}
                        >
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.productId,
                              item.variantId,
                              item.quantity + 1
                            )
                          }
                          className="text-ash hover:text-salt transition-colors duration-150 w-5 h-5 flex items-center justify-center"
                          aria-label="Increase quantity"
                        >
                          <HiPlus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Line total + remove */}
                      <div className="flex items-center gap-4">
                        <span
                          className="text-pale"
                          style={{
                            fontFamily: "var(--font-dm-mono), monospace",
                            fontSize: "0.8125rem",
                          }}
                        >
                          {formatCurrency(itemPrice * item.quantity)}
                        </span>
                        <button
                          onClick={() => removeItem(item.productId, item.variantId)}
                          className="btn-link text-[10px]"
                          style={{ color: "var(--fog)" }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order Summary — spans 5 of 12, sticky */}
          <div
            className="lg:col-span-5"
            style={{ alignSelf: "start", position: "sticky", top: "120px" }}
          >
            <div
              className="p-8"
              style={{
                background: "var(--abyss)",
                border: "1px solid var(--ember)",
              }}
            >
              <p className="label-syne text-salt mb-6">Order Summary</p>

              {/* Totals — invoice style */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between">
                  <span
                    className="text-ash"
                    style={{
                      fontFamily: "var(--font-dm-mono), monospace",
                      fontSize: "0.75rem",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                    }}
                  >
                    Subtotal
                  </span>
                  <span
                    className="text-pale"
                    style={{
                      fontFamily: "var(--font-dm-mono), monospace",
                      fontSize: "0.875rem",
                    }}
                  >
                    {formatCurrency(subtotal)}
                  </span>
                </div>



                <div className="flex items-center justify-between">
                  <span
                    className="text-fog"
                    style={{
                      fontFamily: "var(--font-dm-mono), monospace",
                      fontSize: "0.6875rem",
                      letterSpacing: "0.08em",
                    }}
                  >
                    Shipping
                  </span>
                  <span
                    className="text-fog"
                    style={{
                      fontFamily: "var(--font-dm-mono), monospace",
                      fontSize: "0.6875rem",
                    }}
                  >
                    Calculated at checkout
                  </span>
                </div>
              </div>

              <div className="section-divider mb-6" />

              <div className="flex items-center justify-between mb-8">
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
                  Total
                </span>
                <span
                  className="text-signal"
                  style={{
                    fontFamily: "var(--font-dm-mono), monospace",
                    fontSize: "1.25rem",
                    fontWeight: 500,
                  }}
                >
                  {formatCurrency(total)}
                </span>
              </div>

              {/* CTA */}
              <Link
                href="/checkout"
                className="btn-primary w-full text-center block py-4"
                id="cart-to-checkout-btn"
              >
                Proceed to Checkout
              </Link>

              <Link
                href="/products"
                className="btn-link w-full justify-center mt-5"
              >
                ← Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
