"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { formatCurrency } from "@/lib/utils";
import type { CustomerWithStats } from "@/types";
import toast from "react-hot-toast";
import { HiOutlinePencil, HiOutlineTrash, HiOutlineX } from "react-icons/hi";
import ConfirmModal from "@/components/admin/ConfirmModal";

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCustomer, setEditingCustomer] = useState<CustomerWithStats | null>(null);
  const [deleteCustomerId, setDeleteCustomerId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", address: "" });

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const { data } = await axios.get("/api/customers");
        if (data.success) setCustomers(data.data);
      } catch {
        toast.error("Failed to fetch customers");
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, []);

  const openEditForm = (c: CustomerWithStats) => {
    setEditingCustomer(c);
    setFormData({ name: c.name, email: c.email, phone: c.phone || "", address: c.address || "" });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    setSubmitting(true);
    try {
      const { data } = await axios.put(`/api/customers/${editingCustomer.id}`, formData);
      if (data.success) {
        toast.success("Customer updated");
        setCustomers(prev => prev.map(c => c.id === editingCustomer.id ? { ...c, ...formData } : c));
        setEditingCustomer(null);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to update customer");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteCustomerId) return;
    setSubmitting(true);
    try {
      const { data } = await axios.delete(`/api/customers/${deleteCustomerId}`);
      if (data.success) {
        toast.success("Customer deleted");
        setCustomers(prev => prev.filter(c => c.id !== deleteCustomerId));
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to delete customer");
    } finally {
      setSubmitting(false);
      setDeleteCustomerId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
        <p className="text-sm text-brand-500 mt-1">
          {customers.length} customers total
        </p>
      </div>

      {editingCustomer && (
        <form onSubmit={handleUpdate} className="card p-6 space-y-4 fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">Edit Customer</h3>
            <button
              type="button"
              onClick={() => setEditingCustomer(null)}
              className="p-1 text-brand-400 hover:text-white transition-colors"
            >
              <HiOutlineX className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-brand-400 uppercase tracking-wider mb-2">Name</label>
              <input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-brand-400 uppercase tracking-wider mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-brand-400 uppercase tracking-wider mb-2">Phone</label>
              <input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input-field"
                placeholder="Optional"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-brand-400 uppercase tracking-wider mb-2">Address</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="input-field min-h-[80px]"
              placeholder="Optional"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setEditingCustomer(null)}
              className="btn-secondary text-sm"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary text-sm"
            >
              {submitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-xs text-brand-500 uppercase tracking-wider p-4">
                  Customer
                </th>
                <th className="text-left text-xs text-brand-500 uppercase tracking-wider p-4">
                  Phone
                </th>
                <th className="text-left text-xs text-brand-500 uppercase tracking-wider p-4">
                  Total Orders
                </th>
                <th className="text-left text-xs text-brand-500 uppercase tracking-wider p-4">
                  Total Spending
                </th>
                <th className="text-left text-xs text-brand-500 uppercase tracking-wider p-4">
                  Joined
                </th>
                <th className="text-right text-xs text-brand-500 uppercase tracking-wider p-4">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/5">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="p-4">
                        <div className="h-4 skeleton w-24 rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : customers.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-10 text-brand-500 text-sm"
                  >
                    No customers yet
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="border-b border-white/5 hover:bg-white/[.02] transition-colors"
                  >
                    <td className="p-4">
                      <p className="text-sm font-medium">{customer.name}</p>
                      <p className="text-xs text-brand-500">{customer.email}</p>
                    </td>
                    <td className="p-4 text-sm text-brand-400">
                      {customer.phone || "-"}
                    </td>
                    <td className="p-4 text-sm">{customer.totalOrders}</td>
                    <td className="p-4 text-sm font-medium">
                      {formatCurrency(customer.totalSpending)}
                    </td>
                    <td className="p-4 text-sm text-brand-400">
                      {new Date(customer.createdAt).toLocaleDateString("id-ID")}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditForm(customer)}
                          className="p-2 text-brand-400 hover:text-white transition-colors"
                          title="Edit"
                        >
                          <HiOutlinePencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteCustomerId(customer.id)}
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

      <ConfirmModal
        isOpen={!!deleteCustomerId}
        onClose={() => setDeleteCustomerId(null)}
        onConfirm={confirmDelete}
        title="Delete Customer"
        message="Are you sure you want to completely remove this customer? This action cannot be undone.\n\nNote: You CANNOT delete customers that have existing past orders. Doing so destroys accounting trails. Delete their orders first if you must."
        confirmText="Delete Customer"
        isDestructive={true}
        isLoading={submitting}
      />
    </div>
  );
}
