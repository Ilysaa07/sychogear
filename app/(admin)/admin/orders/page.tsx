"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { formatCurrency, getStatusColor } from "@/lib/utils";
import type { OrderWithRelations } from "@/types";
import ConfirmModal from "@/components/admin/ConfirmModal";
import toast from "react-hot-toast";
import { HiOutlineDownload, HiOutlineEye, HiOutlineTrash } from "react-icons/hi";
import Papa from "papaparse";
import Image from "next/image";

const COUNTRY_NAMES: Record<string, string> = {
  ID: "Indonesia", MY: "Malaysia", SG: "Singapore", TH: "Thailand", PH: "Philippines",
  VN: "Vietnam", MM: "Myanmar", KH: "Cambodia", LA: "Laos", BN: "Brunei",
  JP: "Japan", KR: "South Korea", CN: "China", HK: "Hong Kong", TW: "Taiwan",
  IN: "India", PK: "Pakistan", BD: "Bangladesh", LK: "Sri Lanka",
  AE: "UAE", SA: "Saudi Arabia", QA: "Qatar", KW: "Kuwait",
  AU: "Australia", NZ: "New Zealand",
  GB: "United Kingdom", DE: "Germany", FR: "France", NL: "Netherlands", IT: "Italy", ES: "Spain",
  US: "United States", CA: "Canada", BR: "Brazil", MX: "Mexico",
};

function formatUSD(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(amount);
}

const STATUS_FILTERS = [
  "ALL",
  "UNPAID",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "EXPIRED",
  "FAILED",
];

const STATUS_OPTIONS = [
  "UNPAID",
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
  const [deleting, setDeleting] = useState(false);
  const [deleteOrderId, setDeleteOrderId] = useState<string | null>(null);
  const [forceUpdateConfig, setForceUpdateConfig] = useState<{ id: string; status: string } | null>(null);
  const [editingCustomer, setEditingCustomer] = useState(false);
  const [savingTracking, setSavingTracking] = useState(false);
  const [trackingInput, setTrackingInput] = useState("");
  const [courierInput, setCourierInput] = useState("");
  const [customerForm, setCustomerForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  useEffect(() => {
    if (selectedOrder) {
      setCustomerForm({
        name: selectedOrder.customer.name,
        email: selectedOrder.customer.email,
        phone: selectedOrder.customer.phone || "",
        address: selectedOrder.customer.address || "",
      });
      setTrackingInput((selectedOrder as any).trackingNumber || "");
      setCourierInput((selectedOrder as any).courier || "J&T");
      setEditingCustomer(false);
    }
  }, [selectedOrder]);

  const COURIER_OPTIONS = ["J&T", "JNE", "SHOPEE EXPRESS (SPX)", "SiCepat", "Lion Parcel", "Others"];

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

  const handleUpdateStatus = async (orderId: string, newStatus: string, force = false) => {
    setUpdatingStatus(true);
    try {
      const { data } = await axios.patch(`/api/orders/${orderId}`, {
        status: newStatus,
        ...(force && { force: true }),
      });
      if (data.success) {
        toast.success(`Status updated to ${newStatus}`);
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus });
        }
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error || "Failed to update status";
      // If order is already confirmed/expired, offer admin a force-override
      if (err?.response?.status === 400 && msg.includes("sudah dikonfirmasi")) {
        setForceUpdateConfig({ id: orderId, status: newStatus });
        return;
      }
      toast.error(msg);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const confirmForceUpdate = async () => {
    if (!forceUpdateConfig) return;
    const config = forceUpdateConfig;
    setForceUpdateConfig(null);
    await handleUpdateStatus(config.id, config.status, true);
  };

  const confirmDelete = async () => {
    if (!deleteOrderId) return;
    setDeleting(true);
    try {
      const { data } = await axios.delete(`/api/orders/${deleteOrderId}`);
      if (data.success) {
        toast.success("Order deleted successfully");
        setOrders((prev) => prev.filter((o) => o.id !== deleteOrderId));
        if (selectedOrder?.id === deleteOrderId) {
          setSelectedOrder(null);
        }
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to delete order");
    } finally {
      setDeleting(false);
      setDeleteOrderId(null);
    }
  };

  const handleUpdateCustomer = async () => {
    if (!selectedOrder) return;
    setUpdatingStatus(true);
    try {
      const { data } = await axios.patch(`/api/orders/${selectedOrder.id}`, {
        customer: customerForm,
      });
      if (data.success) {
        toast.success(`Customer details updated`);
        const updatedOrder = { ...selectedOrder, customer: { ...selectedOrder.customer, ...customerForm } };
        setSelectedOrder(updatedOrder);
        setOrders((prev) => prev.map((o) => (o.id === selectedOrder.id ? updatedOrder : o)));
        setEditingCustomer(false);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to update customer details");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSaveTracking = async () => {
    if (!selectedOrder) return;
    setSavingTracking(true);
    try {
      const { data } = await axios.patch(`/api/orders/${selectedOrder.id}`, {
        trackingNumber: trackingInput,
        courier: courierInput,
      });
      if (data.success) {
        toast.success(`Tracking details saved!${trackingInput ? " Status updated to SHIPPED." : ""}`);
        const updatedOrder = { 
          ...selectedOrder, 
          trackingNumber: trackingInput, 
          courier: courierInput,
          status: data.data?.status || selectedOrder.status 
        } as any;
        setSelectedOrder(updatedOrder);
        setOrders((prev) => prev.map((o) => (o.id === selectedOrder.id ? { 
          ...o, 
          status: updatedOrder.status, 
          trackingNumber: trackingInput,
          courier: courierInput
        } as any : o)));
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to save tracking number");
    } finally {
      setSavingTracking(false);
    }
  };

  const exportCSV = () => {
    const csvData = orders.map((order) => ({
      "Invoice Number": order.invoiceNumber,
      Customer: order.customer.name,
      Email: order.customer.email,
      Phone: order.customer.phone || "-",
      Status: order.status,
      Subtotal: order.subtotal,
      "Product Discount": order.totalDiscount,
      "Coupon Discount": order.discount,
      PPN: order.taxPpn,
      "PPH 23": order.taxPph23,
      "Unique Code": order.uniqueCode,
      Total: order.totalWithCode,
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
          <p className="text-sm text-brand-500 mt-1">
            {orders.length} orders found
          </p>
        </div>
        <button onClick={exportCSV} className="btn-secondary text-sm self-start sm:self-auto">
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
                <th className="text-left text-xs text-brand-500 uppercase tracking-wider p-4">Invoice</th>
                <th className="p-4 font-semibold text-left">Customer</th>
                <th className="p-4 font-semibold text-left">Total (Inc. Code)</th>
                <th className="p-4 font-semibold text-left">Status</th>
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
                        {order.invoiceNumber}
                      </p>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <p className="text-sm">{order.customer.name}</p>
                        {(order as any).country && (order as any).country !== "ID" && (
                          <span className="w-4 h-3 relative rounded-[2px] overflow-hidden inline-block flex-shrink-0" title={COUNTRY_NAMES[(order as any).country] || (order as any).country}>
                            <Image
                              src={`https://flagcdn.com/w20/${(order as any).country.toLowerCase()}.png`}
                              alt={(order as any).country}
                              fill
                              unoptimized={false}
                              sizes="16px"
                              className="object-cover"
                            />
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-brand-500">{order.customer.email}</p>
                        {(order as any).country && (order as any).country !== "ID" && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded">Intl</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-sm font-medium">
                      {formatCurrency(order.totalWithCode)}
                    </td>
                    <td className="p-4">
                      <span className={`badge text-[10px] ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-brand-400">
                      {new Date(order.createdAt).toLocaleDateString("id-ID")}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="p-2 text-brand-400 hover:text-white transition-colors"
                        title="View Details"
                      >
                        <HiOutlineEye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteOrderId(order.id)}
                        disabled={deleting}
                        className="p-2 text-red-500/70 hover:text-red-400 disabled:opacity-50 transition-colors"
                        title="Delete Order"
                      >
                        <HiOutlineTrash className="w-4 h-4" />
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
          <div className="fixed right-0 top-0 h-screen w-full max-w-md bg-brand-950 border-l border-white/5 z-50 flex flex-col shadow-2xl fade-in">
            {/* Drawer Header - Fixed at Top */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-brand-950/80 backdrop-blur-md z-10">
              <h3 className="text-lg font-bold tracking-tight text-white">{selectedOrder.invoiceNumber}</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => selectedOrder && setDeleteOrderId(selectedOrder.id)}
                  disabled={deleting}
                  className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-red-500 border border-red-500/20 hover:bg-red-500/10 transition-colors disabled:opacity-30"
                >
                  {deleting ? "..." : "Delete"}
                </button>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 text-brand-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar pb-32">
              <div className="space-y-8">
                {/* Status with Update */}
                <section>
                  <h4 className="text-[10px] text-brand-500 uppercase tracking-[0.2em] font-black mb-3">
                    Order Status
                  </h4>
                  <div className="flex items-center gap-3">
                    <select
                      value={selectedOrder.status}
                      onChange={(e) =>
                        handleUpdateStatus(selectedOrder.id, e.target.value)
                      }
                      disabled={updatingStatus}
                      className="input-field text-sm flex-1 bg-brand-900/50 text-white border-b border-white/10 px-2 py-2"
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status} className="bg-brand-950 text-white">
                          {status}
                        </option>
                      ))}
                    </select>
                    <span
                      className={`badge text-[9px] px-2 py-1 flex-shrink-0 ${getStatusColor(
                        selectedOrder.status
                      )}`}
                    >
                      {selectedOrder.status}
                    </span>
                  </div>
                  {updatingStatus && (
                    <p className="text-[10px] text-brand-400 mt-2 animate-pulse">Syncing status...</p>
                  )}
                </section>

                <section>
                  <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
                    <h4 className="text-[10px] text-brand-500 uppercase tracking-[0.2em] font-black">
                      Customer Profile
                    </h4>
                    {!editingCustomer ? (
                      <button
                        onClick={() => setEditingCustomer(true)}
                        className="text-[10px] font-bold text-brand-400 hover:text-white uppercase tracking-widest transition-colors"
                      >
                        Edit
                      </button>
                    ) : (
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setEditingCustomer(false)}
                          className="text-[10px] font-bold text-brand-600 hover:text-brand-400 uppercase tracking-widest"
                          disabled={updatingStatus}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleUpdateCustomer}
                          className="text-[10px] font-bold text-emerald-500 hover:text-emerald-400 uppercase tracking-widest"
                          disabled={updatingStatus}
                        >
                          Save
                        </button>
                      </div>
                    )}
                  </div>

                  {!editingCustomer ? (
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-white">{selectedOrder.customer.name}</p>
                      <p className="text-[11px] text-brand-400 font-mono tracking-tight">{selectedOrder.customer.email}</p>
                      <p className="text-[11px] text-brand-400">{selectedOrder.customer.phone}</p>
                      <p className="text-[11px] text-brand-500 mt-2 leading-relaxed italic">
                        {selectedOrder.customer.address}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={customerForm.name}
                        onChange={(e) => setCustomerForm(prev => ({ ...prev, name: e.target.value }))}
                        className="input-field text-sm w-full bg-white/5 px-2 py-2"
                        placeholder="Name"
                      />
                      <input
                        type="email"
                        value={customerForm.email}
                        onChange={(e) => setCustomerForm(prev => ({ ...prev, email: e.target.value }))}
                        className="input-field text-sm w-full bg-white/5 px-2 py-2 text-brand-300"
                        placeholder="Email"
                      />
                      <input
                        type="text"
                        value={customerForm.phone}
                        onChange={(e) => setCustomerForm(prev => ({ ...prev, phone: e.target.value }))}
                        className="input-field text-sm w-full bg-white/5 px-2 py-2 text-brand-300"
                        placeholder="Phone"
                      />
                      <textarea
                        value={customerForm.address}
                        onChange={(e) => setCustomerForm(prev => ({ ...prev, address: e.target.value }))}
                        className="input-field text-sm w-full min-h-[80px] bg-white/5 px-2 py-2 text-brand-300"
                        placeholder="Shipping Address"
                      />
                    </div>
                  )}
                </section>

                <section>
                  <h4 className="text-[10px] text-brand-500 uppercase tracking-[0.2em] font-black mb-4">
                    Items Order
                  </h4>
                  <div className="space-y-4">
                    {selectedOrder.items.map((item) => (
                      <div key={item.id} className="flex gap-4 p-2 hover:bg-white/[0.02] transition-colors rounded-lg">
                        <div className="w-12 h-16 bg-brand-900 flex-shrink-0 overflow-hidden border border-white/5">
                          <img
                            src={item.product.images[0]?.url || "/placeholder.svg"}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-bold text-white truncate">{item.product.name}</p>
                          <p className="text-[10px] text-brand-500 font-mono mt-1">
                            {item.size} <span className="mx-1 opacity-30">/</span> {item.quantity} QTY
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[13px] font-bold text-white">
                            {formatCurrency(item.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="bg-white/[0.02] p-5 border border-white/5 space-y-3">
                  <div className="flex justify-between text-[11px] uppercase tracking-wider">
                    <span className="text-brand-500">Subtotal</span>
                    <span className="text-brand-300 font-mono">{formatCurrency(selectedOrder.subtotal)}</span>
                  </div>
                  {selectedOrder.totalDiscount > 0 && (
                    <div className="flex justify-between text-[11px] uppercase tracking-wider text-green-500">
                      <span>Product Discount</span>
                      <span className="font-mono">-{formatCurrency(selectedOrder.totalDiscount)}</span>
                    </div>
                  )}
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between text-[11px] uppercase tracking-wider text-green-500">
                      <span>Coupon Discount</span>
                      <span className="font-mono">-{formatCurrency(selectedOrder.discount)}</span>
                    </div>
                  )}
                  {selectedOrder.taxPpn > 0 && (
                    <div className="flex justify-between text-[11px] uppercase tracking-wider">
                      <span className="text-brand-500">PPN</span>
                      <span className="text-brand-300 font-mono">+{formatCurrency(selectedOrder.taxPpn)}</span>
                    </div>
                  )}
                  {selectedOrder.taxPph23 > 0 && (
                    <div className="flex justify-between text-[11px] uppercase tracking-wider">
                      <span className="text-brand-500">PPH 23</span>
                      <span className="text-brand-300 font-mono">+{formatCurrency(selectedOrder.taxPph23)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-black text-xl pt-3 border-t border-white/10">
                    <span className="text-white tracking-tight italic">GRAND TOTAL</span>
                    <span className="text-white font-mono">{formatCurrency(selectedOrder.totalWithCode)}</span>
                  </div>
                  <div className="flex justify-between text-[9px] text-brand-600 uppercase tracking-widest font-black pt-1">
                    <span>UNIQUE CODE REDEMPTION</span>
                    <span>+{selectedOrder.uniqueCode}</span>
                  </div>
                </section>

                {selectedOrder.payment && (
                  <section className="border-t border-white/5 pt-6">
                    <h4 className="text-[10px] text-brand-500 uppercase tracking-[0.2em] font-black mb-4">
                      Payment Verification
                    </h4>
                    <div className="space-y-3 bg-brand-900/20 p-4 rounded-lg border border-white/5">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-brand-600 uppercase font-black">Method</span>
                        <span className="text-xs text-white font-bold">{selectedOrder.payment.method || "-"}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-brand-600 uppercase font-black">Secure Status</span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded ${getStatusColor(selectedOrder.payment.status)}`}>
                          {selectedOrder.payment.status}
                        </span>
                      </div>
                      {(selectedOrder.payment as any).currencyAmount && (
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-brand-600 uppercase font-black">USD Equivalent</span>
                          <span className="text-xs text-brand-400 font-mono">{formatUSD((selectedOrder.payment as any).currencyAmount)}</span>
                        </div>
                      )}
                      {selectedOrder.payment.paidAt && (
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-brand-600 uppercase font-black">Timestamp</span>
                          <span className="text-[10px] text-brand-500 font-mono">{new Date(selectedOrder.payment.paidAt).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                    {(selectedOrder as any).country && (
                       <div className="mt-4 flex items-center justify-between p-3 bg-white/[0.02] border border-white/5">
                          <span className="text-[10px] text-brand-600 uppercase font-black tracking-widest">Origin</span>
                          <div className="flex items-center gap-2">
                             <span className="w-5 h-3.5 relative rounded-[2px] overflow-hidden inline-block shadow-sm">
                              <Image
                                src={`https://flagcdn.com/w20/${(selectedOrder as any).country.toLowerCase()}.png`}
                                alt={(selectedOrder as any).country}
                                fill
                                unoptimized={false}
                                sizes="20px"
                                className="object-cover"
                              />
                            </span>
                            <span className="text-[11px] font-bold text-brand-300">
                              {COUNTRY_NAMES[(selectedOrder as any).country] || (selectedOrder as any).country}
                            </span>
                          </div>
                       </div>
                    )}
                  </section>
                )}

                {/* AWB / Tracking Number */}
                <section className="border-t border-white/5 pt-6 pb-12">
                  <h4 className="text-[10px] text-brand-500 uppercase tracking-[0.2em] font-black mb-4 flex items-center gap-2">
                    🚚 Shipment Logistics
                  </h4>
                  <div className="space-y-4 bg-brand-900/10 p-5 border border-dashed border-white/10">
                    <div className="space-y-2">
                      <label className="text-[9px] text-brand-600 uppercase font-black tracking-widest">Courier / Ekspedisi</label>
                      <select
                        value={courierInput}
                        onChange={(e) => setCourierInput(e.target.value)}
                        className="input-field text-xs w-full bg-brand-950 text-white border-b border-white/10 focus:border-white/40 px-0 py-2.5 transition-all outline-none"
                      >
                        {COURIER_OPTIONS.map(c => (
                          <option key={c} value={c} className="bg-brand-950 text-white py-2">{c}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] text-brand-600 uppercase font-black tracking-widest">Tracking Number (AWB/Resi)</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={trackingInput}
                          onChange={(e) => setTrackingInput(e.target.value.toUpperCase())}
                          className="input-field text-sm flex-1 font-mono bg-transparent border-b border-white/10 focus:border-white/40 px-0 transition-all outline-none"
                          placeholder="INPUT NO. RESI..."
                        />
                        <button
                          onClick={handleSaveTracking}
                          disabled={savingTracking}
                          className="px-5 py-2 text-[10px] font-black uppercase tracking-widest text-white bg-emerald-600 hover:bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-all disabled:opacity-30"
                        >
                          {savingTracking ? "..." : "Update"}
                        </button>
                      </div>
                    </div>
                  </div>
                  {(selectedOrder as any).trackingNumber && (
                    <div className="mt-4 flex items-center gap-2 px-3 py-2 bg-emerald-500/5 border border-emerald-500/10">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                      <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">
                        {(selectedOrder as any).courier} — {(selectedOrder as any).trackingNumber}
                      </p>
                    </div>
                  )}
                  <p className="text-[9px] text-brand-600 mt-4 leading-relaxed font-medium">
                    * Memasukkan nomor resi akan secara otomatis memicu notifikasi pengiriman dan mengubah status pesanan ke <span className="text-brand-400">SHIPPED</span>.
                  </p>
                </section>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Confirmation Modals */}
      <ConfirmModal
        isOpen={!!deleteOrderId}
        onClose={() => setDeleteOrderId(null)}
        onConfirm={confirmDelete}
        title="Delete Order"
        message="Are you sure you want to permanently delete this order? This action cannot be undone."
        confirmText="Delete Order"
        isDestructive={true}
        isLoading={deleting}
      />

      <ConfirmModal
        isOpen={!!forceUpdateConfig}
        onClose={() => setForceUpdateConfig(null)}
        onConfirm={confirmForceUpdate}
        title="Force Update Status"
        message={`⚠️ Order ini tidak dalam status UNPAID.\n\nPaksa konfirmasi tetap akan:\n• Set status → ${forceUpdateConfig?.status || 'PAID'}\n• Kurangi stok (jika belum berkurang)\n• Update payment record\n\nLanjutkan?`}
        confirmText="Force Update"
      />
    </div>
  );
}
