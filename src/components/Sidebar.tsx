"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Folder,
  Target,
  Sparkles,
  Wallet,
  LogOut,
  AlertCircle,
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

interface UserProfile {
  name?: string | null;
  email?: string | null;
}

interface SidebarProps {
  user?: UserProfile | null;
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const initial = user?.name?.[0]?.toUpperCase() || "U";
  const currentNavItem = navItems.find((item) =>
    item.href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(item.href),
  );
  const currentPageName = currentNavItem
    ? currentNavItem.label.toLowerCase()
    : "dashboard";

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoggingOut(false);
      setShowLogoutModal(false);
      router.push("/login");
      router.refresh();
    }
  };

  return (
    <>
      <aside className="w-64 bg-white border-r border-slate-100 hidden lg:flex flex-col shrink-0">
        <div className="h-16 flex items-center gap-2 px-6 border-b border-slate-100">
          <div className="h-8 w-8 rounded-lg bg-linear-to-br from-teal-400 to-teal-600 flex items-center justify-center">
            <Wallet size={16} className="text-white" />
          </div>
          <span className="font-bold text-slate-900">ExpenseAI</span>
        </div>

        <nav className="flex-1 p-3 space-y-1.5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(href);

            return (
              <Link
                key={href}
                href={href}
                className={`relative flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition ${
                  isActive
                    ? "bg-slate-100 text-slate-900 before:absolute before:left-0 before:top-2.5 before:bottom-2.5 before:w-1 before:rounded-full before:bg-teal-500"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Icon size={20} strokeWidth={1.75} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-100">
          <div className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-slate-50 transition">
            <div className="h-9 w-9 rounded-full bg-linear-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-semibold text-sm shrink-0">
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-slate-900 truncate">
                {user?.name || "User"}
              </div>
              <div className="text-xs text-slate-500 truncate">
                {user?.email || "user@example.com"}
              </div>
            </div>
            <button
              onClick={() => setShowLogoutModal(true)}
              title="Logout"
              className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition shrink-0 cursor-pointer"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-100 p-6 w-full max-w-sm shadow-xl mx-4 space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600 mb-1">
              <AlertCircle size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                Keluar dari Akun?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Kamu perlu masuk kembali menggunakan email dan password untuk
                mengakses{" "}
                <span className="font-semibold text-slate-700">
                  {currentPageName}
                </span>
                .
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={isLoggingOut}
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isLoggingOut}
                onClick={handleLogout}
                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 text-sm font-medium text-white hover:bg-rose-700 transition cursor-pointer disabled:opacity-50 flex items-center justify-center"
              >
                {isLoggingOut ? "Keluar..." : "Ya, Keluar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
