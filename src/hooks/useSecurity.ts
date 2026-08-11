"use client";

import { useState, useEffect } from "react";
import { startRegistration } from "@simplewebauthn/browser";
import { showToast } from "@/lib/toast";

interface UseSecurityProps {
    initial2FA?: boolean | null;
}

export function useSecurity({ initial2FA = false }: UseSecurityProps = {}) {
    const [isPasskeyEnabled, setIsPasskeyEnabled] = useState(false);
    const [isPasskeyLoading, setIsPasskeyLoading] = useState(false);
    const [showRemovePasskeyModal, setShowRemovePasskeyModal] = useState(false);
    const [isRemovingPasskey, setIsRemovingPasskey] = useState(false);
    const [is2FAEnabled, setIs2FAEnabled] = useState<boolean>(initial2FA ?? false);
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

    const handleTogglePasskey = async (onTriggerMenuClose?: () => void) => {
        if (isPasskeyEnabled) {
            setShowRemovePasskeyModal(true);
            if (onTriggerMenuClose) onTriggerMenuClose();
            return;
        }

        try {
            setIsPasskeyLoading(true);
            const resp = await fetch("/api/auth/passkey/register-options", {
                credentials: "include",
            });
            const data = await resp.json();

            if (!resp.ok) throw new Error(data.error || "Failed to load passkey options.");

            const attResp = await startRegistration({ optionsJSON: data });
            const verifyResp = await fetch("/api/auth/passkey/register-verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(attResp),
            });

            const verifyResult = await verifyResp.json();
            if (!verifyResp.ok) throw new Error(verifyResult.error || "Failed to verify Passkey.");

            if (verifyResult.success) {
                setIsPasskeyEnabled(true);
                showToast("Passkey successfully activated! You can log in using biometrics.", "success");
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

    const handleToggle2FA = async (onTriggerMenuClose?: () => void) => {
        if (is2FAEnabled) {
            setShowDisable2FAModal(true);
            if (onTriggerMenuClose) onTriggerMenuClose();
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
            if (onTriggerMenuClose) onTriggerMenuClose();
        } catch (error) {
            showToast(error instanceof Error ? error.message : "A system error occurred", "error");
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
            showToast(error instanceof Error ? error.message : "A system error occurred", "error");
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
            showToast(error instanceof Error ? error.message : "A system error occurred", "error");
        } finally {
            setIsDisabling2FA(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedCode(text);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    return {
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
    };
}