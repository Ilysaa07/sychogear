"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { orderStatusSchema, type OrderStatusFormData } from "@/lib/validations";
import { formatCurrency, getStatusColor } from "@/lib/utils";
import axios from "axios";
import toast from "react-hot-toast";
import { HiOutlineSearch } from "react-icons/hi";
import type { OrderWithRelations } from "@/types";

export default function OrderStatusPage() {
  const [order, setOrder] = useState<OrderWithRelations | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OrderStatusFormData>({
    resolver: zodResolver(orderStatusSchema),
  });

  const onSubmit = async (data: OrderStatusFormData) => {
    setLoading(true);
    setSearched(true);
    try {
      const response = await axios.post("/api/order-status", data);
      if (response.data.success) {
        setOrder(response.data.data);
      } else {
        setOrder(null);
        toast.error(response.data.error || "Order tidak ditemukan");
      }
    } catch {
      setOrder(null);
      toast.error("Order tidak ditemukan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-main py-12">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs tracking-[0.3em] uppercase text-brand-500 mb-2">
            Track Your Package
          </p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Order Status
          </h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="card p-6 mb-8">
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-brand-400 uppercase tracking-wider mb-2">
                Email
              </label>
              <input
                {...register("email")}
                type="email"
                className="input-field"
                placeholder="Email yang digunakan saat checkout"
              />
              {errors.email && (
                <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>
              )}
            </div>
            <div>
              <label className="block text-xs text-brand-400 uppercase tracking-wider mb-2">
                Order Number
              </label>
              <input
                {...register("orderNumber")}
                className="input-field"
                placeholder="SG-XXXXXX-XXXXXX"
              />
              {errors.orderNumber && (
                <p className="text-red-400 text-xs mt-1">{errors.orderNumber.message}</p>
              )}
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              <HiOutlineSearch className="w-4 h-4 mr-2" />
              {loading ? "Searching..." : "Track Order"}
            </button>
          </div>
        </form>

        {/* Result */}
        {searched && !loading && (
          <>
            {order ? (
              <div className="card p-6 fade-in">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-bold text-lg">{order.orderNumber}</h3>
                    <p className="text-xs text-brand-500 mt-1">
                      {new Date(order.createdAt).toLocaleDateString("id-ID", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <span className={`badge ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>

                <div className="space-y-4 border-t border-white/5 pt-6">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="w-12 h-14 bg-brand-900 flex-shrink-0 overflow-hidden">
                        <img
                          src={item.product.images[0]?.url || "/placeholder.svg"}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.product.name}</p>
                        <p className="text-xs text-brand-500">
                          {item.size} × {item.quantity}
                        </p>
                      </div>
                      <p className="text-sm font-medium">
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="border-t border-white/5 pt-4 mt-4">
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>{formatCurrency(order.total)}</span>
                  </div>
                </div>

                {order.payment?.invoiceUrl && order.status === "PENDING" && (
                  <a
                    href={order.payment.invoiceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary w-full text-center block mt-6"
                  >
                    Complete Payment
                  </a>
                )}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-brand-400 text-sm">
                  Order tidak ditemukan. Pastikan email dan nomor order sudah benar.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
