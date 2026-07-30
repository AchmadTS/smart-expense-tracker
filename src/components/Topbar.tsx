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
} from "lucide-react";
import { BarProps } from "@/types/user";
import { startRegistration } from "@simplewebauthn/browser";
import { showToast } from "@/lib/toast";

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
  const [isPasskeyEnabled, setIsPasskeyEnabled] = useState(false);
  const [isPasskeyLoading, setIsPasskeyLoading] = useState(false);
  const [showRemovePasskeyModal, setShowRemovePasskeyModal] = useState(false);
  const [isRemovingPasskey, setIsRemovingPasskey] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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
        showToast("Passkey successfully activated! You can log in using biometrics.", "success");
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
    } catch {
      showToast("An error occurred while removing passkey.", "error");
    } finally {
      setIsRemovingPasskey(false);
    }
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
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
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
        if (isMobileMenuOpen) {
          setIsMobileMenuOpen(false);
          setIsSecurityExpanded(false);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showLogoutModal, showRemovePasskeyModal, isMobileMenuOpen]);

  const currentPageName = pathname
    ? pathname.split("/").filter(Boolean).pop() || "dashboard"
    : "dashboard";

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
          <button
            title="Notifications"
            className="relative h-9 w-9 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900 flex items-center justify-center transition cursor-pointer"
          >
            <Bell size={17} />
            <span className="absolute top-2 right-2 h-2 w-2 bg-rose-500 rounded-full ring-2 ring-white" />
          </button>

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
                        className={`transition-colors duration-200 ${isSecurityExpanded ? "rotate-90 text-slate-900" : "text-slate-400"}`}
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
                            className={`w-7 h-4 rounded-full relative transition-colors duration-300 shrink-0 ${isPasskeyEnabled ? "bg-teal-500" : "bg-slate-200"}`}
                          >
                            <div
                              className={`absolute top-0.5 left-0.5 bg-white w-3 h-3 rounded-full transition-transform duration-300 ${isPasskeyEnabled ? "translate-x-3" : "translate-x-0"}`}
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
                      className={`w-8 h-4.5 rounded-full relative transition-colors duration-300 shrink-0 ${isDarkMode ? "bg-teal-500" : "bg-slate-200"}`}
                    >
                      <div
                        className={`absolute top-0.5 left-0.5 bg-white w-3.5 h-3.5 rounded-full transition-transform duration-300 ${isDarkMode ? "translate-x-3.5" : "translate-x-0"}`}
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
