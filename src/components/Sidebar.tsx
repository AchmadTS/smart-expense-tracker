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
  ChevronRight,
  Fingerprint,
  Smartphone,
  Copy,
  CheckCircle2,
} from "lucide-react";
import { BarProps } from "@/types/user";
import { startRegistration } from "@simplewebauthn/browser";
import { createPortal } from "react-dom";

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

export default function Sidebar({ user }: BarProps) {
  const pathname = usePathname();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showRemovePasskeyModal, setShowRemovePasskeyModal] = useState(false);
  const [isRemovingPasskey, setIsRemovingPasskey] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSecurityExpanded, setIsSecurityExpanded] = useState(false);
  const [isPasskeyEnabled, setIsPasskeyEnabled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const securityMenuRef = useRef<HTMLDivElement>(null);
  const [is2FAEnabled, setIs2FAEnabled] = useState<boolean>(
    user?.isTwoFactorEnabled || false,
  );
  const initial = user?.name?.[0]?.toUpperCase() || "U";
  const [isPasskeyLoading, setIsPasskeyLoading] = useState(false);
  const securityButtonRef = useRef<HTMLButtonElement>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const [is2FALoading, setIs2FALoading] = useState(false);
  const [show2FASetupModal, setShow2FASetupModal] = useState(false);
  const [showDisable2FAModal, setShowDisable2FAModal] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [otpToken, setOtpToken] = useState("");
  const [isVerifying2FA, setIsVerifying2FA] = useState(false);
  const [isDisabling2FA, setIsDisabling2FA] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    if (isSecurityExpanded && securityButtonRef.current) {
      const rect = securityButtonRef.current.getBoundingClientRect();
      setMenuPos({
        top: rect.top,
        left: rect.right + 8,
      });
    }
  }, [isSecurityExpanded]);

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

  const handleTogglePasskey = async () => {
    if (isPasskeyEnabled) {
      setShowRemovePasskeyModal(true);
      setShowProfileMenu(false);
      return;
    }

    try {
      setIsPasskeyLoading(true);

      const resp = await fetch("/api/auth/passkey/register-options", {
        credentials: "include",
      });

      const data = await resp.json();

      if (!resp.ok) {
        throw new Error(data.error || "Failed to load passkey options.");
      }

      const attResp = await startRegistration({ optionsJSON: data });
      const verifyResp = await fetch("/api/auth/passkey/register-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(attResp),
      });

      const verifyResult = await verifyResp.json();

      if (!verifyResp.ok) {
        throw new Error(verifyResult.error || "Failed to verify Passkey.");
      }

      if (verifyResult.success) {
        setIsPasskeyEnabled(true);
        alert(
          "Passkey successfully activated! You can log in using biometrics.",
        );
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === "NotAllowedError") {
          alert("Passkey registration cancelled.");
        } else {
          alert(`Failed to activate Passkey: ${error.message}`);
        }
      } else {
        alert("An unknown system error occurred.");
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
    } catch {
      alert("An error occurred while removing passkey.");
    } finally {
      setIsRemovingPasskey(false);
    }
  };

  const handleToggle2FA = async () => {
    if (is2FAEnabled) {
      setShowDisable2FAModal(true);
      setShowProfileMenu(false);
      return;
    }

    try {
      setIs2FALoading(true);
      const resp = await fetch("/api/auth/2fa/setup", {
        method: "POST",
      });
      const data = await resp.json();

      if (!resp.ok) throw new Error(data.error || "Failed to initialize 2FA");

      setQrCode(data.qrCode);
      setBackupCodes(data.backupCodes);
      setShow2FASetupModal(true);
      setShowProfileMenu(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : "A system error occurred");
    } finally {
      setIs2FALoading(false);
    }
  };

  const handleVerify2FA = async () => {
    if (otpToken.length !== 6) return alert("Enter 6 digit code");

    try {
      setIsVerifying2FA(true);
      const resp = await fetch("/api/auth/2fa/verify-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: otpToken }),
      });
      const data = await resp.json();

      if (!resp.ok) throw new Error(data.error || "Invalid code");

      setIs2FAEnabled(true);
      setShow2FASetupModal(false);
      setOtpToken("");
    } catch (error) {
      alert(error instanceof Error ? error.message : "A system error occurred");
    } finally {
      setIsVerifying2FA(false);
    }
  };

  const confirmDisable2FA = async () => {
    try {
      setIsDisabling2FA(true);
      const resp = await fetch("/api/auth/2fa/disable", {
        method: "POST",
      });

      if (!resp.ok) throw new Error("Failed to turn off 2FA");

      setIs2FAEnabled(false);
      setShowDisable2FAModal(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : "A system error occurred");
    } finally {
      setIsDisabling2FA(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isInsideMain = menuRef.current?.contains(target);
      const isInsideSecurity = securityMenuRef.current?.contains(target);

      if (!isInsideMain && !isInsideSecurity) {
        setShowProfileMenu(false);
        setIsSecurityExpanded(false);
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
        if (showProfileMenu) {
          setShowProfileMenu(false);
          setIsSecurityExpanded(false);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    showLogoutModal,
    showProfileMenu,
    showRemovePasskeyModal,
    show2FASetupModal,
    showDisable2FAModal,
  ]);

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

  const profileMenuContent = (
    <div className="px-2 space-y-0.5 relative">
      <Link
        href="/dashboard/account"
        onClick={() => {
          setShowProfileMenu(false);
          setIsSecurityExpanded(false);
        }}
        className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
      >
        <User size={16} className="text-slate-400" />
        Account
      </Link>

      <button
        onClick={() => setIsDarkMode(!isDarkMode)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <Moon size={16} className="text-slate-400" />
          Dark Mode
        </div>
        <div
          className={`w-8 h-4.5 rounded-full relative transition-colors duration-300 shrink-0 ${isDarkMode ? "bg-teal-500" : "bg-slate-200"}`}
        >
          <div
            className={`absolute top-0.5 left-0.5 bg-white w-3.5 h-3.5 rounded-full transition-transform duration-300 ${isDarkMode ? "translate-x-3.5" : "translate-x-0"}`}
          ></div>
        </div>
      </button>

      <div className="my-1 border-t border-slate-100"></div>
      <div className="relative">
        <button
          ref={securityButtonRef}
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
              isSecurityExpanded ? "rotate-90 text-slate-900" : "text-slate-400"
            }`}
          />
        </button>

        {isSecurityExpanded &&
          typeof window !== "undefined" &&
          createPortal(
            <div
              ref={securityMenuRef}
              style={{ top: menuPos.top, left: menuPos.left }}
              className="fixed w-48 bg-white rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.08)] p-1.5 z-50 animate-in fade-in slide-in-from-left-1 duration-150"
            >
              <button
                onClick={handleTogglePasskey}
                disabled={isPasskeyLoading}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition ${
                  isPasskeyLoading
                    ? "opacity-50 cursor-wait text-slate-500"
                    : "text-slate-700 hover:bg-slate-50 cursor-pointer"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Fingerprint size={14} className="text-teal-600" />
                  <span>
                    {isPasskeyLoading ? "Processing..." : "Enable Passkey"}
                  </span>
                </div>
                <div
                  className={`w-7 h-4 rounded-full relative transition-colors duration-300 shrink-0 ${
                    isPasskeyEnabled ? "bg-teal-500" : "bg-slate-200"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 left-0.5 bg-white w-3 h-3 rounded-full transition-transform duration-300 ${
                      isPasskeyEnabled ? "translate-x-3" : "translate-x-0"
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
                    : "text-slate-700 hover:bg-slate-50 cursor-pointer"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Smartphone size={14} className="text-teal-600" />
                  <span>{is2FALoading ? "Processing..." : "Enable 2FA"}</span>
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
            </div>,
            document.body,
          )}
      </div>

      <div className="my-1 border-t border-slate-100"></div>

      <button
        onClick={() => {
          setShowProfileMenu(false);
          setIsSecurityExpanded(false);
          setShowLogoutModal(true);
        }}
        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 transition cursor-pointer"
      >
        <LogOut size={16} />
        Log out
      </button>
    </div>
  );

  return (
    <>
      <aside className="w-64 bg-white border-r border-slate-100 hidden lg:flex flex-col shrink-0 h-screen sticky top-0">
        <div className="h-16 flex items-center gap-2 px-6 border-b border-slate-100">
          <div className="h-8 w-8 rounded-lg bg-linear-to-br from-teal-400 to-teal-600 flex items-center justify-center">
            <Wallet size={16} className="text-white" />
          </div>
          <span className="font-bold text-slate-900">ExpenseAI</span>
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
                {profileMenuContent}
              </div>
            )}

            <button
              onClick={() => {
                const newValue = !showProfileMenu;
                setShowProfileMenu(newValue);
                if (!newValue) setIsSecurityExpanded(false);
              }}
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

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 flex items-center justify-around px-2 pb-safe pt-2 h-16 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
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
                  ? "text-teal-600"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <div
                className={`relative p-1 rounded-xl transition-all duration-300 ${isActive ? "bg-teal-50" : ""}`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span
                className={`text-[10px] font-medium ${isActive ? "text-teal-700" : "text-slate-500"}`}
              >
                {label.replace("AI ", "")}
              </span>
            </Link>
          );
        })}
      </nav>

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
                        className="text-slate-300 hover:text-teal-600 transition opacity-0 group-hover:opacity-100"
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
                Cancelled
              </button>
              <button
                type="button"
                disabled={isVerifying2FA || otpToken.length !== 6}
                onClick={handleVerify2FA}
                className="flex-1 px-4 py-2.5 rounded-xl bg-teal-600 text-sm font-medium text-white hover:bg-teal-700 transition cursor-pointer disabled:opacity-50 flex items-center justify-center"
              >
                {isVerifying2FA
                  ? "Verifying..."
                  : "Verification and Activation"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDisable2FAModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
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
                Cancelled
              </button>
              <button
                type="button"
                disabled={isDisabling2FA}
                onClick={confirmDisable2FA}
                className="flex-1 px-4 py-2.5 rounded-xl bg-amber-500 text-sm font-medium text-white hover:bg-amber-600 transition cursor-pointer disabled:opacity-50 flex items-center justify-center"
              >
                {isDisabling2FA ? "Turn off..." : "Yes, Turn Off"}
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
                {isLoggingOut ? "Logout..." : "Yes, Logout"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
