"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Wallet, ArrowLeft, Mail } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AuthHero from "@/components/AuthHero";
import Spinner from "@/components/Spinner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { requestPasswordReset, verifyPasswordResetOtp } from "@/services/auth";

const emailSchema = z.object({
  email: z.string().email("Invalid email format"),
});

type EmailFormData = z.infer<typeof emailSchema>;
type Step = "EMAIL" | "OTP" | "SUCCESS";

export default function ForgotPassword() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [step, setStep] = useState<Step>("EMAIL");
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [countdown, setCountdown] = useState(0);
  const canResend = countdown === 0;
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
  });

  useEffect(() => {
    sessionStorage.setItem("last_auth_page", window.location.pathname);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      const savedStep = localStorage.getItem("forgot_step") as Step;
      const savedEmail = localStorage.getItem("forgot_email");
      const savedExpiry = localStorage.getItem("otp_resend_expiry");

      if (savedStep && savedStep !== "EMAIL" && savedEmail) {
        setStep(savedStep);
        setUserEmail(savedEmail);
      }

      if (savedExpiry) {
        const remaining = Math.floor(
          (parseInt(savedExpiry) - new Date().getTime()) / 1000,
        );
        if (remaining > 0) {
          setCountdown(remaining);
        }
      }

      setIsMounted(true);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const onSubmitEmail = async (data: EmailFormData) => {
    setLoading(true);
    try {
      await requestPasswordReset(data.email);
      localStorage.setItem("forgot_step", "OTP");
      localStorage.setItem("forgot_email", data.email);
      localStorage.setItem(
        "otp_resend_expiry",
        (new Date().getTime() + 60000).toString(),
      );

      setUserEmail(data.email);
      setStep("OTP");
      setCountdown(60);
      toast.success("OTP code has been sent!");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to send OTP";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeOtp = (index: number, value: string) => {
    if (isNaN(Number(value))) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newOtp.every((digit) => digit !== "")) {
      verifyOtp(newOtp.join(""));
    }
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
      const res = await verifyPasswordResetOtp(userEmail, otpCode);
      localStorage.setItem("reset_token", res.token);
      localStorage.setItem("forgot_step", "SUCCESS");
      setStep("SUCCESS");
      toast.success("Verification Successful!");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Wrong OTP code";
      toast.error(message);
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
      await requestPasswordReset(userEmail);
      localStorage.setItem(
        "otp_resend_expiry",
        (new Date().getTime() + 60000).toString(),
      );
      toast.success("New OTP code has been resent!");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to resend OTP";
      toast.error(message);
      setCountdown(0);
      localStorage.removeItem("otp_resend_expiry");
    }
  };

  useEffect(() => {
    if (step === "OTP" && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [step]);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (step === "OTP" && countdown > 0) {
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
  }, [step, countdown]);

  const handleClearFlow = () => {
    localStorage.removeItem("forgot_step");
    localStorage.removeItem("forgot_email");
    localStorage.removeItem("otp_resend_expiry");
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen flex bg-white">
      <div className="flex-1 flex flex-col px-6 sm:px-10 lg:px-14 py-8 order-1">
        <div className="flex justify-start items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-linear-to-br from-teal-400 to-teal-600 flex items-center justify-center">
            <Wallet size={18} className="text-white" />
          </div>
          <span className="font-bold text-xl text-slate-900">
            Smart Expense
          </span>
        </div>

        <div className="flex-1 flex items-center justify-center py-10 relative">
          <div className="w-full max-w-md relative">
            <AnimatePresence mode="wait">
              {step === "EMAIL" && (
                <motion.div
                  key="email-step"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Link
                    href="/login"
                    onClick={handleClearFlow}
                    className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition mb-8"
                  >
                    <ArrowLeft size={16} />
                    Back to Login
                  </Link>

                  <h2 className="text-4xl font-bold text-slate-900 tracking-tight mb-2">
                    Forgot Password?
                  </h2>
                  <p className="text-slate-500 mb-10">
                    Enter your email to get a verification code.
                  </p>

                  <form
                    onSubmit={handleSubmit(onSubmitEmail)}
                    className="space-y-5"
                  >
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">
                        Email
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          {...register("email")}
                          className="w-full bg-slate-100/80 hover:bg-slate-100 focus:bg-white border-2 border-transparent focus:border-teal-500 rounded-2xl px-5 py-4 pl-12 text-slate-900 text-sm focus:outline-none transition"
                          placeholder="you@example.com"
                        />
                        <Mail
                          size={18}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                      </div>
                      {errors.email && (
                        <p className="text-xs text-rose-500 mt-1 pl-1">
                          {errors.email.message}
                        </p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full inline-flex items-center justify-center gap-2 bg-linear-to-br from-teal-400 to-teal-600 active:from-teal-500 active:to-teal-700 text-white font-semibold py-4 rounded-2xl transition shadow-lg shadow-teal-600/20 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer mt-4"
                    >
                      {loading ? (
                        <>
                          <Spinner size="sm" />
                          Send OTP...
                        </>
                      ) : (
                        "Send OTP"
                      )}
                    </button>
                  </form>
                </motion.div>
              )}

              {step === "OTP" && (
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
                      onClick={() => {
                        handleClearFlow();
                        setStep("EMAIL");
                      }}
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
                    <span className="font-semibold text-slate-700">
                      {userEmail}
                    </span>
                    . The code will be automatically verified.
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
                        <Spinner size="sm" />
                        Verify code...
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
              )}

              {step === "SUCCESS" && (
                <motion.div
                  key="success-step"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  className="flex flex-col items-center text-center py-10"
                >
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 260,
                      damping: 20,
                      delay: 0.1,
                    }}
                    className="relative w-24 h-24 mb-8 flex items-center justify-center rounded-3xl bg-teal-50 border-2 border-teal-200"
                  >
                    <motion.div
                      className="absolute inset-0 bg-teal-400 rounded-3xl blur-xl"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.3 }}
                      transition={{ delay: 0.5, duration: 1 }}
                    />

                    <svg
                      className="w-10 h-10 text-teal-500 relative z-10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <motion.path
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{
                          duration: 0.6,
                          delay: 0.3,
                          ease: "easeOut",
                        }}
                        d="M20 6L9 17l-5-5"
                      />
                    </svg>
                  </motion.div>

                  <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.4 }}
                    className="text-3xl font-bold text-slate-900 tracking-tight mb-2"
                  >
                    Verification Successful
                  </motion.h2>

                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7, duration: 0.4 }}
                    className="text-slate-500 mb-10 max-w-xs"
                  >
                    Your account has been successfully verified. Please set a
                    new password.
                  </motion.p>

                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9, duration: 0.4 }}
                    onClick={() => {
                      handleClearFlow();
                      const token = localStorage.getItem("reset_token");
                      router.push(`/reset-password?token=${token}`);
                    }}
                    className="w-full inline-flex items-center justify-center gap-2 bg-linear-to-br from-teal-400 to-teal-600 active:from-teal-500 active:to-teal-700 text-white font-semibold py-4 rounded-2xl transition shadow-lg shadow-teal-600/20 cursor-pointer"
                  >
                    Create New Password
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex justify-start gap-6 text-xs text-slate-500">
          <a className="hover:text-slate-900 transition cursor-pointer">
            Privacy Policy
          </a>
          <a className="hover:text-slate-900 transition cursor-pointer">
            Terms
          </a>
          <a className="hover:text-slate-900 transition cursor-pointer">FAQ</a>
        </div>
      </div>

      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] order-2">
        <AuthHero headline="SExpense" subheadline="Safe and encrypted" />
      </div>
    </div>
  );
}
