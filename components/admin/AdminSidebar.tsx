"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useUIStore } from "@/stores/ui-store";
import {
  HiOutlineChartBar,
  HiOutlineCube,
  HiOutlineShoppingCart,
  HiOutlineClipboardList,
  HiOutlineUsers,
  HiOutlineTag,
  HiOutlineEye,
  HiOutlineCog,
  HiOutlineExternalLink,
  HiOutlineLogout
} from "react-icons/hi";
import { signOut } from "next-auth/react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: HiOutlineChartBar },
  { href: "/admin/products", label: "Products", icon: HiOutlineCube },
  { href: "/admin/orders", label: "Orders", icon: HiOutlineShoppingCart },
  { href: "/admin/pre-orders", label: "Pre-Orders", icon: HiOutlineClipboardList },
  { href: "/admin/customers", label: "Customers", icon: HiOutlineUsers },
  { href: "/admin/coupons", label: "Coupons", icon: HiOutlineTag },
  { href: "/admin/visitors", label: "Visitors", icon: HiOutlineEye },
  { href: "/admin/settings", label: "Settings", icon: HiOutlineCog },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { isAdminSidebarOpen, setAdminSidebarOpen } = useUIStore();

  if (pathname?.includes("/admin/login")) return null;

  return (
    <>
      {/* Mobile overlay */}
      {isAdminSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
          onClick={() => setAdminSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-[var(--admin-card)] border-r border-[var(--admin-border)]
        flex flex-col transform transition-transform duration-300 ease-in-out
        md:translate-x-0
        ${isAdminSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 flex items-center gap-3">
          <Image
            src="/images/logo-sychogear.webp"
            alt="Logo"
            width={40}
            height={40}
            className="w-10 h-10 object-contain drop-shadow-md"
          />
          <div>
            <h2 className="font-bold text-white tracking-tight text-lg leading-tight">Admin</h2>
            <p className="text-xs text-[var(--admin-muted)]">Control Panel</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-2 space-y-1.5 overflow-y-auto">
          {navItems.map((link) => {
            const Icon = link.icon;
            const isActive = link.href === "/admin" 
              ? pathname === "/admin"
              : pathname === link.href || pathname.startsWith(`${link.href}/`);
            
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                  ${isActive 
                    ? 'bg-[var(--admin-accent)] text-white shadow-md shadow-red-600/20' 
                    : 'text-[var(--admin-muted)] hover:text-white hover:bg-white/5'
                  }
                `}
                onClick={() => setAdminSidebarOpen(false)}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-[var(--admin-muted)]'}`} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[var(--admin-border)]">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--admin-muted)] hover:text-white hover:bg-white/5 transition-colors"
          >
            <HiOutlineExternalLink className="w-5 h-5" />
            Storefront
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: `${window.location.origin}/admin/login` })}
            className="w-full flex items-center px-4 py-3 text-sm font-medium text-[var(--admin-text-muted)] hover:text-red-500 hover:bg-red-500/10 transition-colors group"
          >
            <HiOutlineLogout className="w-5 h-5 mr-3 group-hover:text-red-500" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
