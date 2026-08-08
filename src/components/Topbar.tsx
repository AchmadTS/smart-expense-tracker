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
  AlertCircle,
  Smartphone,
  Copy,
  CheckCircle2,
  Check,
  Inbox,
  Sparkles,
  AlertTriangle,
  Receipt,
} from "lucide-react";
import { BarProps } from "@/types/user";
import { startRegistration } from "@simplewebauthn/browser";
import { showToast } from "@/lib/toast";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: "warning" | "insight" | "transaction";
}

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
  const [isDarkMode, setIsDarkMode] = useState(false);
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
    {
      id: "3",
      title: "New Transaction",
      message: "Expense of $45.00 recorded in Shopping.",
      time: "1d ago",
      read: true,
      type: "transaction",
    },
  ]);

  const [isPasskeyEnabled, setIsPasskeyEnabled] = useState(false);
  const [isPasskeyLoading, setIsPasskeyLoading] = useState(false);
  const [showRemovePasskeyModal, setShowRemovePasskeyModal] = useState(false);
  const [isRemovingPasskey, setIsRemovingPasskey] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [is2FAEnabled, setIs2FAEnabled] = useState<boolean>(
    user?.isTwoFactorEnabled || false,
  );
  
  const [is2FALoading, setIs2FALoading] = useState(false);
  const [show2FASetupModal, setShow2FASetupModal] = useState(false);
  const [showDisable2FAModal, setShowDisable2FAModal] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [otpToken, setOtpToken] = useState("");
  const [isVerifying2FA, setIsVerifying2FA] = useState(false);
  const [isDisabling2FA, setIsDisabling2FA] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    async function checkPasskeyStatus() {
      try {
        const resp = await fetch("/api/auth/passkey/status", {
          credentials: "include",
        });
        if (resp.ok) {
          const data = await resp.json();
          setIsPasskeyEnabled(data.hasPasskey);
        }
      } catch (error) {
        console.error("Failed to check passkey status:", error);
      }
    }
    checkPasskeyStatus();
  }, []);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    showToast("All notifications marked as read", "success");
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  };

  const handleTogglePasskey = async () => {
    if (isPasskeyEnabled) {
      setShowRemovePasskeyModal(true);
      setIsMobileMenuOpen(false);
      return;
    }

    try {
      setIsPasskeyLoading(true);
      const resp = await fetch("/api/auth/passkey/register-options", {
        credentials: "include",
      });
      const data = await resp.json();

      if (!resp.ok)
        throw new Error(data.error || "Failed to load passkey options.");

      const attResp = await startRegistration({ optionsJSON: data });
      const verifyResp = await fetch("/api/auth/passkey/register-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(attResp),
      });

      const verifyResult = await verifyResp.json();
      if (!verifyResp.ok)
        throw new Error(verifyResult.error || "Failed to verify Passkey.");

      if (verifyResult.success) {
        setIsPasskeyEnabled(true);
        showToast(
          "Passkey successfully activated! You can log in using biometrics.",
          "success",
        );
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === "NotAllowedError") {
          showToast("Passkey registration cancelled.", "info");
        } else {
          showToast(`Failed to activate Passkey: ${error.message}`, "error");
        }
      } else {
        showToast("An unknown system error occurred.", "error");
      }
    } finally {
      setIsPasskeyLoading(false);
    }
  };

  const confirmRemovePasskey = async () => {
    try {
      setIsRemovingPasskey(true);
      const resp = await fetch("/api/auth/passkey/remove", {
        method: "DELETE",
      });
      if (!resp.ok) throw new Error("Failed to remove passkey");

      setIsPasskeyEnabled(false);
      setShowRemovePasskeyModal(false);
      showToast("Passkey successfully removed.", "success");
    } catch {
      showToast("An error occurred while removing passkey.", "error");
    } finally {
      setIsRemovingPasskey(false);
    }
  };

  const handleToggle2FA = async () => {
    if (is2FAEnabled) {
      setShowDisable2FAModal(true);
      setIsMobileMenuOpen(false);
      return;
    }

    try {
      setIs2FALoading(true);
      const resp = await fetch("/api/auth/2fa/setup", {
        method: "POST",
        credentials: "include",
      });
      const data = await resp.json();

      if (!resp.ok) throw new Error(data.error || "Failed to initialize 2FA");

      setQrCode(data.qrCode);
      setBackupCodes(data.backupCodes);
      setShow2FASetupModal(true);
      setIsMobileMenuOpen(false);
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "A system error occurred",
        "error",
      );
    } finally {
      setIs2FALoading(false);
    }
  };

  const handleVerify2FA = async () => {
    if (otpToken.length !== 6) return showToast("Enter 6 digit code", "info");

    try {
      setIsVerifying2FA(true);
      const resp = await fetch("/api/auth/2fa/verify-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token: otpToken }),
      });
      const data = await resp.json();

      if (!resp.ok) throw new Error(data.error || "Invalid code");

      setIs2FAEnabled(true);
      setShow2FASetupModal(false);
      setOtpToken("");
      showToast("2FA successfully activated!", "success");
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "A system error occurred",
        "error",
      );
    } finally {
      setIsVerifying2FA(false);
    }
  };

  const confirmDisable2FA = async () => {
    try {
      setIsDisabling2FA(true);
      const resp = await fetch("/api/auth/2fa/disable", {
        method: "POST",
        credentials: "include",
      });

      if (!resp.ok) throw new Error("Failed to turn off 2FA");

      setIs2FAEnabled(false);
      setShowDisable2FAModal(false);
      showToast("2FA successfully disabled.", "success");
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "A system error occurred",
        "error",
      );
    } finally {
      setIsDisabling2FA(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) {
        setIsMobileMenuOpen(false);
        setIsSecurityExpanded(false);
      }
      if (
        notificationRef.current &&
        !notificationRef.current.contains(target)
      ) {
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showLogoutModal) setShowLogoutModal(false);
        if (showRemovePasskeyModal) setShowRemovePasskeyModal(false);
        if (show2FASetupModal) setShow2FASetupModal(false);
        if (showDisable2FAModal) setShowDisable2FAModal(false);
        if (isNotificationOpen) setIsNotificationOpen(false);
        if (isMobileMenuOpen) {
          setIsMobileMenuOpen(false);
          setIsSecurityExpanded(false);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    showLogoutModal,
    showRemovePasskeyModal,
    show2FASetupModal,
    showDisable2FAModal,
    isNotificationOpen,
    isMobileMenuOpen,
  ]);

  const currentPageName = pathname
    ? pathname.split("/").filter(Boolean).pop() || "dashboard"
    : "dashboard";

  const getNotificationIcon = (type: NotificationItem["type"]) => {
    switch (type) {
      case "warning":
        return (
          <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <AlertTriangle size={15} />
          </div>
        );
      case "insight":
        return (
          <div className="h-8 w-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
            <Sparkles size={15} />
          </div>
        );
      case "transaction":
        return (
          <div className="h-8 w-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
            <Receipt size={15} />
          </div>
        );
    }
  };

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-4 sm:px-6 shrink-0 relative z-30">
        <div className="flex-1 min-w-0 pr-4">
          <div className="text-sm font-semibold text-slate-900 truncate">
            {greeting()}
            {firstName && `, ${firstName}`} 👋
          </div>
          <div className="text-xs text-slate-500 truncate">{formatToday()}</div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <button
            title="Search"
            className="h-9 w-9 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900 flex items-center justify-center transition cursor-pointer"
          >
            <Search size={17} />
          </button>

          <div className="relative" ref={notificationRef}>
            <button
              title="Notifications"
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className="relative h-9 w-9 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900 flex items-center justify-center transition cursor-pointer"
            >
              <Bell size={17} />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 h-2 w-2 bg-rose-500 rounded-full ring-2 ring-white" />
              )}
            </button>

            {isNotificationOpen && (
              <div className="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-100 rounded-3xl shadow-xl py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 pb-3 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-slate-900">
                      Notifications
                    </h4>
                    {unreadCount > 0 && (
                      <span className="bg-teal-50 text-teal-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-teal-600 hover:text-teal-700 font-medium transition cursor-pointer flex items-center gap-1"
                    >
                      <Check size={13} />
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-slate-400">
                      <Inbox size={28} className="mx-auto mb-2 opacity-50" />
                      <p className="text-xs font-medium">
                        No notifications yet
                      </p>
                    </div>
                  ) : (
                    notifications.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => markAsRead(item.id)}
                        className={`p-3.5 flex items-start gap-3 transition cursor-pointer hover:bg-slate-50/80 ${
                          !item.read ? "bg-teal-50/20" : ""
                        }`}
                      >
                        {getNotificationIcon(item.type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <span className="text-xs font-semibold text-slate-900 truncate">
                              {item.title}
                            </span>
                            <span className="text-[10px] text-slate-400 shrink-0">
                              {item.time}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                            {item.message}
                          </p>
                        </div>
                        {!item.read && (
                          <span className="h-1.5 w-1.5 bg-teal-500 rounded-full shrink-0 mt-2" />
                        )}
                      </div>
                    ))
                  )}
                </div>

                <div className="px-3 pt-2 border-t border-slate-100">
                  <Link
                    href="/dashboard/notifications"
                    onClick={() => setIsNotificationOpen(false)}
                    className="w-full py-2 bg-slate-50 hover:bg-slate-100 rounded-2xl text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center justify-center gap-1 transition"
                  >
                    View all notifications
                    <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="relative lg:hidden ml-1" ref={menuRef}>
            <button
              onClick={() => {
                const newValue = !isMobileMenuOpen;
                setIsMobileMenuOpen(newValue);
                if (!newValue) setIsSecurityExpanded(false);
              }}
              className="h-9 w-9 rounded-full bg-linear-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-semibold text-sm shadow-inner focus:outline-none cursor-pointer"
            >
              {initial}
            </button>

            {isMobileMenuOpen && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-2 border-b border-slate-100 mb-1">
                  <div className="text-sm font-bold text-slate-900 truncate">
                    {user?.name || "User"}
                  </div>
                  <div className="text-xs text-slate-500 truncate mt-0.5">
                    {user?.email || "user@example.com"}
                  </div>
                </div>

                <div className="px-2 space-y-0.5 relative">
                  <Link
                    href="/dashboard/account"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setIsSecurityExpanded(false);
                    }}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                  >
                    <User size={16} className="text-slate-400" />
                    Account
                  </Link>

                  <div className="relative">
                    <button
                      onClick={() => setIsSecurityExpanded(!isSecurityExpanded)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition cursor-pointer ${
                        isSecurityExpanded
                          ? "bg-slate-50 text-slate-900"
                          : "text-slate-700 hover:bg-slate-50"
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
                            ? "rotate-90 text-slate-900"
                            : "text-slate-400"
                        }`}
                      />
                    </button>

                    {isSecurityExpanded && (
                      <div className="w-full bg-slate-50/50 rounded-xl mt-1 p-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                        <button
                          onClick={handleTogglePasskey}
                          disabled={isPasskeyLoading}
                          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition ${
                            isPasskeyLoading
                              ? "opacity-50 cursor-wait text-slate-500"
                              : "text-slate-700 hover:bg-white hover:shadow-xs cursor-pointer"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Fingerprint size={14} className="text-teal-600" />
                            <span>
                              {isPasskeyLoading
                                ? "Processing..."
                                : "Enable Passkey"}
                            </span>
                          </div>
                          <div
                            className={`w-7 h-4 rounded-full relative transition-colors duration-300 shrink-0 ${
                              isPasskeyEnabled ? "bg-teal-500" : "bg-slate-200"
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

                        <div className="my-1 border-t border-slate-100"></div>

                        <button
                          onClick={handleToggle2FA}
                          disabled={is2FALoading}
                          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition ${
                            is2FALoading
                              ? "opacity-50 cursor-wait text-slate-500"
                              : "text-slate-700 hover:bg-white hover:shadow-xs cursor-pointer"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Smartphone size={14} className="text-teal-600" />
                            <span>
                              {is2FALoading ? "Processing..." : "Enable 2FA"}
                            </span>
                          </div>
                          <div
                            className={`w-7 h-4 rounded-full relative transition-colors duration-300 shrink-0 ${
                              is2FAEnabled ? "bg-teal-500" : "bg-slate-200"
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
                      className={`w-8 h-4.5 rounded-full relative transition-colors duration-300 shrink-0 ${
                        isDarkMode ? "bg-teal-500" : "bg-slate-200"
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 left-0.5 bg-white w-3.5 h-3.5 rounded-full transition-transform duration-300 ${
                          isDarkMode ? "translate-x-3.5" : "translate-x-0"
                        }`}
                      ></div>
                    </div>
                  </button>

                  <div className="my-1 border-t border-slate-100"></div>

                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setIsSecurityExpanded(false);
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
          </div>
        </div>
      </header>

      {show2FASetupModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200 p-4">
          <div className="bg-white rounded-3xl border border-slate-100 w-full max-w-md shadow-xl flex flex-col max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden scrollbar-none [-ms-overflow-style:none]">
            <div className="p-6 pb-4 border-b border-slate-100 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 shrink-0">
                <Shield size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Setup 2FA</h3>
                <p className="text-xs text-slate-500">
                  Improve your account security
                </p>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="space-y-3 text-center">
                <div className="inline-block p-2 bg-white border border-slate-200 rounded-2xl shadow-sm">
                  {qrCode ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={qrCode} alt="QR Code 2FA" className="w-40 h-40" />
                  ) : (
                    <div className="w-40 h-40 bg-slate-50 animate-pulse rounded-xl" />
                  )}
                </div>
                <p className="text-sm text-slate-600">
                  <span className="font-semibold text-slate-900">1.</span> Scan
                  this QR code with an app like{" "}
                  <span className="font-semibold">Google Authenticator</span> or{" "}
                  <span className="font-semibold">Authy</span>.
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-sm text-slate-700 mb-2 font-medium flex items-center gap-2">
                  <span className="font-semibold text-slate-900">2.</span> Save
                  Backup Codes
                </p>
                <p className="text-xs text-slate-500 mb-3">
                  Keep this code in a safe place. Use it if you lose access to
                  your app.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {backupCodes.map((code) => (
                    <div
                      key={code}
                      className="bg-white px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-mono text-slate-700 flex justify-between items-center group"
                    >
                      {code}
                      <button
                        onClick={() => copyToClipboard(code)}
                        className="text-slate-300 hover:text-teal-600 transition opacity-0 group-hover:opacity-100 cursor-pointer"
                        title="Copy"
                      >
                        {copiedCode === code ? (
                          <CheckCircle2 size={12} className="text-teal-500" />
                        ) : (
                          <Copy size={12} />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm text-slate-700 mb-2 font-medium flex items-center gap-2">
                  <span className="font-semibold text-slate-900">3.</span> Enter
                  6 Digit Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otpToken}
                  onChange={(e) =>
                    setOtpToken(e.target.value.replace(/\D/g, ""))
                  }
                  placeholder="000000"
                  className="w-full text-center tracking-[0.5em] font-mono text-lg px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <div className="p-6 pt-4 border-t border-slate-100 flex items-center gap-3 bg-slate-50/50">
              <button
                type="button"
                disabled={isVerifying2FA}
                onClick={() => setShow2FASetupModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isVerifying2FA || otpToken.length !== 6}
                onClick={handleVerify2FA}
                className="flex-1 px-4 py-2.5 rounded-xl bg-teal-600 text-sm font-medium text-white hover:bg-teal-700 transition cursor-pointer disabled:opacity-50 flex items-center justify-center"
              >
                {isVerifying2FA ? "Verifying..." : "Verify and Activate"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDisable2FAModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-100 p-6 w-full max-w-sm shadow-xl mx-4 space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 mb-1">
              <Shield size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                Turn off 2FA?
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Your account will be less secure. You&apos;ll only need your
                password to log in.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={isDisabling2FA}
                onClick={() => setShowDisable2FAModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDisabling2FA}
                onClick={confirmDisable2FA}
                className="flex-1 px-4 py-2.5 rounded-xl bg-amber-500 text-sm font-medium text-white hover:bg-amber-600 transition cursor-pointer disabled:opacity-50 flex items-center justify-center"
              >
                {isDisabling2FA ? "Turning off..." : "Yes, Turn Off"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showRemovePasskeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-100 p-6 w-full max-w-sm shadow-xl mx-4 space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 mb-1">
              <Shield size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                Disable Passkey?
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                You are about to remove your Passkey. You will no longer be able
                to log in using fingerprint or face unlock.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={isRemovingPasskey}
                onClick={() => setShowRemovePasskeyModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isRemovingPasskey}
                onClick={confirmRemovePasskey}
                className="flex-1 px-4 py-2.5 rounded-xl bg-amber-500 text-sm font-medium text-white hover:bg-amber-600 transition cursor-pointer disabled:opacity-50 flex items-center justify-center"
              >
                {isRemovingPasskey ? "Disabling..." : "Yes, Disable"}
              </button>
            </div>
          </div>
        </div>
      )}

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
                {isLoggingOut ? "Logging out..." : "Yes, Logout"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
