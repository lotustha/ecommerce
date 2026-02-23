"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  Layers,
  Shield,
  Banknote,
  Ticket,
  Bike,
} from "lucide-react";

export default function SidebarNav() {
  const pathname = usePathname();

  const menuItems = [
    { name: "Overview", icon: LayoutDashboard, href: "/dashboard" },
    { name: "Orders", icon: ShoppingCart, href: "/dashboard/orders" },
    { name: "Dispatch", icon: Bike, href: "/dashboard/dispatch" },
    { name: "Products", icon: Package, href: "/dashboard/products" },
    { name: "Categories", icon: Layers, href: "/dashboard/categories" },
    { name: "Customers", icon: Users, href: "/dashboard/customers" },
    { name: "Staff", icon: Shield, href: "/dashboard/staff" },
    { name: "Payments", icon: Banknote, href: "/dashboard/payments" },
    { name: "Coupons", icon: Ticket, href: "/dashboard/coupons" },
    { name: "Settings", icon: Settings, href: "/dashboard/settings" },
  ];

  return (
    <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
      {menuItems.map((item) => {
        const isActive =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${isActive
              ? "bg-primary text-primary-content shadow-md shadow-primary/20"
              : "text-base-content/70 hover:bg-base-200 hover:text-primary"
              }`}
          >
            <item.icon size={20} />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}
