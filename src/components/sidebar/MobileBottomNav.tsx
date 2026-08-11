"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Folder,
  Target,
  Sparkles,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  {
    href: "/dashboard/transactions",
    label: "Transactions",
    icon: ArrowLeftRight,
  },
  { href: "/dashboard/categories", label: "Categories", icon: Folder },
  { href: "/dashboard/budgets", label: "Budgets", icon: Target },
  { href: "/dashboard/insights", label: "AI Insights", icon: Sparkles },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-around px-2 pb-safe pt-2 h-16 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.02)] transition-colors">
      {navItems.map(({ href, label, icon: Icon }) => {
        const isActive =
          href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
              isActive
                ? "text-teal-600 dark:text-teal-400"
                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            }`}
          >
            <div
              className={`relative p-1 rounded-xl transition-all duration-300 ${
                isActive ? "bg-teal-50 dark:bg-teal-950/40" : ""
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
            </div>
            <span
              className={`text-[10px] font-medium ${
                isActive
                  ? "text-teal-700 dark:text-teal-300"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              {label.replace("AI ", "")}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
