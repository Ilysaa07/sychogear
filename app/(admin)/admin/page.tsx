"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { formatCurrency, calculatePercentageGrowth } from "@/lib/utils";
import type { DashboardStats } from "@/types";
import {
  HiOutlineCurrencyDollar,
  HiOutlineClipboardList,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineUsers,
  HiArrowUp,
  HiArrowDown,
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
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card p-6">
              <div className="h-4 skeleton w-24 mb-3 rounded" />
              <div className="h-8 skeleton w-32 rounded" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-6 h-80 skeleton rounded" />
          <div className="card p-6 h-80 skeleton rounded" />
        </div>
      </div>
    );
  }

  if (!stats) return <p className="text-brand-400">Failed to load dashboard</p>;

  const statCards = [
    {
      label: "Total Revenue",
      value: formatCurrency(stats.totalRevenue),
      icon: HiOutlineCurrencyDollar,
      growth: stats.revenueGrowth,
    },
    {
      label: "Total Orders",
      value: stats.totalOrders.toString(),
      icon: HiOutlineClipboardList,
    },
    {
      label: "Unpaid Orders",
      value: stats.unpaidOrders.toString(),
      icon: HiOutlineClock,
    },
    {
      label: "Paid Orders",
      value: stats.paidOrders.toString(),
      icon: HiOutlineCheckCircle,
    },
    {
      label: "Customers",
      value: stats.totalCustomers.toString(),
      icon: HiOutlineUsers,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-brand-500 mt-1">Overview of your store</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-brand-500 uppercase tracking-wider">
                {card.label}
              </span>
              <card.icon className="w-5 h-5 text-brand-600" />
            </div>
            <p className="text-2xl font-bold">{card.value}</p>
            {card.growth !== undefined && (
              <div className="flex items-center gap-1 mt-2">
                {card.growth >= 0 ? (
                  <HiArrowUp className="w-3 h-3 text-green-400" />
                ) : (
                  <HiArrowDown className="w-3 h-3 text-red-400" />
                )}
                <span
                  className={`text-xs font-medium ${
                    card.growth >= 0 ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {Math.abs(card.growth)}% vs last month
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="card p-6">
          <h3 className="text-sm font-semibold mb-6 uppercase tracking-wider text-brand-400">
            Revenue per Month
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={stats.revenueByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
              <XAxis dataKey="month" stroke="#525252" fontSize={11} />
              <YAxis stroke="#525252" fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#171717",
                  border: "1px solid #262626",
                  borderRadius: "0",
                  color: "#fafafa",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="revenue" fill="#fafafa" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Orders Chart */}
        <div className="card p-6">
          <h3 className="text-sm font-semibold mb-6 uppercase tracking-wider text-brand-400">
            Orders per Month
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={stats.ordersByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
              <XAxis dataKey="month" stroke="#525252" fontSize={11} />
              <YAxis stroke="#525252" fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#171717",
                  border: "1px solid #262626",
                  borderRadius: "0",
                  color: "#fafafa",
                  fontSize: "12px",
                }}
              />
              <Line
                type="monotone"
                dataKey="orders"
                stroke="#fafafa"
                strokeWidth={2}
                dot={{ fill: "#fafafa", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
