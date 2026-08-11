"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Search,
  User,
  Shield,
  ChevronRight,
  Fingerprint,
  Moon,
  LogOut,
  Smartphone,
  Copy,
  CheckCircle2,
} from "lucide-react";
import { BarProps } from "@/types/user";
import { showToast } from "@/lib/toast";

import LogoutModal from "../modals/LogoutModal";
import RemovePasskeyModal from "../modals/RemovePasskeyModal";
import NotificationDropdown, { NotificationItem } from "./NotificationDropdown";
import Disable2FAModal from "@/components/modals/Disable2FAModal";
import { useDarkMode } from "@/hooks/useDarkMode";
import { useSecurity } from "@/hooks/useSecurity";

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
};

const formatToday = () =>
  new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

export default function Topbar({ user }: BarProps) {
  const pathname = usePathname();
  const firstName = user?.name?.split(" ")[0] || "";
  const initial = user?.name?.[0]?.toUpperCase() || "U";
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isSecurityExpanded, setIsSecurityExpanded] = useState(false);
  const { isDarkMode, setIsDarkMode } = useDarkMode();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: "1",
      title: "Budget Alert",
      message: "You've reached 85% of your Food & Dining budget.",
      time: "10m ago",
      read: false,
      type: "warning",
    },
    {
      id: "2",
      title: "AI Insight Ready",
      message: "Weekly spending summary is ready to view.",
      time: "1h ago",
      read: false,
      type: "insight",
    },
  ]);

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const {
    isPasskeyEnabled,
    isPasskeyLoading,
    showRemovePasskeyModal,
    setShowRemovePasskeyModal,
    isRemovingPasskey,
    handleTogglePasskey,
    confirmRemovePasskey,
    is2FAEnabled,
    is2FALoading,
    show2FASetupModal,
    setShow2FASetupModal,
    showDisable2FAModal,
    setShowDisable2FAModal,
    qrCode,
    backupCodes,
    otpToken,
    setOtpToken,
    isVerifying2FA,
    isDisabling2FA,
    copiedCode,
    handleToggle2FA,
    handleVerify2FA,
    confirmDisable2FA,
    copyToClipboard,
  } = useSecurity({ initial2FA: user?.isTwoFactorEnabled });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    showToast("All notifications marked as read", "success");
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoggingOut(false);
      setShowLogoutModal(false);
      window.location.href = "/login";
    }
  };

  const currentPageName = pathname
    ? pathname.split("/").filter(Boolean).pop() || "dashboard"
    : "dashboard";

  return (
    <>
      <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 shrink-0 relative z-30 transition-colors">
        <div className="flex-1 min-w-0 pr-4">
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
            {greeting()}
            {firstName && `, ${firstName}`} 👋
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
            {formatToday()}
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <button
            title="Search"
            className="h-9 w-9 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition cursor-pointer"
          >
            <Search size={17} />
          </button>

          <div className="relative" ref={notificationRef}>
            <button
              title="Notifications"
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className="relative h-9 w-9 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition cursor-pointer"
            >
              <Bell size={17} />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 h-2 w-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
              )}
            </button>

            <NotificationDropdown
              isOpen={isNotificationOpen}
              notifications={notifications}
              unreadCount={unreadCount}
              onMarkAllAsRead={markAllAsRead}
              onMarkAsRead={(id) =>
                setNotifications((prev) =>
                  prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
                )
              }
              onClose={() => setIsNotificationOpen(false)}
            />
          </div>

          <div className="relative lg:hidden ml-1" ref={menuRef}>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="h-9 w-9 rounded-full bg-linear-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-semibold text-sm shadow-inner cursor-pointer"
            >
              {initial}
            </button>

            {isMobileMenuOpen && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                  <div className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                    {user?.name}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {user?.email}
                  </div>
                </div>
                <div className="px-2 space-y-0.5">
                  <Link
                    href="/dashboard/account"
                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                  >
                    <User size={16} className="text-slate-400" /> Account
                  </Link>

                  <div className="relative">
                    <button
                      onClick={() => setIsSecurityExpanded(!isSecurityExpanded)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition cursor-pointer ${
                        isSecurityExpanded
                          ? "bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Shield size={16} className="text-slate-400" />
                        <span>Security</span>
                      </div>
                      <ChevronRight
                        size={15}
                        className={`transition-transform duration-200 ${
                          isSecurityExpanded
                            ? "rotate-90 text-slate-900 dark:text-slate-100"
                            : "text-slate-400"
                        }`}
                      />
                    </button>

                    {isSecurityExpanded && (
                      <div className="w-full bg-slate-50/50 dark:bg-slate-800/50 rounded-xl mt-1 p-1.5 space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
                        <button
                          onClick={() =>
                            handleTogglePasskey(() =>
                              setIsMobileMenuOpen(false),
                            )
                          }
                          disabled={isPasskeyLoading}
                          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition ${
                            isPasskeyLoading
                              ? "opacity-50 cursor-wait text-slate-500"
                              : "text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 cursor-pointer"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Fingerprint
                              size={14}
                              className="text-teal-600 dark:text-teal-400"
                            />
                            <span>
                              {isPasskeyLoading
                                ? "Processing..."
                                : "Enable Passkey"}
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
                                isPasskeyEnabled
                                  ? "translate-x-3"
                                  : "translate-x-0"
                              }`}
                            />
                          </div>
                        </button>

                        <div className="border-t border-slate-100 dark:border-slate-800"></div>

                        <button
                          onClick={() =>
                            handleToggle2FA(() => setIsMobileMenuOpen(false))
                          }
                          disabled={is2FALoading}
                          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition ${
                            is2FALoading
                              ? "opacity-50 cursor-wait text-slate-500"
                              : "text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 cursor-pointer"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Smartphone
                              size={14}
                              className="text-teal-600 dark:text-teal-400"
                            />
                            <span>
                              {is2FALoading ? "Processing..." : "Enable 2FA"}
                            </span>
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
                      </div>
                    )}
                  </div>

                  <div className="my-1 border-t border-slate-100 dark:border-slate-800"></div>
                  <button
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <Moon size={16} className="text-slate-400" />
                      <span>Dark Mode</span>
                    </div>
                    <div
                      className={`w-8 h-4.5 rounded-full relative transition-colors duration-300 shrink-0 ${
                        isDarkMode
                          ? "bg-teal-500"
                          : "bg-slate-200 dark:bg-slate-700"
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 left-0.5 bg-white w-3.5 h-3.5 rounded-full transition-transform duration-300 ${
                          isDarkMode ? "translate-x-3.5" : "translate-x-0"
                        }`}
                      />
                    </div>
                  </button>

                  <div className="my-1 border-t border-slate-100 dark:border-slate-800"></div>

                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setShowLogoutModal(true);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                  >
                    <LogOut size={16} /> Log out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {show2FASetupModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 w-full max-w-md shadow-xl rounded-3xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Setup 2FA
            </h3>
            <div className="text-center">
              {qrCode && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrCode} alt="QR Code" className="mx-auto w-40 h-40" />
              )}
            </div>
            <div className="space-y-2">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Backup Codes:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {backupCodes.map((code) => (
                  <div
                    key={code}
                    onClick={() => copyToClipboard(code)}
                    className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-mono cursor-pointer flex justify-between items-center text-slate-700 dark:text-slate-300"
                  >
                    <span>{code}</span>
                    {copiedCode === code ? (
                      <CheckCircle2 size={12} className="text-teal-500" />
                    ) : (
                      <Copy
                        size={12}
                        className="text-slate-400 hover:text-teal-600 transition"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
            <input
              type="text"
              maxLength={6}
              value={otpToken}
              onChange={(e) => setOtpToken(e.target.value.replace(/\D/g, ""))}
              placeholder="Enter 6-digit code"
              className="w-full p-2.5 border rounded-xl text-center tracking-widest font-mono text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
            />
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShow2FASetupModal(false)}
                className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleVerify2FA}
                disabled={isVerifying2FA}
                className="flex-1 py-2.5 bg-teal-600 text-white rounded-xl text-xs font-semibold hover:bg-teal-700"
              >
                Verify
              </button>
            </div>
          </div>
        </div>
      )}

      <Disable2FAModal
        isOpen={showDisable2FAModal}
        onClose={() => setShowDisable2FAModal(false)}
        onConfirm={confirmDisable2FA}
        isDisabling={isDisabling2FA}
      />

      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
        isLoggingOut={isLoggingOut}
        currentPageName={currentPageName}
      />
      <RemovePasskeyModal
        isOpen={showRemovePasskeyModal}
        onClose={() => setShowRemovePasskeyModal(false)}
        onConfirm={confirmRemovePasskey}
        isRemoving={isRemovingPasskey}
      />
    </>
  );
}
