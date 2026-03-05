"use client";

import { useEffect } from "react";
import { HiOutlineX, HiPlus, HiMinus, HiOutlineShoppingBag } from "react-icons/hi";
import { useCartStore } from "@/stores/cart-store";
import { useUIStore } from "@/stores/ui-store";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

export default function CartDrawer() {
  const isOpen = useUIStore((s) => s.isCartDrawerOpen);
  const setOpen = useUIStore((s) => s.setCartDrawerOpen);
  const { items, removeItem, updateQuantity, getTotal, getSubtotal, getTotalTax, syncItemPrices } = useCartStore();

  // Bug #10 fix: sync cart prices with live server data every time drawer opens
  useEffect(() => {
    if (isOpen) {
      syncItemPrices();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 z-50 transition-opacity"
        onClick={() => setOpen(false)}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-brand-950 border-l border-white/5 z-50 flex flex-col slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <HiOutlineShoppingBag className="w-5 h-5 text-brand-400" />
            <h2 className="text-lg font-bold tracking-wider uppercase">Cart</h2>
            <span className="text-sm text-brand-500">({items.length})</span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-2 text-brand-400 hover:text-white transition-colors"
          >
            <HiOutlineX className="w-5 h-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <HiOutlineShoppingBag className="w-16 h-16 text-brand-700 mb-4" />
              <p className="text-brand-400 text-sm mb-6">Keranjang kamu masih kosong</p>
              <button
                onClick={() => setOpen(false)}
                className="btn-secondary text-xs"
              >
                Mulai Belanja
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {items.map((item) => (
                <div
                  key={`${item.productId}-${item.variantId}`}
                  className="flex gap-4"
                >
                  <div className="w-20 h-24 bg-brand-900 flex-shrink-0 overflow-hidden">
                    <img
                      src={item.image || "/placeholder.svg"}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-white truncate">
                      {item.name}
                    </h4>
                    <p className="text-xs text-brand-500 mt-1">Size: {item.size}</p>
                    <p className="text-sm font-semibold text-white mt-1">
                      {formatCurrency((item.salePrice ?? item.price) * (1 - item.discountRate / 100))}
                      {item.discountRate > 0 && (
                        <span className="text-[10px] text-brand-500 line-through ml-2">
                          {formatCurrency(item.salePrice ?? item.price)}
                        </span>
                      )}
                    </p>

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border border-white/10">
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.productId,
                              item.variantId,
                              item.quantity - 1
                            )
                          }
                          className="p-1.5 text-brand-400 hover:text-white transition-colors"
                        >
                          <HiMinus className="w-3 h-3" />
                        </button>
                        <span className="px-3 text-xs font-medium">
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
                          className="p-1.5 text-brand-400 hover:text-white transition-colors"
                        >
                          <HiPlus className="w-3 h-3" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.productId, item.variantId)}
                        className="text-xs text-brand-500 hover:text-red-400 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-6 border-t border-white/5 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-brand-400">Subtotal</span>
                <span className="text-sm font-medium">{formatCurrency(getSubtotal())}</span>
              </div>
              {getTotalTax() > 0 && (
                <div className="flex items-center justify-between text-xs text-brand-500">
                  <span>Pajak (PPN/PPH 23)</span>
                  <span>+{formatCurrency(getTotalTax())}</span>
                </div>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <span className="text-sm font-bold">Total</span>
                <span className="text-lg font-bold text-white">{formatCurrency(getTotal())}</span>
              </div>
            </div>
            <Link
              href="/checkout"
              onClick={() => setOpen(false)}
              className="btn-primary w-full text-center block"
            >
              Checkout
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
