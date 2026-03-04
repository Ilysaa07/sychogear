"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { formatCurrency, getStatusColor } from "@/lib/utils";
import type { OrderWithRelations } from "@/types";
import toast from "react-hot-toast";
import { HiOutlineDownload, HiOutlineEye } from "react-icons/hi";
import Papa from "papaparse";

const STATUS_FILTERS = [
  "ALL",
  "PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "EXPIRED",
  "FAILED",
];

const STATUS_OPTIONS = [
  "PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedOrder, setSelectedOrder] = useState<OrderWithRelations | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = statusFilter !== "ALL" ? `?status=${statusFilter}` : "";
      const { data } = await axios.get(`/api/orders${params}`);
      if (data.success) setOrders(data.data);
    } catch {
      toast.error("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingStatus(true);
    try {
      const { data } = await axios.patch(`/api/orders/${orderId}`, {
        status: newStatus,
      });
      if (data.success) {
        toast.success(`Status updated to ${newStatus}`);
        // Update selectedOrder in place
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus });
        }
        // Update orders list
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
      }
    } catch {
      toast.error("Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const exportCSV = () => {
    const csvData = orders.map((order) => ({
      "Order Number": order.orderNumber,
      Customer: order.customer.name,
      Email: order.customer.email,
      Phone: order.customer.phone || "-",
      Status: order.status,
      Total: order.total,
      "Payment Method": order.payment?.method || "-",
      "Paid At": order.payment?.paidAt
        ? new Date(order.payment.paidAt).toLocaleDateString()
        : "-",
      "Created At": new Date(order.createdAt).toLocaleDateString(),
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported!");
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
          <p className="text-sm text-brand-500 mt-1">
            {orders.length} orders found
          </p>
        </div>
        <button onClick={exportCSV} className="btn-secondary text-sm">
          <HiOutlineDownload className="w-4 h-4 mr-2" />
          Export CSV
        </button>
      </div>

      {/* Status Filter */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1.5 text-xs font-medium border transition-colors ${
              statusFilter === status
                ? "border-white bg-white text-black"
                : "border-white/10 text-brand-400 hover:border-white/30"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-xs text-brand-500 uppercase tracking-wider p-4">Order</th>
                <th className="text-left text-xs text-brand-500 uppercase tracking-wider p-4">Customer</th>
                <th className="text-left text-xs text-brand-500 uppercase tracking-wider p-4">Total</th>
                <th className="text-left text-xs text-brand-500 uppercase tracking-wider p-4">Status</th>
                <th className="text-left text-xs text-brand-500 uppercase tracking-wider p-4">Date</th>
                <th className="text-right text-xs text-brand-500 uppercase tracking-wider p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/5">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="p-4"><div className="h-4 skeleton w-24 rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-brand-500 text-sm">
                    No orders found
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-white/5 hover:bg-white/[.02] transition-colors"
                  >
                    <td className="p-4">
                      <p className="text-sm font-medium font-mono">
                        {order.orderNumber}
                      </p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm">{order.customer.name}</p>
                      <p className="text-xs text-brand-500">{order.customer.email}</p>
                    </td>
                    <td className="p-4 text-sm font-medium">
                      {formatCurrency(order.total)}
                    </td>
                    <td className="p-4">
                      <span className={`badge text-[10px] ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-brand-400">
                      {new Date(order.createdAt).toLocaleDateString("id-ID")}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="p-2 text-brand-400 hover:text-white transition-colors"
                      >
                        <HiOutlineEye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-50"
            onClick={() => setSelectedOrder(null)}
          />
          <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-brand-950 border-l border-white/5 z-50 overflow-y-auto p-6 fade-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">{selectedOrder.orderNumber}</h3>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-brand-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* Status with Update */}
              <div>
                <h4 className="text-xs text-brand-500 uppercase tracking-wider mb-2">
                  Order Status
                </h4>
                <div className="flex items-center gap-3">
                  <select
                    value={selectedOrder.status}
                    onChange={(e) =>
                      handleUpdateStatus(selectedOrder.id, e.target.value)
                    }
                    disabled={updatingStatus}
                    className="input-field text-sm flex-1"
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  <span
                    className={`badge text-[10px] flex-shrink-0 ${getStatusColor(
                      selectedOrder.status
                    )}`}
                  >
                    {selectedOrder.status}
                  </span>
                </div>
                {updatingStatus && (
                  <p className="text-xs text-brand-400 mt-1">Updating...</p>
                )}
              </div>

              <div>
                <h4 className="text-xs text-brand-500 uppercase tracking-wider mb-2">
                  Customer
                </h4>
                <p className="text-sm">{selectedOrder.customer.name}</p>
                <p className="text-xs text-brand-400">{selectedOrder.customer.email}</p>
                <p className="text-xs text-brand-400">{selectedOrder.customer.phone}</p>
                <p className="text-xs text-brand-400 mt-1">
                  {selectedOrder.customer.address}
                </p>
              </div>

              <div>
                <h4 className="text-xs text-brand-500 uppercase tracking-wider mb-3">
                  Items
                </h4>
                <div className="space-y-3">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="w-12 h-14 bg-brand-900 flex-shrink-0 overflow-hidden">
                        <img
                          src={item.product.images[0]?.url || "/placeholder.svg"}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">{item.product.name}</p>
                        <p className="text-xs text-brand-500">
                          {item.size} × {item.quantity}
                        </p>
                      </div>
                      <p className="text-sm">
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-white/5 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-brand-400">Subtotal</span>
                  <span>{formatCurrency(selectedOrder.subtotal)}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-brand-400">Discount</span>
                    <span className="text-green-400">
                      -{formatCurrency(selectedOrder.discount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-2">
                  <span>Total</span>
                  <span>{formatCurrency(selectedOrder.total)}</span>
                </div>
              </div>

              {selectedOrder.payment && (
                <div className="border-t border-white/5 pt-4">
                  <h4 className="text-xs text-brand-500 uppercase tracking-wider mb-2">
                    Payment
                  </h4>
                  <p className="text-sm">Method: {selectedOrder.payment.method || "-"}</p>
                  <p className="text-sm">
                    Status:{" "}
                    <span className={`${getStatusColor(selectedOrder.payment.status)}`}>
                      {selectedOrder.payment.status}
                    </span>
                  </p>
                  {selectedOrder.payment.paidAt && (
                    <p className="text-sm text-brand-400">
                      Paid: {new Date(selectedOrder.payment.paidAt).toLocaleString()}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
