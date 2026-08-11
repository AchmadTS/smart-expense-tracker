"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { BarProps } from "@/types/user";
import { startRegistration } from "@simplewebauthn/browser";
import { showToast } from "@/lib/toast";
import ToastContainer from "@/components/ui/ToastContainer";
import DesktopSidebar from "./DesktopSidebar";
import MobileBottomNav from "./MobileBottomNav";
import TwoFactorSetupModal from "@/components/modals/TwoFactorSetupModal";
import Disable2FAModal from "@/components/modals/Disable2FAModal";
import LogoutModal from "@/components/modals/LogoutModal";
import RemovePasskeyModal from "@/components/modals/RemovePasskeyModal";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/transactions", label: "Transactions" },
  { href: "/dashboard/categories", label: "Categories" },
  { href: "/dashboard/budgets", label: "Budgets" },
  { href: "/dashboard/insights", label: "AI Insights" },
];

export default function Sidebar({ user }: BarProps) {
  const pathname = usePathname();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showRemovePasskeyModal, setShowRemovePasskeyModal] = useState(false);
  const [isRemovingPasskey, setIsRemovingPasskey] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === "undefined") return false;
    const saved = localStorage.getItem("theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  const [isSecurityExpanded, setIsSecurityExpanded] = useState(false);
  const [isPasskeyEnabled, setIsPasskeyEnabled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const securityMenuRef = useRef<HTMLDivElement>(null);
  
  const [is2FAEnabled, setIs2FAEnabled] = useState<boolean>(
    user?.isTwoFactorEnabled || false,
  );

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
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

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
        showToast("Passkey successfully activated!", "success");
      }
    } catch (error) {
      if (error instanceof Error && error.name !== "NotAllowedError") {
        showToast(`Failed to activate Passkey: ${error.message}`, "error");
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
        credentials: "include",
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
      setShowProfileMenu(false);
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
      setShowProfileMenu(false);
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

  return (
    <>
      <DesktopSidebar
        user={user}
        showProfileMenu={showProfileMenu}
        setShowProfileMenu={setShowProfileMenu}
        isSecurityExpanded={isSecurityExpanded}
        setIsSecurityExpanded={setIsSecurityExpanded}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        menuRef={menuRef}
        securityMenuRef={securityMenuRef}
        securityButtonRef={securityButtonRef}
        menuPos={menuPos}
        isPasskeyEnabled={isPasskeyEnabled}
        isPasskeyLoading={isPasskeyLoading}
        onTogglePasskey={handleTogglePasskey}
        is2FAEnabled={is2FAEnabled}
        is2FALoading={is2FALoading}
        onToggle2FA={handleToggle2FA}
        onOpenLogout={() => setShowLogoutModal(true)}
      />

      <MobileBottomNav />

      <TwoFactorSetupModal
        isOpen={show2FASetupModal}
        onClose={() => setShow2FASetupModal(false)}
        onVerify={handleVerify2FA}
        qrCode={qrCode}
        backupCodes={backupCodes}
        otpToken={otpToken}
        setOtpToken={setOtpToken}
        isVerifying={isVerifying2FA}
        copiedCode={copiedCode}
        onCopy={copyToClipboard}
      />

      <Disable2FAModal
        isOpen={showDisable2FAModal}
        onClose={() => setShowDisable2FAModal(false)}
        onConfirm={confirmDisable2FA}
        isDisabling={isDisabling2FA}
      />

      <RemovePasskeyModal
        isOpen={showRemovePasskeyModal}
        onClose={() => setShowRemovePasskeyModal(false)}
        onConfirm={confirmRemovePasskey}
        isRemoving={isRemovingPasskey}
      />

      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
        isLoggingOut={isLoggingOut}
        currentPageName={currentPageName}
      />

      <ToastContainer />
    </>
  );
}
