"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Folder,
  Target,
  Sparkles,
  Wallet,
  LogOut,
  AlertCircle,
  User,
  Shield,
  Moon,
  ChevronUp,
} from "lucide-react";
import { BarProps } from "@/types/user";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  {
    href: "transactions",
    label: "Transactions",
    icon: ArrowLeftRight,
  },
  { href: "categories", label: "Categories", icon: Folder },
  { href: "budgets", label: "Budgets", icon: Target },
  { href: "insights", label: "AI Insights", icon: Sparkles },
];

export default function Sidebar({ user }: BarProps) {
  const pathname = usePathname();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const initial = user?.name?.[0]?.toUpperCase() || "U";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showLogoutModal) setShowLogoutModal(false);
        if (showProfileMenu) setShowProfileMenu(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showLogoutModal, showProfileMenu]);

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

      window.location.href = "/login";
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

        <div className="p-3 border-t border-slate-100" ref={menuRef}>
          <div className="relative">
            {showProfileMenu && (
              <div className="absolute bottom-full left-0 mb-2 w-full bg-white border border-slate-100 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] py-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="px-4 py-2 border-b border-slate-100 mb-1">
                  <div className="text-sm font-bold text-slate-900 truncate">
                    {user?.name || "User"}
                  </div>
                  <div className="text-xs text-slate-500 truncate mt-0.5">
                    {user?.email || "user@example.com"}
                  </div>
                </div>

                <div className="px-2 space-y-0.5">
                  <Link
                    href="/account"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                  >
                    <User size={16} className="text-slate-400" />
                    Account
                  </Link>
                  <Link
                    href="/security"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                  >
                    <Shield size={16} className="text-slate-400" />
                    Security
                  </Link>

                  <div className="my-1 border-t border-slate-100"></div>

                  <button
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <Moon size={16} className="text-slate-400" />
                      Dark Mode
                    </div>
                    <div
                      className={`w-8 h-4.5 rounded-full relative transition-colors duration-300 ${isDarkMode ? "bg-teal-500" : "bg-slate-200"}`}
                    >
                      <div
                        className={`absolute top-0.5 left-0.5 bg-white w-3.5 h-3.5 rounded-full transition-transform duration-300 ${isDarkMode ? "translate-x-3.5" : "translate-x-0"}`}
                      ></div>
                    </div>
                  </button>

                  <div className="my-1 border-t border-slate-100"></div>

                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      setShowLogoutModal(true);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                  >
                    <LogOut size={16} />
                    Log out
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-full flex items-center gap-3 p-2.5 rounded-2xl hover:bg-slate-50 transition cursor-pointer text-left focus:outline-none"
            >
              <div className="h-9 w-9 rounded-full bg-linear-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-semibold text-sm shrink-0 shadow-inner">
                {initial}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-slate-900 truncate">
                  {user?.name || "User"}
                </div>
              </div>
              <ChevronUp
                size={16}
                className={`text-slate-400 transition-transform duration-200 ${showProfileMenu ? "rotate-180" : ""}`}
              />
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
                Logout?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                You will need to log in again using your email and password to
                access{" "}
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
                Cancel
              </button>
              <button
                type="button"
                disabled={isLoggingOut}
                onClick={handleLogout}
                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 text-sm font-medium text-white hover:bg-rose-700 transition cursor-pointer disabled:opacity-50 flex items-center justify-center"
              >
                {isLoggingOut ? "Logout..." : "Yes, Logout"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
