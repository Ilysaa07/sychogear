"use client";

import { useCartStore } from "@/stores/cart-store";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { HiMinus, HiPlus, HiOutlineTrash, HiOutlineShoppingBag } from "react-icons/hi";

export default function CartPage() {
  const { items, removeItem, updateQuantity, getTotal, getSubtotal, getTotalTax } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="container-main pt-40 pb-20 text-center">
        <HiOutlineShoppingBag className="w-20 h-20 text-brand-700 mx-auto mb-6" />
        <h1 className="text-2xl font-bold mb-4">Keranjang Kosong</h1>
        <p className="text-brand-400 text-sm mb-8">
          Belum ada produk di keranjang kamu.
        </p>
        <Link href="/products" className="btn-primary">
          Mulai Belanja
        </Link>
      </div>
    );
  }

  return (
    <div className="container-main pt-32 pb-12">
      <h1 className="text-3xl font-bold tracking-tight mb-10">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Items */}
        <div className="lg:col-span-2 space-y-6">
          {items.map((item) => (
            <div
              key={`${item.productId}-${item.variantId}`}
              className="card p-4 flex gap-4"
            >
              <div className="w-24 h-32 bg-brand-900 flex-shrink-0 overflow-hidden">
                <img
                  src={item.image || "/placeholder.svg"}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-medium text-white">{item.name}</h3>
                    <p className="text-xs text-brand-500 mt-1">Size: {item.size}</p>
                  </div>
                  <button
                    onClick={() => removeItem(item.productId, item.variantId)}
                    className="p-1 text-brand-500 hover:text-red-400 transition-colors"
                  >
                    <HiOutlineTrash className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-end justify-between mt-4">
                  <div className="flex items-center border border-white/10">
                    <button
                      onClick={() =>
                        updateQuantity(item.productId, item.variantId, item.quantity - 1)
                      }
                      className="p-2 text-brand-400 hover:text-white transition-colors"
                    >
                      <HiMinus className="w-3 h-3" />
                    </button>
                    <span className="px-4 text-sm font-medium">{item.quantity}</span>
                    <button
                      onClick={() =>
                        updateQuantity(item.productId, item.variantId, item.quantity + 1)
                      }
                      className="p-2 text-brand-400 hover:text-white transition-colors"
                    >
                      <HiPlus className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="font-semibold">
                    {formatCurrency((item.salePrice ?? item.price) * item.quantity)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="card p-6 h-fit sticky top-24">
          <h3 className="text-lg font-bold mb-6">Order Summary</h3>
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-brand-400">Subtotal</span>
              <span>{formatCurrency(getSubtotal())}</span>
            </div>
            {getTotalTax() > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-brand-400">Pajak (PPN + PPH23)</span>
                <span>{formatCurrency(getTotalTax())}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-brand-400">Shipping</span>
              <span className="text-brand-500">Calculated at checkout</span>
            </div>
          </div>
          <div className="flex justify-between text-lg font-bold pt-4 border-t border-white/5">
            <span>Total</span>
            <span>{formatCurrency(getTotal())}</span>
          </div>
          <Link
            href="/checkout"
            className="btn-primary w-full text-center block mt-6"
          >
            Proceed to Checkout
          </Link>
          <Link
            href="/products"
            className="btn-secondary w-full text-center block mt-3 text-xs"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
