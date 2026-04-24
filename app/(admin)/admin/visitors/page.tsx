"use client";

import { useState, useEffect, useCallback } from "react";
import {
  HiOutlineGlobeAlt,
  HiOutlineDesktopComputer,
  HiOutlineDeviceMobile,
  HiOutlineRefresh,
  HiOutlineEye,
  HiOutlineUsers,
  HiOutlineLocationMarker,
  HiOutlineClock,
} from "react-icons/hi";

interface VisitorLog {
  id: string;
  sessionId: string;
  ip: string | null;
  country: string | null;
  city: string | null;
  device: string | null;
  browser: string | null;
  os: string | null;
  page: string;
  referrer: string | null;
  createdAt: string;
}

interface VisitorData {
  logs: VisitorLog[];
  total: number;
  todayCount: number;
  uniqueSessions: number;
  topPages: { page: string; count: number }[];
  topCountries: { country: string; count: number }[];
}

const DAYS_OPTIONS = [
  { label: "Hari Ini", value: 1 },
  { label: "7 Hari", value: 7 },
  { label: "30 Hari", value: 30 },
];

function DeviceIcon({ device }: { device: string | null }) {
  if (device === "Mobile") return <HiOutlineDeviceMobile className="w-3.5 h-3.5" />;
  if (device === "Tablet") return <HiOutlineDeviceMobile className="w-3.5 h-3.5 rotate-90" />;
  return <HiOutlineDesktopComputer className="w-3.5 h-3.5" />;
}

function BrowserDot({ browser }: { browser: string | null }) {
  const colors: Record<string, string> = {
    Chrome: "#4285F4",
    Firefox: "#FF7139",
    Safari: "#006CFF",
    Edge: "#0078D4",
    Opera: "#FF1B2D",
    IE: "#1EBBEE",
    Other: "#6b7280",
  };
  const color = colors[browser || "Other"] || colors.Other;
  return (
    <span
      className="inline-block w-2 h-2 rounded-full flex-shrink-0"
      style={{ backgroundColor: color }}
    />
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "baru saja";
  if (minutes < 60) return `${minutes} mnt lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  return `${days} hari lalu`;
}

export default function AdminVisitorsPage() {
  const [data, setData] = useState<VisitorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(1);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = useCallback(
    async (showSpinner = false) => {
      if (showSpinner) setIsRefreshing(true);
      try {
        const res = await fetch(`/api/visitors?days=${days}&limit=200`);
        const json = await res.json();
        if (json.success) {
          setData(json.data);
          setLastRefresh(new Date());
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [days]
  );

  // Initial + on days change
  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => fetchData(), 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // ── Loading skeleton ───────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 skeleton w-56 rounded" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-5 h-24 skeleton rounded" />
          ))}
        </div>
        <div className="card p-6 h-96 skeleton rounded" />
      </div>
    );
  }

  const stats = [
    {
      label: "Pengunjung Hari Ini",
      value: data?.todayCount ?? 0,
      icon: HiOutlineEye,
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
    },
    {
      label: "Total Kunjungan",
      value: data?.total ?? 0,
      icon: HiOutlineClock,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
    },
    {
      label: "Sesi Unik",
      value: data?.uniqueSessions ?? 0,
      icon: HiOutlineUsers,
      color: "text-purple-400",
      bg: "bg-purple-400/10",
    },
    {
      label: "Negara Teratas",
      value: data?.topCountries[0]?.country ?? "-",
      icon: HiOutlineLocationMarker,
      color: "text-amber-400",
      bg: "bg-amber-400/10",
    },
  ];

  return (
    <div className="space-y-8">
      {/* ── Header ───────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Visitor Analytics</h1>
          <div className="flex items-center gap-2 mt-1">
            {/* Live pulse indicator */}
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <p className="text-xs text-brand-500">
              Live · Diperbarui {timeAgo(lastRefresh.toISOString())}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Days filter */}
          <div className="flex rounded-lg border border-white/10 overflow-hidden">
            {DAYS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDays(opt.value)}
                className={`px-4 py-2 text-xs font-medium transition-colors ${
                  days === opt.value
                    ? "bg-white text-black"
                    : "text-brand-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Manual refresh */}
          <button
            onClick={() => fetchData(true)}
            disabled={isRefreshing}
            className="p-2 rounded-lg border border-white/10 text-brand-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <HiOutlineRefresh
              className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* ── Stat Cards ───────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-brand-500 uppercase tracking-wider">
                {s.label}
              </span>
              <span className={`p-1.5 rounded-lg ${s.bg}`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </span>
            </div>
            <p className="text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Bottom Grid: Top Pages + Top Countries ───────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Pages */}
        <div className="card p-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-400 mb-5">
            Halaman Terpopuler
          </h3>
          <div className="space-y-3">
            {data?.topPages?.length ? (
              data.topPages.map((p, i) => {
                const max = data.topPages[0]?.count || 1;
                const pct = Math.round((p.count / max) * 100);
                return (
                  <div key={p.page}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-mono text-white truncate max-w-[200px]">
                        {p.page}
                      </span>
                      <span className="text-xs text-brand-500 ml-2 flex-shrink-0">
                        {p.count} kunjungan
                      </span>
                    </div>
                    <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-white/40 transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-brand-600">Belum ada data.</p>
            )}
          </div>
        </div>

        {/* Top Countries */}
        <div className="card p-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-400 mb-5">
            Negara Pengunjung
          </h3>
          <div className="space-y-3">
            {data?.topCountries?.length ? (
              data.topCountries.map((c) => {
                const max = data.topCountries[0]?.count || 1;
                const pct = Math.round((c.count / max) * 100);
                return (
                  <div key={c.country}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <HiOutlineGlobeAlt className="w-3.5 h-3.5 text-brand-500" />
                        <span className="text-sm text-white">{c.country}</span>
                      </div>
                      <span className="text-xs text-brand-500">{c.count}</span>
                    </div>
                    <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500/50 transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-brand-600">Belum ada data.</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Visitor Log Table ─────────────────────────────── */}
      <div className="card overflow-hidden">
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-400">
            Log Kunjungan
          </h3>
          <span className="text-xs text-brand-600">{data?.logs?.length ?? 0} entri</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-left">
                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-brand-600">
                  Waktu
                </th>
                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-brand-600">
                  Halaman
                </th>
                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-brand-600">
                  Lokasi
                </th>
                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-brand-600">
                  Browser
                </th>
                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-brand-600">
                  OS
                </th>
                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-brand-600">
                  Perangkat
                </th>
                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-brand-600">
                  IP
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {data?.logs?.length ? (
                data.logs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Waktu */}
                    <td className="px-5 py-3 text-brand-500 whitespace-nowrap text-xs">
                      {timeAgo(log.createdAt)}
                    </td>

                    {/* Halaman */}
                    <td className="px-5 py-3">
                      <span className="font-mono text-xs text-white bg-white/5 px-2 py-1 rounded">
                        {log.page}
                      </span>
                    </td>

                    {/* Lokasi */}
                    <td className="px-5 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <HiOutlineLocationMarker className="w-3.5 h-3.5 text-brand-600 flex-shrink-0" />
                        <span className="text-xs text-white">
                          {log.city && log.city !== "-" ? `${log.city}, ` : ""}
                          {log.country || "-"}
                        </span>
                      </div>
                    </td>

                    {/* Browser */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5">
                        <BrowserDot browser={log.browser} />
                        <span className="text-xs text-brand-300">
                          {log.browser || "-"}
                        </span>
                      </div>
                    </td>

                    {/* OS */}
                    <td className="px-5 py-3 text-xs text-brand-400 whitespace-nowrap">
                      {log.os || "-"}
                    </td>

                    {/* Perangkat */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5 text-brand-400">
                        <DeviceIcon device={log.device} />
                        <span className="text-xs">{log.device || "-"}</span>
                      </div>
                    </td>

                    {/* IP */}
                    <td className="px-5 py-3 font-mono text-[10px] text-brand-600 whitespace-nowrap">
                      {log.ip || "-"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <HiOutlineEye className="w-10 h-10 text-brand-700 mx-auto mb-3" />
                    <p className="text-brand-500 text-sm">Belum ada data pengunjung.</p>
                    <p className="text-brand-700 text-xs mt-1">
                      Data akan muncul saat ada pengunjung di storefront.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
