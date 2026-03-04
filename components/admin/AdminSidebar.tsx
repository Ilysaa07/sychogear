"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  HiOutlineChartBar,
  HiOutlineCube,
  HiOutlineClipboardList,
  HiOutlineUsers,
  HiOutlineTag,
  HiOutlineArrowLeft,
  HiOutlineCog,
} from "react-icons/hi";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: HiOutlineChartBar },
  { href: "/admin/products", label: "Products", icon: HiOutlineCube },
  { href: "/admin/orders", label: "Orders", icon: HiOutlineClipboardList },
  { href: "/admin/customers", label: "Customers", icon: HiOutlineUsers },
  { href: "/admin/coupons", label: "Coupons", icon: HiOutlineTag },
  { href: "/admin/settings", label: "Settings", icon: HiOutlineCog },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-brand-950 border-r border-white/5 flex flex-col z-40">
      {/* Logo */}
      <div className="p-6 border-b border-white/5">
        <Image
          src="/images/logo-sychogear.png"
          alt="Logo"
          width={100}
          height={100}
          className="w-24 h-24 object-contain"
        />
        <p className="text-[10px] text-brand-500 tracking-widest uppercase mt-1">
          Admin Panel
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all ${
                isActive
                  ? "bg-white/5 text-white"
                  : "text-brand-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Back to store */}
      <div className="p-4 border-t border-white/5">
        <Link
          href="/"
          className="flex items-center gap-3 px-4 py-3 text-sm text-brand-500 hover:text-white transition-colors"
        >
          <HiOutlineArrowLeft className="w-4 h-4" />
          Back to Store
        </Link>
      </div>
    </aside>
  );
}
