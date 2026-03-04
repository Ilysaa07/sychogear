"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { formatCurrency } from "@/lib/utils";
import type { CustomerWithStats } from "@/types";
import toast from "react-hot-toast";

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerWithStats[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
        <p className="text-sm text-brand-500 mt-1">
          {customers.length} customers total
        </p>
      </div>

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
                    colSpan={5}
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
