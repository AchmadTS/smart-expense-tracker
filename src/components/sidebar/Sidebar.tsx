"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { BarProps } from "@/types/user";
import ToastContainer from "@/components/ui/ToastContainer";
import DesktopSidebar from "./DesktopSidebar";
import MobileBottomNav from "./MobileBottomNav";
import TwoFactorSetupModal from "@/components/modals/TwoFactorSetupModal";
import Disable2FAModal from "@/components/modals/Disable2FAModal";
import LogoutModal from "@/components/modals/LogoutModal";
import RemovePasskeyModal from "@/components/modals/RemovePasskeyModal";
import { navItems } from "@/config/navigation";
import { useDarkMode } from "@/hooks/useDarkMode";
import { useSecurity } from "@/hooks/useSecurity";

export default function Sidebar({ user }: BarProps) {
  const pathname = usePathname();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isSecurityExpanded, setIsSecurityExpanded] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const securityMenuRef = useRef<HTMLDivElement>(null);
  const securityButtonRef = useRef<HTMLButtonElement>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const { isDarkMode, setIsDarkMode } = useDarkMode();

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
    setShowRemovePasskeyModal,
    setShow2FASetupModal,
    setShowDisable2FAModal,
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
        user={user ?? null}
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
        onTogglePasskey={() =>
          handleTogglePasskey(() => setShowProfileMenu(false))
        }
        is2FAEnabled={is2FAEnabled}
        is2FALoading={is2FALoading}
        onToggle2FA={() => handleToggle2FA(() => setShowProfileMenu(false))}
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
