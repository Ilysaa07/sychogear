"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { formatCurrency } from "@/lib/utils";
import type { DashboardStats } from "@/types";
import Link from "next/link";
import {
  HiOutlineChartBar,
  HiOutlineShoppingCart,
  HiOutlineClock,
  HiOutlineCube,
} from "react-icons/hi";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await axios.get("/api/analytics");
        if (data.success) setStats(data.data);
      } catch {
        console.error("Failed to fetch stats");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="admin-card p-6">
              <div className="h-4 bg-white/5 w-24 mb-3 rounded animate-pulse" />
              <div className="h-8 bg-white/5 w-32 rounded animate-pulse" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="admin-card p-6 h-80 rounded bg-white/5 animate-pulse" />
          <div className="admin-card p-6 h-80 rounded bg-white/5 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!stats) return <p className="text-[var(--admin-muted)]">Failed to load dashboard</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard Overview</h1>
          <p className="text-sm text-[var(--admin-muted)] mt-1">Here's what's happening in your store today.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="admin-card p-5 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex justify-between items-start mb-4">
              <p className="text-sm font-medium text-[var(--admin-muted)]">Total Revenue</p>
              <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                <HiOutlineChartBar className="w-5 h-5" />
              </div>
            </div>
            <div>
              <p className="text-3xl font-bold text-white tracking-tight">{formatCurrency(stats.totalRevenue)}</p>
              <p className="text-xs text-[var(--admin-muted)] mt-2">All-time revenue</p>
            </div>
          </div>
        </div>

        <div className="admin-card p-5 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex justify-between items-start mb-4">
              <p className="text-sm font-medium text-[var(--admin-muted)]">Total Orders</p>
              <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                <HiOutlineShoppingCart className="w-5 h-5" />
              </div>
            </div>
            <div>
              <p className="text-3xl font-bold text-white tracking-tight">{stats.totalOrders}</p>
              <p className="text-xs text-[var(--admin-muted)] mt-2">Paid and unpaid</p>
            </div>
          </div>
        </div>

        <div className="admin-card p-5 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex justify-between items-start mb-4">
              <p className="text-sm font-medium text-[var(--admin-muted)]">Unpaid Orders</p>
              <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
                <HiOutlineClock className="w-5 h-5" />
              </div>
            </div>
            <div>
              <p className="text-3xl font-bold text-white tracking-tight">{stats.unpaidOrders}</p>
              <p className="text-xs text-[var(--admin-muted)] mt-2">Awaiting full payment</p>
            </div>
          </div>
        </div>

        <div className="admin-card p-5 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex justify-between items-start mb-4">
              <p className="text-sm font-medium text-[var(--admin-muted)]">Total Products</p>
              <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                <HiOutlineCube className="w-5 h-5" />
              </div>
            </div>
            <div>
              <p className="text-3xl font-bold text-white tracking-tight">{stats.totalProducts}</p>
              <p className="text-xs text-[var(--admin-muted)] mt-2">In catalog</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="admin-card p-6">
          <h3 className="text-sm font-semibold mb-6 text-[var(--admin-muted)]">
            Revenue per Month
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={stats.revenueByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  color: "#f8fafc",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Orders Chart */}
        <div className="admin-card p-6">
          <h3 className="text-sm font-semibold mb-6 text-[var(--admin-muted)]">
            Orders per Month
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={stats.ordersByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  color: "#f8fafc",
                  fontSize: "12px",
                }}
              />
              <Line
                type="monotone"
                dataKey="orders"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ fill: "#10b981", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="admin-card overflow-hidden">
        <div className="p-5 border-b border-[var(--admin-border)] flex items-center justify-between">
          <h2 className="text-base font-semibold">Recent Orders</h2>
          <Link href="/admin/orders" className="text-sm text-[var(--admin-accent)] hover:text-[var(--admin-accent-hover)] font-medium transition-colors">
            View All
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--admin-border)] bg-[var(--admin-bg)]/50">
                <th className="px-5 py-3 text-xs font-semibold text-[var(--admin-muted)] tracking-wider">Order ID</th>
                <th className="px-5 py-3 text-xs font-semibold text-[var(--admin-muted)] tracking-wider">Customer</th>
                <th className="px-5 py-3 text-xs font-semibold text-[var(--admin-muted)] tracking-wider">Date</th>
                <th className="px-5 py-3 text-xs font-semibold text-[var(--admin-muted)] tracking-wider">Status</th>
                <th className="px-5 py-3 text-xs font-semibold text-[var(--admin-muted)] tracking-wider text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {!stats.recentOrders || stats.recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-sm text-[var(--admin-muted)]">
                    No orders found
                  </td>
                </tr>
              ) : (
                stats.recentOrders.map((order: any) => (
                  <tr key={order.id} className="border-b border-[var(--admin-border)] hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3 whitespace-nowrap">
                      <Link href={`/admin/orders/${order.id}`} className="text-sm font-mono font-medium text-[var(--admin-accent)] hover:underline">
                        {order.invoiceNumber || order.id.slice(-6).toUpperCase()}
                      </Link>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium">{order.customerName}</div>
                      <div className="text-xs text-[var(--admin-muted)]">{order.email}</div>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-sm text-[var(--admin-muted)]">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span className={`admin-badge ${
                        order.status === 'PAID' ? 'admin-badge-success' : 
                        order.status === 'PENDING' ? 'admin-badge-warning' : 
                        'admin-badge-neutral'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-sm font-medium text-right">
                      {formatCurrency(order.totalAmount)}
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
