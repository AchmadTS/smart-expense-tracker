"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Folder,
  Target,
  Sparkles,
  Wallet,
  User,
  Shield,
  Moon,
  LogOut,
  ChevronUp,
  ChevronRight,
  Fingerprint,
  Smartphone,
} from "lucide-react";
import { createPortal } from "react-dom";
import { RefObject } from "react";
import { UserProfile as UserType } from "@/types/user";

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

interface DesktopSidebarProps {
  user: UserType | null | undefined;
  showProfileMenu: boolean;
  setShowProfileMenu: (val: boolean) => void;
  isSecurityExpanded: boolean;
  setIsSecurityExpanded: (val: boolean) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  menuRef: RefObject<HTMLDivElement | null>;
  securityMenuRef: RefObject<HTMLDivElement | null>;
  securityButtonRef: RefObject<HTMLButtonElement | null>;
  menuPos: { top: number; left: number };
  isPasskeyEnabled: boolean;
  isPasskeyLoading: boolean;
  onTogglePasskey: () => void;
  is2FAEnabled: boolean;
  is2FALoading: boolean;
  onToggle2FA: () => void;
  onOpenLogout: () => void;
}

export default function DesktopSidebar({
  user,
  showProfileMenu,
  setShowProfileMenu,
  isSecurityExpanded,
  setIsSecurityExpanded,
  isDarkMode,
  onToggleDarkMode,
  menuRef,
  securityMenuRef,
  securityButtonRef,
  menuPos,
  isPasskeyEnabled,
  isPasskeyLoading,
  onTogglePasskey,
  is2FAEnabled,
  is2FALoading,
  onToggle2FA,
  onOpenLogout,
}: DesktopSidebarProps) {
  const pathname = usePathname();
  const initial = user?.name?.[0]?.toUpperCase() || "U";

  const profileMenuContent = (
    <div className="px-2 space-y-0.5 relative">
      <Link
        href="/dashboard/account"
        onClick={() => {
          setShowProfileMenu(false);
          setIsSecurityExpanded(false);
        }}
        className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
      >
        <User size={16} className="text-slate-400" />
        Account
      </Link>

      <button
        onClick={onToggleDarkMode}
        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <Moon size={16} className="text-slate-400" />
          Dark Mode
        </div>
        <div
          className={`w-8 h-4.5 rounded-full relative transition-colors duration-300 shrink-0 ${isDarkMode ? "bg-teal-500" : "bg-slate-200 dark:bg-slate-700"}`}
        >
          <div
            className={`absolute top-0.5 left-0.5 bg-white w-3.5 h-3.5 rounded-full transition-transform duration-300 ${isDarkMode ? "translate-x-3.5" : "translate-x-0"}`}
          />
        </div>
      </button>

      <div className="my-1 border-t border-slate-100 dark:border-slate-800"></div>
      <div className="relative">
        <button
          ref={securityButtonRef}
          onClick={() => setIsSecurityExpanded(!isSecurityExpanded)}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition cursor-pointer ${
            isSecurityExpanded
              ? "bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          }`}
        >
          <div className="flex items-center gap-3">
            <Shield size={16} className="text-slate-400" />
            Security
          </div>
          <ChevronRight
            size={15}
            className={`transition-colors duration-200 ${
              isSecurityExpanded
                ? "rotate-90 text-slate-900 dark:text-slate-100"
                : "text-slate-400"
            }`}
          />
        </button>

        {isSecurityExpanded &&
          typeof window !== "undefined" &&
          createPortal(
            <div
              ref={securityMenuRef}
              style={{ top: menuPos.top, left: menuPos.left }}
              className="fixed w-48 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.08)] p-1.5 z-50 animate-in fade-in slide-in-from-left-1 duration-150"
            >
              <button
                onClick={onTogglePasskey}
                disabled={isPasskeyLoading}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition ${
                  isPasskeyLoading
                    ? "opacity-50 cursor-wait text-slate-500"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Fingerprint
                    size={14}
                    className="text-teal-600 dark:text-teal-400"
                  />
                  <span>
                    {isPasskeyLoading ? "Processing..." : "Enable Passkey"}
                  </span>
                </div>
                <div
                  className={`w-7 h-4 rounded-full relative transition-colors duration-300 shrink-0 ${
                    isPasskeyEnabled
                      ? "bg-teal-500"
                      : "bg-slate-200 dark:bg-slate-700"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 left-0.5 bg-white w-3 h-3 rounded-full transition-transform duration-300 ${
                      isPasskeyEnabled ? "translate-x-3" : "translate-x-0"
                    }`}
                  />
                </div>
              </button>

              <div className="my-1 border-t border-slate-100 dark:border-slate-800"></div>
              <button
                onClick={onToggle2FA}
                disabled={is2FALoading}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition ${
                  is2FALoading
                    ? "opacity-50 cursor-wait text-slate-500"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Smartphone
                    size={14}
                    className="text-teal-600 dark:text-teal-400"
                  />
                  <span>{is2FALoading ? "Processing..." : "Enable 2FA"}</span>
                </div>
                <div
                  className={`w-7 h-4 rounded-full relative transition-colors duration-300 shrink-0 ${
                    is2FAEnabled
                      ? "bg-teal-500"
                      : "bg-slate-200 dark:bg-slate-700"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 left-0.5 bg-white w-3 h-3 rounded-full transition-transform duration-300 ${
                      is2FAEnabled ? "translate-x-3" : "translate-x-0"
                    }`}
                  />
                </div>
              </button>
            </div>,
            document.body,
          )}
      </div>

      <div className="my-1 border-t border-slate-100 dark:border-slate-800"></div>

      <button
        onClick={onOpenLogout}
        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
      >
        <LogOut size={16} />
        Log out
      </button>
    </div>
  );

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 hidden lg:flex flex-col shrink-0 h-screen sticky top-0 transition-colors">
      <div className="h-16 flex items-center gap-2 px-6 border-b border-slate-100 dark:border-slate-800">
        <div className="h-8 w-8 rounded-lg bg-linear-to-br from-teal-400 to-teal-600 flex items-center justify-center">
          <Wallet size={16} className="text-white" />
        </div>
        <span className="font-bold text-slate-900 dark:text-slate-100">
          Smart Expense
        </span>
      </div>

      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
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
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 before:absolute before:left-0 before:top-2.5 before:bottom-2.5 before:w-1 before:rounded-full before:bg-teal-500"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              }`}
            >
              <Icon size={20} strokeWidth={1.75} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div
        className="p-3 border-t border-slate-100 dark:border-slate-800"
        ref={menuRef}
      >
        <div className="relative">
          {showProfileMenu && (
            <div className="absolute bottom-full left-0 mb-2 w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] py-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                <div className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                  {user?.name || "User"}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {user?.email || "user@example.com"}
                </div>
              </div>
              {profileMenuContent}
            </div>
          )}

          <button
            onClick={() => {
              const newValue = !showProfileMenu;
              setShowProfileMenu(newValue);
              if (!newValue) setIsSecurityExpanded(false);
            }}
            className="w-full flex items-center gap-3 p-2.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer text-left focus:outline-none"
          >
            <div className="h-9 w-9 rounded-full bg-linear-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-semibold text-sm shrink-0 shadow-inner">
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
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
  );
}
