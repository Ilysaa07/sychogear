"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { checkoutSchema, type CheckoutFormData } from "@/lib/validations";
import { useCartStore } from "@/stores/cart-store";
import { formatCurrency } from "@/lib/utils";
import axios from "axios";
import toast from "react-hot-toast";
import Link from "next/link";
import { HiOutlineShoppingBag } from "react-icons/hi";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotal, getSubtotal, getTotalTax, clearCart } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);

  const finalTotal = Math.max(0, getTotal() - discountAmount);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
  });

  if (items.length === 0) {
    return (
      <div className="container-main pt-40 pb-20 text-center">
        <HiOutlineShoppingBag className="w-20 h-20 text-brand-700 mx-auto mb-6" />
        <h1 className="text-2xl font-bold mb-4">Keranjang Kosong</h1>
        <p className="text-brand-400 text-sm mb-8">
          Tambahkan produk ke keranjang sebelum checkout.
        </p>
        <Link href="/products" className="btn-primary">
          Shop Now
        </Link>
      </div>
    );
  }

  const onSubmit = async (formData: CheckoutFormData) => {
    setLoading(true);
    try {
      const { data } = await axios.post("/api/orders/create", {
        customer: formData,
        items,
        couponCode: couponCode || undefined,
      });

      if (data.success) {
        clearCart();
        toast.success("Order berhasil dibuat. Redirecting...");
        router.push(data.data.invoiceUrl);
      } else {
        toast.error(data.error || "Gagal membuat order");
      }
    } catch {
      toast.error("Gagal membuat order. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setValidatingCoupon(true);
    try {
      const { data } = await axios.post("/api/coupons/validate", {
        code: couponCode,
        subtotal: getSubtotal(), // Coupon applies to product subtotal
      });
      if (data.success) {
        setDiscountAmount(data.data.discountAmount);
        setAppliedCoupon(data.data.code);
        toast.success("Kupon berhasil digunakan!");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Kupon tidak valid");
      setDiscountAmount(0);
      setAppliedCoupon(null);
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode("");
    setDiscountAmount(0);
    setAppliedCoupon(null);
  };

  return (
    <div className="container-main pt-32 pb-12">
      <h1 className="text-3xl font-bold tracking-tight mb-10">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="card p-6 space-y-4">
              <h2 className="text-lg font-bold mb-4">Contact Information</h2>

              <div>
                <label className="block text-xs text-brand-400 uppercase tracking-wider mb-2">
                  Full Name *
                </label>
                <input
                  {...register("fullName")}
                  className="input-field"
                  placeholder="John Doe"
                />
                {errors.fullName && (
                  <p className="text-red-400 text-xs mt-1">{errors.fullName.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-brand-400 uppercase tracking-wider mb-2">
                    Email *
                  </label>
                  <input
                    {...register("email")}
                    type="email"
                    className="input-field"
                    placeholder="john@email.com"
                  />
                  {errors.email && (
                    <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs text-brand-400 uppercase tracking-wider mb-2">
                    Phone *
                  </label>
                  <input
                    {...register("phone")}
                    className="input-field"
                    placeholder="08xxxxxxxxxx"
                  />
                  {errors.phone && (
                    <p className="text-red-400 text-xs mt-1">{errors.phone.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs text-brand-400 uppercase tracking-wider mb-2">
                  Address *
                </label>
                <textarea
                  {...register("address")}
                  className="input-field min-h-[100px] resize-none"
                  placeholder="Alamat lengkap pengiriman"
                />
                {errors.address && (
                  <p className="text-red-400 text-xs mt-1">{errors.address.message}</p>
                )}
              </div>
            </div>

            {/* Coupon */}
            <div className="card p-6">
              <h2 className="text-lg font-bold mb-4">Coupon Code</h2>
              <div className="flex gap-3">
                <input
                  value={couponCode}
                  onChange={(e) => {
                    setCouponCode(e.target.value.toUpperCase());
                    if (appliedCoupon && e.target.value.toUpperCase() !== appliedCoupon) {
                      setAppliedCoupon(null);
                      setDiscountAmount(0);
                    }
                  }}
                  disabled={!!appliedCoupon || validatingCoupon}
                  className="input-field flex-1"
                  placeholder="Enter coupon code"
                />
                {!appliedCoupon ? (
                  <button 
                    type="button" 
                    onClick={handleApplyCoupon}
                    disabled={!couponCode || validatingCoupon}
                    className="btn-secondary text-xs whitespace-nowrap disabled:opacity-50"
                  >
                    {validatingCoupon ? "Validating..." : "Apply"}
                  </button>
                ) : (
                  <button 
                    type="button" 
                    onClick={handleRemoveCoupon}
                    className="btn-secondary text-xs whitespace-nowrap !border-red-500/30 !text-red-400 hover:!bg-red-500/10"
                  >
                    Remove
                  </button>
                )}
              </div>
              {appliedCoupon && (
                <p className="text-xs text-green-400 mt-2">
                  ✓ Kupon digunakan. Diskon: {formatCurrency(discountAmount)}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? "Processing..." : `Pay ${formatCurrency(finalTotal)}`}
            </button>
          </form>
        </div>

        {/* Order Summary */}
        <div className="card p-6 h-fit sticky top-24">
          <h3 className="text-lg font-bold mb-6">Order Summary</h3>
          <div className="space-y-4 mb-6">
            {items.map((item) => (
              <div
                key={`${item.productId}-${item.variantId}`}
                className="flex gap-3"
              >
                <div className="w-14 h-16 bg-brand-900 flex-shrink-0 overflow-hidden">
                  <img
                    src={item.image || "/placeholder.svg"}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <p className="text-xs text-brand-500">
                    {item.size} × {item.quantity}
                  </p>
                </div>
                <p className="text-sm font-medium whitespace-nowrap">
                  {formatCurrency(((item.salePrice ?? item.price) * (1 - item.discountRate / 100)) * item.quantity)}
                </p>
              </div>
            ))}
          </div>
          <div className="pt-4 border-t border-white/5 space-y-2">
            <div className="flex justify-between text-sm text-brand-400">
              <span>Subtotal</span>
              <span>{formatCurrency(getSubtotal())}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm text-green-400">
                <span>Discount</span>
                <span>-{formatCurrency(discountAmount)}</span>
              </div>
            )}
            {getTotalTax() > 0 && (
              <div className="flex justify-between text-xs text-brand-500">
                <span>Pajak (PPN/PPH 23)</span>
                <span>+{formatCurrency(getTotalTax())}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-white/5">
              <span>Total</span>
              <span>{formatCurrency(finalTotal)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
