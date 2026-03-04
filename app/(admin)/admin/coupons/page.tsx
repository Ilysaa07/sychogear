"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";
import {
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineX,
} from "react-icons/hi";

interface Coupon {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
  minPurchase: number;
  maxDiscount: number | null;
  usageLimit: number | null;
  usageCount: number;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
}

const EMPTY_FORM = {
  code: "",
  discountType: "PERCENTAGE" as "PERCENTAGE" | "FIXED",
  discountValue: "",
  minPurchase: "0",
  maxDiscount: "",
  usageLimit: "",
  isActive: true,
  expiresAt: "",
};

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ ...EMPTY_FORM });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const { data } = await axios.get("/api/coupons");
      if (data.success) setCoupons(data.data);
    } catch {
      toast.error("Failed to fetch coupons");
    } finally {
      setLoading(false);
    }
  };

  const openCreateForm = () => {
    setEditingId(null);
    setFormData({ ...EMPTY_FORM });
    setShowForm(true);
  };

  const openEditForm = (coupon: Coupon) => {
    setEditingId(coupon.id);
    setFormData({
      code: coupon.code,
      discountType: coupon.discountType as "PERCENTAGE" | "FIXED",
      discountValue: String(coupon.discountValue),
      minPurchase: String(coupon.minPurchase),
      maxDiscount: coupon.maxDiscount ? String(coupon.maxDiscount) : "",
      usageLimit: coupon.usageLimit ? String(coupon.usageLimit) : "",
      isActive: coupon.isActive,
      expiresAt: coupon.expiresAt
        ? new Date(coupon.expiresAt).toISOString().slice(0, 16)
        : "",
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ ...EMPTY_FORM });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        code: formData.code.toUpperCase(),
        discountType: formData.discountType,
        discountValue: Number(formData.discountValue),
        minPurchase: Number(formData.minPurchase) || 0,
        maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : null,
        usageLimit: formData.usageLimit ? Number(formData.usageLimit) : null,
        isActive: formData.isActive,
        expiresAt: formData.expiresAt || null,
      };

      if (editingId) {
        const { data } = await axios.put(`/api/coupons/${editingId}`, payload);
        if (data.success) {
          toast.success("Coupon updated!");
          closeForm();
          fetchCoupons();
        }
      } else {
        const { data } = await axios.post("/api/coupons", payload);
        if (data.success) {
          toast.success("Coupon created!");
          closeForm();
          fetchCoupons();
        }
      }
    } catch {
      toast.error(editingId ? "Failed to update coupon" : "Failed to create coupon");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus kupon ini?")) return;
    try {
      await axios.delete(`/api/coupons/${id}`);
      toast.success("Coupon deleted");
      fetchCoupons();
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Coupons</h1>
          <p className="text-sm text-brand-500 mt-1">
            {coupons.length} coupons total
          </p>
        </div>
        <button onClick={openCreateForm} className="btn-primary text-sm self-start sm:self-auto">
          <HiOutlinePlus className="w-4 h-4 mr-2" />
          Add Coupon
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card p-6 space-y-4 fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">
              {editingId ? "Edit Coupon" : "New Coupon"}
            </h3>
            <button
              type="button"
              onClick={closeForm}
              className="p-1 text-brand-400 hover:text-white transition-colors"
            >
              <HiOutlineX className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-brand-400 uppercase tracking-wider mb-2">
                Code
              </label>
              <input
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value.toUpperCase() })
                }
                className="input-field"
                placeholder="SALE20"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-brand-400 uppercase tracking-wider mb-2">
                Type
              </label>
              <select
                value={formData.discountType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    discountType: e.target.value as "PERCENTAGE" | "FIXED",
                  })
                }
                className="input-field"
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed Amount (Rp)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-brand-400 uppercase tracking-wider mb-2">
                Value
              </label>
              <input
                type="number"
                value={formData.discountValue}
                onChange={(e) =>
                  setFormData({ ...formData, discountValue: e.target.value })
                }
                className="input-field"
                placeholder={formData.discountType === "PERCENTAGE" ? "20" : "50000"}
                required
              />
            </div>
            <div>
              <label className="block text-xs text-brand-400 uppercase tracking-wider mb-2">
                Min Purchase (Rp)
              </label>
              <input
                type="number"
                value={formData.minPurchase}
                onChange={(e) =>
                  setFormData({ ...formData, minPurchase: e.target.value })
                }
                className="input-field"
                placeholder="100000"
              />
            </div>
            <div>
              <label className="block text-xs text-brand-400 uppercase tracking-wider mb-2">
                Max Discount (Rp)
              </label>
              <input
                type="number"
                value={formData.maxDiscount}
                onChange={(e) =>
                  setFormData({ ...formData, maxDiscount: e.target.value })
                }
                className="input-field"
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="block text-xs text-brand-400 uppercase tracking-wider mb-2">
                Usage Limit
              </label>
              <input
                type="number"
                value={formData.usageLimit}
                onChange={(e) =>
                  setFormData({ ...formData, usageLimit: e.target.value })
                }
                className="input-field"
                placeholder="Unlimited"
              />
            </div>
            <div>
              <label className="block text-xs text-brand-400 uppercase tracking-wider mb-2">
                Expires At
              </label>
              <input
                type="datetime-local"
                value={formData.expiresAt}
                onChange={(e) =>
                  setFormData({ ...formData, expiresAt: e.target.value })
                }
                className="input-field"
              />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="w-4 h-4"
                />
                Active
              </label>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary text-sm"
            >
              {submitting
                ? "Saving..."
                : editingId
                ? "Update Coupon"
                : "Create Coupon"}
            </button>
            <button
              type="button"
              onClick={closeForm}
              className="btn-secondary text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-xs text-brand-500 uppercase tracking-wider p-4">Code</th>
                <th className="text-left text-xs text-brand-500 uppercase tracking-wider p-4">Discount</th>
                <th className="text-left text-xs text-brand-500 uppercase tracking-wider p-4">Min Purchase</th>
                <th className="text-left text-xs text-brand-500 uppercase tracking-wider p-4">Usage</th>
                <th className="text-left text-xs text-brand-500 uppercase tracking-wider p-4">Status</th>
                <th className="text-left text-xs text-brand-500 uppercase tracking-wider p-4">Expires</th>
                <th className="text-right text-xs text-brand-500 uppercase tracking-wider p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/5">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="p-4"><div className="h-4 skeleton w-16 rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : coupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-brand-500 text-sm">
                    No coupons yet
                  </td>
                </tr>
              ) : (
                coupons.map((coupon) => (
                  <tr key={coupon.id} className="border-b border-white/5 hover:bg-white/[.02] transition-colors">
                    <td className="p-4 font-mono text-sm font-bold">{coupon.code}</td>
                    <td className="p-4 text-sm">
                      {coupon.discountType === "PERCENTAGE"
                        ? `${coupon.discountValue}%`
                        : formatCurrency(coupon.discountValue)}
                    </td>
                    <td className="p-4 text-sm text-brand-400">
                      {formatCurrency(coupon.minPurchase)}
                    </td>
                    <td className="p-4 text-sm">
                      {coupon.usageCount}/{coupon.usageLimit || "∞"}
                    </td>
                    <td className="p-4">
                      <span className={`badge text-[10px] ${
                        coupon.isActive ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                      }`}>
                        {coupon.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-brand-400">
                      {coupon.expiresAt
                        ? new Date(coupon.expiresAt).toLocaleDateString("id-ID")
                        : "Never"}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditForm(coupon)}
                          className="p-2 text-brand-400 hover:text-white transition-colors"
                          title="Edit"
                        >
                          <HiOutlinePencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(coupon.id)}
                          className="p-2 text-brand-400 hover:text-red-400 transition-colors"
                          title="Delete"
                        >
                          <HiOutlineTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
