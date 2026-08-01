"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import { requestPasswordReset, verifyPasswordResetOtp } from "@/services/auth";
import Spinner from "@/components/Spinner";

interface OtpStepProps {
  email: string;
  onChangeEmail: () => void;
  onSuccess: (token: string) => void;
}

export default function OtpStep({
  email,
  onChangeEmail,
  onSuccess,
}: OtpStepProps) {
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [countdown, setCountdown] = useState(0);
  const canResend = countdown === 0;

  useEffect(() => {
    const timer = setTimeout(() => {
      const savedExpiry = localStorage.getItem("otp_resend_expiry");
      if (savedExpiry) {
        const remaining = Math.floor(
          (parseInt(savedExpiry) - new Date().getTime()) / 1000,
        );
        if (remaining > 0) setCountdown(remaining);
      }
      if (inputRefs.current[0]) inputRefs.current[0].focus();
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            localStorage.removeItem("otp_resend_expiry");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [countdown]);

  const handleChangeOtp = (index: number, value: string) => {
    if (isNaN(Number(value))) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
    if (newOtp.every((digit) => digit !== "")) verifyOtp(newOtp.join(""));
  };

  const handleKeyDownOtp = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const verifyOtp = async (otpCode: string) => {
    setLoading(true);
    try {
      const res = await verifyPasswordResetOtp(email, otpCode);
      if (res.error) {
        toast.error(res.error);
        setOtp(Array(6).fill(""));
        inputRefs.current[0]?.focus();
        return;
      }
      toast.success("Verification Successful!");
      onSuccess(res.token as string);
    } catch {
      toast.error("An unexpected error occurred during verification.");
      setOtp(Array(6).fill(""));
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    setCountdown(60);
    try {
      const result = await requestPasswordReset(email);
      if (result.error) {
        toast.error(result.error);
        setCountdown(0);
        return;
      }
      localStorage.setItem(
        "otp_resend_expiry",
        (new Date().getTime() + 60000).toString(),
      );
      toast.success("New OTP code has been resent!");
    } catch {
      toast.error("Failed to resend OTP. Please try again.");
      setCountdown(0);
      localStorage.removeItem("otp_resend_expiry");
    }
  };

  return (
    <motion.div
      key="otp-step"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center text-center"
    >
      <div className="w-full flex justify-start mb-8">
        <button
          onClick={onChangeEmail}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft size={16} />
          Change Email
        </button>
      </div>

      <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
        Email Verification
      </h2>
      <p className="text-slate-500 text-sm mb-10 max-w-sm">
        We&apos;ve sent a 6-digit code to{" "}
        <span className="font-semibold text-slate-700">{email}</span>.
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
            onChange={(e) => handleChangeOtp(index, e.target.value)}
            onKeyDown={(e) => handleKeyDownOtp(index, e)}
            className={`w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold rounded-2xl border-2 transition-all focus:outline-none ${
              digit
                ? "bg-white border-teal-500 text-teal-600 shadow-sm shadow-teal-500/20"
                : "bg-slate-100/80 border-transparent text-slate-900 focus:bg-white focus:border-teal-500"
            }`}
          />
        ))}
      </div>

      <div className="h-6">
        {loading && (
          <div className="flex items-center gap-2 text-sm text-teal-600 font-medium">
            <Spinner size="sm" /> Verify code...
          </div>
        )}
      </div>

      <p className="text-sm text-slate-500 mt-8">
        Didn&apos;t receive the code?{" "}
        {canResend ? (
          <button
            type="button"
            onClick={handleResendOtp}
            className="text-teal-600 font-semibold hover:text-teal-700 transition cursor-pointer"
          >
            Resend
          </button>
        ) : (
          <span className="text-slate-400 font-medium">
            Resend in {countdown}s
          </span>
        )}
      </p>
    </motion.div>
  );
}
