"use client";

import { useState, useEffect, use } from "react";
import axios from "axios";
import { formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";
import { HiOutlineDownload, HiOutlineEye, HiOutlineTrash, HiOutlinePlus, HiOutlineCloudUpload, HiArrowLeft } from "react-icons/hi";
import Papa from "papaparse";
import Link from "next/link";
import { useRouter } from "next/navigation";

const STATUS_FILTERS = [
  "ALL",
  "PENDING",
  "DP_PAID",
  "FULL_PAID",
  "CANCELLED",
];

export default function CampaignDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const campaignId = resolvedParams.id;
  const router = useRouter();
  
  const [campaign, setCampaign] = useState<any>(null);
  const [preOrders, setPreOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchCampaignDetails();
  }, [campaignId]);

  useEffect(() => {
    if (campaign) {
      fetchPreOrders();
    }
  }, [campaign, statusFilter]);

  const fetchCampaignDetails = async () => {
    try {
      const { data } = await axios.get(`/api/admin/pre-orders/campaigns/${campaignId}`);
      setCampaign(data.data);
    } catch {
      toast.error("Failed to fetch campaign details");
      router.push("/admin/pre-orders");
    }
  };

  const fetchPreOrders = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/admin/pre-orders?campaignId=${campaignId}`);
      let filtered = data.data;
      if (statusFilter !== "ALL") {
        filtered = filtered.filter((po: any) => po.status === statusFilter);
      }
      setPreOrders(filtered);
    } catch {
      toast.error("Failed to fetch pre-orders");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/admin/pre-orders?campaignId=${campaignId}&search=${search}`);
      let filtered = data.data;
      if (statusFilter !== "ALL") {
        filtered = filtered.filter((po: any) => po.status === statusFilter);
      }
      setPreOrders(filtered);
    } catch {
      toast.error("Failed to search");
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this pre-order?")) return;
    setDeleting(true);
    try {
      const { data } = await axios.delete(`/api/admin/pre-orders/${id}`);
      if (data.success) {
        toast.success("Pre-order deleted");
        setPreOrders((prev) => prev.filter((o) => o.id !== id));
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };



  const exportCSV = () => {
    const csvData = preOrders.map((order) => {
      const totalPcs = order.items.reduce((acc: number, item: any) => acc + item.quantity, 0);
      return {
        "PO Number": order.preOrderNumber,
        Customer: order.customerName,
        WhatsApp: order.whatsapp,
        Status: order.status,
        "Total Items": totalPcs,
        "DP Amount": order.dpAmount,
        "Total Amount": order.totalAmount,
        "Date": new Date(order.orderDate).toLocaleDateString(),
      };
    });

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${campaign?.name.replace(/\s+/g, '-')}-preorders-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported!");
  };

  if (!campaign) {
    return <div className="p-8 text-center animate-pulse text-[var(--admin-muted)]">Loading Campaign...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/pre-orders" className="text-sm text-[var(--admin-muted)] hover:text-white flex items-center mb-4 transition-colors">
          <HiArrowLeft className="mr-2" /> Back to Campaigns
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{campaign.name}</h1>
            <p className="text-sm text-[var(--admin-muted)] mt-1">
              {preOrders.length} pre-orders found for this campaign
            </p>
          </div>
          <div className="flex flex-wrap gap-2">

            <button onClick={exportCSV} className="admin-btn-secondary text-sm flex items-center bg-[var(--admin-card)]">
              <HiOutlineDownload className="w-4 h-4 mr-2" />
              Export CSV
            </button>
            <Link href={`/admin/pre-orders/create?campaignId=${campaignId}`} className="admin-btn-primary text-sm flex items-center">
              <HiOutlinePlus className="w-4 h-4 mr-2" />
              Add Order
            </Link>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors border ${
                statusFilter === status
                  ? "bg-white text-black border-white"
                  : "bg-[var(--admin-card)] text-[var(--admin-muted)] border-[var(--admin-border)] hover:bg-[var(--admin-bg)] hover:text-white"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
        
        <form onSubmit={handleSearch} className="flex gap-2">
          <input 
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search WA, Name, or PO..."
            className="admin-input text-sm w-full sm:w-64"
          />
          <button type="submit" className="admin-btn-secondary px-4 text-sm">Search</button>
        </form>
      </div>

      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--admin-border)] bg-[var(--admin-bg)]/50">
                <th className="px-5 py-3 text-xs font-semibold text-[var(--admin-muted)] tracking-wider">PO Number</th>
                <th className="px-5 py-3 text-xs font-semibold text-[var(--admin-muted)] tracking-wider">Customer</th>
                <th className="px-5 py-3 text-xs font-semibold text-[var(--admin-muted)] tracking-wider">Items</th>
                <th className="px-5 py-3 text-xs font-semibold text-[var(--admin-muted)] tracking-wider">Financials</th>
                <th className="px-5 py-3 text-xs font-semibold text-[var(--admin-muted)] tracking-wider">Status</th>
                <th className="px-5 py-3 text-xs font-semibold text-[var(--admin-muted)] tracking-wider">Date</th>
                <th className="px-5 py-3 text-xs font-semibold text-[var(--admin-muted)] tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-[var(--admin-border)]">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-5 py-4"><div className="h-4 bg-white/5 w-24 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : preOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-[var(--admin-muted)] text-sm">
                    No pre-orders found in this campaign
                  </td>
                </tr>
              ) : (
                preOrders.map((order) => {
                  const totalPcs = order.items.reduce((acc: number, item: any) => acc + item.quantity, 0);
                  return (
                    <tr
                      key={order.id}
                      className="border-b border-[var(--admin-border)] hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold font-mono text-white">
                          {order.preOrderNumber}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-medium">{order.customerName}</p>
                        <p className="text-xs text-[var(--admin-muted)] font-mono">{order.whatsapp}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold">{totalPcs} Pcs</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-white">{formatCurrency(order.totalAmount)}</p>
                        <p className="text-xs text-amber-400">DP: {formatCurrency(order.dpAmount)}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`admin-badge ${
                          order.status === 'FULL_PAID' ? 'admin-badge-success' : 
                          order.status === 'DP_PAID' ? 'admin-badge-warning' : 
                          order.status === 'CANCELLED' ? 'admin-badge-danger' :
                          'admin-badge-neutral'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-[var(--admin-muted)]">
                        {new Date(order.orderDate).toLocaleDateString("id-ID")}
                      </td>
                      <td className="px-5 py-4 text-right space-x-2 whitespace-nowrap">
                        <Link
                          href={`/admin/pre-orders/${order.id}`}
                          className="inline-block p-2 text-[var(--admin-muted)] hover:text-[var(--admin-accent)] bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                          title="Edit Details"
                        >
                          <HiOutlineEye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => confirmDelete(order.id)}
                          disabled={deleting}
                          className="p-2 text-red-400/80 hover:text-red-400 disabled:opacity-50 transition-colors bg-red-500/10 hover:bg-red-500/20 rounded-lg"
                          title="Delete"
                        >
                          <HiOutlineTrash className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
