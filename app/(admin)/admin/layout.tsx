"use client";

import AdminSidebar from "@/components/admin/AdminSidebar";
import { useUIStore } from "@/stores/ui-store";
import { HiMenuAlt2 } from "react-icons/hi";
import Image from "next/image";
import { HiOutlineChartSquareBar, HiOutlineClipboardList, HiOutlineCube, HiOutlineTag, HiOutlineTicket, HiOutlineLightningBolt, HiOutlineGlobeAlt, HiOutlineCog } from "react-icons/hi";

const sidebarLinks = [
  { href: "/admin", label: "Dashboard", icon: HiOutlineChartSquareBar },
  { href: "/admin/orders", label: "Orders", icon: HiOutlineClipboardList },
  { href: "/admin/products", label: "Products", icon: HiOutlineCube },
  { href: "/admin/categories", label: "Categories", icon: HiOutlineTag },
  { href: "/admin/coupons", label: "Coupons", icon: HiOutlineTicket },
  { href: "/admin/flash-sales", label: "Flash Sales", icon: HiOutlineLightningBolt },
  { href: "/admin/shipping", label: "Shipping Rates", icon: HiOutlineGlobeAlt },
  { href: "/admin/settings", label: "Settings", icon: HiOutlineCog },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const setOpen = useUIStore((s) => s.setAdminSidebarOpen);

  return (
    <div className="flex min-h-screen bg-brand-950 text-white admin-panel">
      <AdminSidebar />
      
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="h-16 border-b border-salt/5 bg-brand-950 flex items-center justify-between px-4 md:hidden sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setOpen(true)}
              className="p-2 text-brand-400 hover:text-white transition-colors"
            >
              <HiMenuAlt2 className="w-6 h-6" />
            </button>
            <Image
              src="/images/logo-sychogear.webp"
              alt="Logo"
              width={40}
              height={40}
              className="w-8 h-8 object-contain"
            />
          </div>
          <span className="text-[10px] font-bold tracking-widest text-brand-500 uppercase">
            Admin Panel
          </span>
        </header>

        <main className="flex-1 md:ml-64 p-4 md:p-8 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
