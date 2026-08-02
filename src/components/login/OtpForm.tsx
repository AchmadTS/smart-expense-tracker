"use client";

import { useState, useRef } from "react";
import { ArrowLeft, Shield } from "lucide-react";
import { motion } from "framer-motion";
import Spinner from "@/components/Spinner";
import { showToast } from "@/lib/toast";
import { LoginFormData } from "./LoginForm";

interface OtpFormProps {
  userEmail: string;
  tempToken: string;
  formVals: LoginFormData | null;
  onBack: () => void;
  onSwitchToBackup: () => void;
}

export default function OtpForm({
  userEmail,
  tempToken,
  formVals,
  onBack,
  onSwitchToBackup,
}: OtpFormProps) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [verifyingOTP, setVerifyingOTP] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleVerifyOTP = async (codeStr: string) => {
    setVerifyingOTP(true);
    try {
      const res = await fetch("/api/auth/2fa/verify-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tempToken, code: codeStr }),
      });
      const result = await res.json();

      if (!res.ok) throw new Error(result.message || "Invalid code");

      if (formVals?.rememberMe) {
        localStorage.setItem("remembered_email", formVals.email);
        localStorage.setItem("remembered_password", formVals.password);
      } else {
        localStorage.removeItem("remembered_email");
        localStorage.removeItem("remembered_password");
      }

      showToast("Welcome back!", "success");
      window.location.replace("/dashboard");
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Invalid code",
        "error",
      );
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setVerifyingOTP(false);
    }
  };

  const handleChangeOtp = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) inputRefs.current[index + 1]?.focus();
    if (newOtp.every((d) => d !== "")) handleVerifyOTP(newOtp.join(""));
  };

  const handleKeyDownOtp = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <motion.div
      key="otp-step"
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
          <ArrowLeft size={16} /> Back to Login
        </button>
      </div>

      <div className="h-16 w-16 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600 mb-6">
        <Shield size={32} />
      </div>

      <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
        Two-Factor Auth
      </h2>
      <p className="text-slate-500 text-sm mb-10 max-w-sm">
        Please open your Authenticator app (e.g., Google Authenticator or Authy)
        to find the code for{" "}
        <span className="font-semibold text-slate-700">{userEmail}</span>.
      </p>

      <div className="flex items-center justify-center gap-2.5 sm:gap-4 mb-8">
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            disabled={verifyingOTP}
            onChange={(e) => handleChangeOtp(index, e.target.value)}
            onKeyDown={(e) => handleKeyDownOtp(index, e)}
            className={`w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold rounded-2xl border-2 transition-all focus:outline-none disabled:opacity-50 ${
              digit
                ? "bg-white border-teal-500 text-teal-600 shadow-sm shadow-teal-500/20"
                : "bg-slate-100/80 border-transparent text-slate-900 focus:bg-white focus:border-teal-500"
            }`}
          />
        ))}
      </div>

      <div className="h-6">
        {verifyingOTP && (
          <div className="flex items-center gap-2 text-sm text-teal-600 font-medium">
            <Spinner size="sm" /> Verifying code...
          </div>
        )}
      </div>

      <p className="text-sm text-slate-500 mt-8">
        Lost access to your device?{" "}
        <button
          type="button"
          onClick={onSwitchToBackup}
          className="text-teal-600 font-semibold hover:text-teal-700 transition cursor-pointer"
        >
          Use Backup Code
        </button>
      </p>
    </motion.div>
  );
}
