"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Wallet, Eye, EyeOff, KeyRound, ArrowLeft, Shield } from "lucide-react";
import AuthHero from "@/components/AuthHero";
import Spinner from "@/components/Spinner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { startAuthentication } from "@simplewebauthn/browser";
import { motion, AnimatePresence } from "framer-motion";

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const [step, setStep] = useState<"LOGIN" | "OTP">("LOGIN");
  const [loading, setLoading] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [tempToken, setTempToken] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [verifyingOTP, setVerifyingOTP] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  useEffect(() => {
    const savedEmail = localStorage.getItem("remembered_email") || "";
    const savedPassword = localStorage.getItem("remembered_password") || "";

    if (savedEmail || savedPassword) {
      reset({ email: savedEmail, password: savedPassword, rememberMe: true });
    }
  }, [reset]);

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();

      if (!res.ok) throw new Error(result.message || "Login failed");

      if (result.requires2FA) {
        setTempToken(result.tempToken);
        setUserEmail(result.email);
        setStep("OTP");
      } else {
        if (data.rememberMe) {
          localStorage.setItem("remembered_email", data.email);
          localStorage.setItem("remembered_password", data.password);
        } else {
          localStorage.removeItem("remembered_email");
          localStorage.removeItem("remembered_password");
        }
        toast.success("Welcome back!");
        window.location.replace("/dashboard");
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Login failed";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

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

      const formVals = getValues();
      if (formVals.rememberMe) {
        localStorage.setItem("remembered_email", formVals.email);
        localStorage.setItem("remembered_password", formVals.password);
      } else {
        localStorage.removeItem("remembered_email");
        localStorage.removeItem("remembered_password");
      }

      toast.success("Welcome back!");
      window.location.replace("/dashboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Invalid code");
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

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newOtp.every((d) => d !== "")) {
      handleVerifyOTP(newOtp.join(""));
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

  const handlePasskeyLogin = async () => {
    setPasskeyLoading(true);
    try {
      const resp = await fetch("/api/auth/passkey/login-options", {
        credentials: "include",
      });
      const data = await resp.json();

      if (!resp.ok) {
        throw new Error(data.error || "Failed to load passkey login options.");
      }

      const authResp = await startAuthentication({ optionsJSON: data });
      const verifyResp = await fetch("/api/auth/passkey/login-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(authResp),
      });

      const verifyResult = await verifyResp.json();

      if (!verifyResp.ok) {
        throw new Error(verifyResult.error || "Passkey verification failed.");
      }

      if (verifyResult.success) {
        toast.success("Signed in with Passkey successfully!");
        window.location.replace("/dashboard");
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.name === "NotAllowedError") {
          toast.error("Passkey sign-in cancelled.");
        } else toast.error(error.message);
      } else toast.error("An unknown error occurred during Passkey login.");
    } finally {
      setPasskeyLoading(false);
    }
  };

  useEffect(() => {
    sessionStorage.setItem("last_auth_page", window.location.pathname);
  }, []);

  return (
    <div className="min-h-screen flex bg-white overflow-hidden">
      <div className="flex-1 flex flex-col px-6 sm:px-10 lg:px-14 py-8 order-1 relative z-10 bg-white shadow-[10px_0_30px_rgba(0,0,0,0.02)]">
        <div className="flex justify-start items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-linear-to-br from-teal-400 to-teal-600 flex items-center justify-center">
            <Wallet size={18} className="text-white" />
          </div>
          <span className="font-bold text-xl text-slate-900">
            Smart Expense
          </span>
        </div>

        <div className="flex-1 flex items-center justify-center py-10 overflow-hidden relative">
          <AnimatePresence mode="wait">
            {step === "LOGIN" && (
              <motion.div
                key="login-step"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-md absolute"
              >
                <h2 className="text-4xl font-bold text-slate-900 tracking-tight mb-2">
                  Sign In
                </h2>
                <p className="text-slate-500 mb-10">Please login to continue</p>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">
                      Email
                    </label>
                    <input
                      type="email"
                      {...register("email")}
                      className="w-full bg-slate-100/80 hover:bg-slate-100 focus:bg-white border-2 border-transparent focus:border-teal-500 rounded-2xl px-5 py-4 text-slate-900 text-sm focus:outline-none transition"
                      placeholder="you@example.com"
                    />
                    {errors.email && (
                      <p className="text-xs text-rose-500 mt-1 pl-1">
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        {...register("password")}
                        className="w-full bg-slate-100/80 hover:bg-slate-100 focus:bg-white border-2 border-transparent focus:border-teal-500 rounded-2xl px-5 py-4 pr-12 text-slate-900 text-sm focus:outline-none transition"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-xs text-rose-500 mt-1 pl-1">
                        {errors.password.message}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-sm pt-1">
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        {...register("rememberMe")}
                        className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 accent-teal-600 cursor-pointer"
                      />
                      <span className="text-slate-600 text-xs font-medium">
                        Remember me
                      </span>
                    </label>

                    <Link
                      href="/forgot-password"
                      onClick={() =>
                        localStorage.setItem(
                          "auth_origin",
                          window.location.pathname,
                        )
                      }
                      className="text-xs font-semibold text-teal-600 hover:text-teal-700 transition"
                    >
                      Forgot Password?
                    </Link>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full inline-flex items-center justify-center gap-2 bg-linear-to-br from-teal-400 to-teal-600 active:from-teal-500 active:to-teal-700 text-white font-semibold py-4 rounded-2xl transition shadow-lg shadow-teal-600/20 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Spinner size="sm" /> Signing in...
                      </>
                    ) : (
                      "Login"
                    )}
                  </button>
                </form>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-3 text-slate-400 font-medium">
                      Or
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handlePasskeyLogin}
                  disabled={passkeyLoading}
                  className="w-full inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 font-semibold py-4 rounded-2xl transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {passkeyLoading ? (
                    <>
                      <Spinner size="sm" /> Verifying Passkey...
                    </>
                  ) : (
                    <>
                      <KeyRound size={18} className="text-teal-600" /> Sign in
                      with Passkey
                    </>
                  )}
                </button>
                <p className="text-center mt-8 text-sm text-slate-500">
                  No Account Yet?{" "}
                  <Link
                    href="/register"
                    className="text-teal-600 font-semibold hover:text-teal-700 transition"
                  >
                    Get Yours Now
                  </Link>
                </p>
              </motion.div>
            )}

            {step === "OTP" && (
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
                    onClick={() => {
                      setStep("LOGIN");
                      setOtp(["", "", "", "", "", ""]);
                    }}
                    className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition"
                  >
                    <ArrowLeft size={16} />
                    Back to Login
                  </button>
                </div>

                <div className="h-16 w-16 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600 mb-6">
                  <Shield size={32} />
                </div>

                <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
                  Two-Factor Auth
                </h2>
                <p className="text-slate-500 text-sm mb-10 max-w-sm">
                  Please open your Authenticator app (e.g., Google Authenticator
                  or Authy) to find the code for{" "}
                  <span className="font-semibold text-slate-700">
                    {userEmail}
                  </span>
                  .
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
                      <Spinner size="sm" />
                      Verifying code...
                    </div>
                  )}
                </div>

                <p className="text-sm text-slate-500 mt-8">
                  Lost access to your device?{" "}
                  <button
                    type="button"
                    className="text-teal-600 font-semibold hover:text-teal-700 transition cursor-pointer"
                  >
                    Use Backup Code
                  </button>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex justify-start gap-6 text-xs text-slate-500 relative z-10 bg-white">
          <a className="hover:text-slate-900 transition cursor-pointer">
            Privacy Policy
          </a>
          <a className="hover:text-slate-900 transition cursor-pointer">
            Terms
          </a>
          <a className="hover:text-slate-900 transition cursor-pointer">FAQ</a>
        </div>
      </div>

      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] order-2 relative z-0">
        <AuthHero headline="SExpense" subheadline="Your financial future" />
      </div>
    </div>
  );
}
