"use client";

import { useState, useRef } from "react";
import { ArrowLeft, Shield } from "lucide-react";
import { motion } from "framer-motion";
import Spinner from "@/components/Spinner";
import { showToast } from "@/lib/toast";
import { LoginFormData } from "./LoginForm";

interface BackupCodeFormProps {
  tempToken: string;
  formVals: LoginFormData | null;
  onBack: () => void;
}

export default function BackupCodeForm({
  tempToken,
  formVals,
  onBack,
}: BackupCodeFormProps) {
  const [backupCode, setBackupCode] = useState([
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  const [verifyingBackup, setVerifyingBackup] = useState(false);
  const backupInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleVerifyBackupSubmit = async (codeStr: string) => {
    setVerifyingBackup(true);
    try {
      const res = await fetch("/api/auth/2fa/verify-backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tempToken, backupCode: codeStr }),
      });
      const result = await res.json();

      if (!res.ok) throw new Error(result.message || "Invalid backup code");

      if (formVals?.rememberMe) {
        localStorage.setItem("remembered_email", formVals.email);
        localStorage.setItem("remembered_password", formVals.password);
      } else {
        localStorage.removeItem("remembered_email");
        localStorage.removeItem("remembered_password");
      }

      showToast(
        "Welcome back! Remember to generate new backup codes.",
        "success",
      );
      window.location.replace("/dashboard");
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Invalid code",
        "error",
      );
      setBackupCode(["", "", "", "", "", "", "", ""]);
      backupInputRefs.current[0]?.focus();
    } finally {
      setVerifyingBackup(false);
    }
  };

  const handleChangeBackup = (index: number, value: string) => {
    const cleanValue = value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    if (value && !cleanValue) return;

    const newCode = [...backupCode];
    newCode[index] = cleanValue;
    setBackupCode(newCode);

    if (cleanValue && index < 7) backupInputRefs.current[index + 1]?.focus();
    if (newCode.every((d) => d !== ""))
      handleVerifyBackupSubmit(newCode.join(""));
  };

  const handleKeyDownBackup = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !backupCode[index] && index > 0) {
      backupInputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <motion.div
      key="backup-step"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center text-center w-full max-w-md absolute"
    >
      <div className="w-full flex justify-start mb-8">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft size={16} /> Back to Authenticator
        </button>
      </div>

      <div className="h-16 w-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 mb-6">
        <Shield size={32} />
      </div>

      <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
        Emergency Login
      </h2>
      <p className="text-slate-500 text-sm mb-10 max-w-sm">
        Enter one of your 8-character backup codes. Each code can only be used
        once.
      </p>

      <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-8">
        <div className="flex gap-1.5 sm:gap-2">
          {backupCode.slice(0, 4).map((digit, idx) => (
            <input
              key={`backup1-${idx}`}
              ref={(el) => {
                backupInputRefs.current[idx] = el;
              }}
              type="text"
              maxLength={1}
              value={digit}
              disabled={verifyingBackup}
              onChange={(e) => handleChangeBackup(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDownBackup(idx, e)}
              className={`w-9 h-12 sm:w-11 sm:h-14 text-center text-xl font-bold rounded-xl border-2 transition-all focus:outline-none disabled:opacity-50 uppercase ${
                digit
                  ? "bg-white border-teal-500 text-teal-600 shadow-sm shadow-teal-500/20"
                  : "bg-slate-100/80 border-transparent text-slate-900 focus:bg-white focus:border-teal-500"
              }`}
            />
          ))}
        </div>

        <span className="text-slate-300 font-bold text-2xl pb-1">-</span>

        <div className="flex gap-1.5 sm:gap-2">
          {backupCode.slice(4, 8).map((digit, idx) => {
            const actualIndex = idx + 4;
            return (
              <input
                key={`backup2-${actualIndex}`}
                ref={(el) => {
                  backupInputRefs.current[actualIndex] = el;
                }}
                type="text"
                maxLength={1}
                value={digit}
                disabled={verifyingBackup}
                onChange={(e) =>
                  handleChangeBackup(actualIndex, e.target.value)
                }
                onKeyDown={(e) => handleKeyDownBackup(actualIndex, e)}
                className={`w-9 h-12 sm:w-11 sm:h-14 text-center text-xl font-bold rounded-xl border-2 transition-all focus:outline-none disabled:opacity-50 uppercase ${
                  digit
                    ? "bg-white border-teal-500 text-teal-600 shadow-sm shadow-teal-500/20"
                    : "bg-slate-100/80 border-transparent text-slate-900 focus:bg-white focus:border-teal-500"
                }`}
              />
            );
          })}
        </div>
      </div>

      <div className="h-6">
        {verifyingBackup && (
          <div className="flex items-center gap-2 text-sm text-teal-600 font-medium">
            <Spinner size="sm" /> Verifying code...
          </div>
        )}
      </div>
    </motion.div>
  );
}
