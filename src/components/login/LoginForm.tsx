"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Eye, EyeOff, KeyRound, Clock } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { startAuthentication } from "@simplewebauthn/browser";
import { motion } from "framer-motion";
import Spinner from "@/components/Spinner";
import { showToast } from "@/lib/toast";
import {
  getSavedLockoutRemaining,
  setLockoutDuration,
  clearLockout,
} from "@/utils/auth-lockout";

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onRequire2FA: (data: {
    tempToken: string;
    email: string;
    formVals: LoginFormData;
  }) => void;
}

export default function LoginForm({ onRequire2FA }: LoginFormProps) {
  const [loading, setLoading] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(() => {
    return getSavedLockoutRemaining();
  });

  const {
    register,
    handleSubmit,
    reset,
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

  useEffect(() => {
    if (remainingSeconds <= 0) return;

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearLockout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingSeconds]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m > 0 ? `${m}m ` : ""}${s}s`;
  };

  const onSubmit = async (data: LoginFormData) => {
    if (remainingSeconds > 0) {
      showToast(
        `Please wait ${formatTime(remainingSeconds)} before trying again.`,
        "error",
      );
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();

      if (!res.ok) {
        if (res.status === 429 && result.lockoutDuration) {
          setLockoutDuration(result.lockoutDuration);
          setRemainingSeconds(result.lockoutDuration);
        }
        throw new Error(result.message || "Login failed");
      }

      clearLockout();
      setRemainingSeconds(0);

      if (result.requires2FA) {
        onRequire2FA({
          tempToken: result.tempToken,
          email: result.email,
          formVals: data,
        });
      } else {
        if (data.rememberMe) {
          localStorage.setItem("remembered_email", data.email);
          localStorage.setItem("remembered_password", data.password);
        } else {
          localStorage.removeItem("remembered_email");
          localStorage.removeItem("remembered_password");
        }
        showToast("Welcome back!", "success");
        window.location.replace("/dashboard");
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Login failed";
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  const handlePasskeyLogin = async () => {
    if (remainingSeconds > 0) {
      showToast(
        `Please wait ${formatTime(remainingSeconds)} before using Passkey.`,
        "error",
      );
      return;
    }

    setPasskeyLoading(true);
    try {
      const resp = await fetch("/api/auth/passkey/login-options", {
        credentials: "include",
      });
      const data = await resp.json();
      if (!resp.ok)
        throw new Error(data.error || "Failed to load passkey login options.");

      const authResp = await startAuthentication({ optionsJSON: data });
      const verifyResp = await fetch("/api/auth/passkey/login-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(authResp),
      });
      const verifyResult = await verifyResp.json();

      if (!verifyResp.ok)
        throw new Error(verifyResult.error || "Passkey verification failed.");

      if (verifyResult.success) {
        showToast("Signed in with Passkey successfully!", "success");
        window.location.replace("/dashboard");
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.name === "NotAllowedError")
          showToast("Passkey sign-in cancelled.", "error");
        else showToast(error.message, "error");
      } else showToast("An unknown error occurred.", "error");
    } finally {
      setPasskeyLoading(false);
    }
  };

  return (
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
          <label className="text-sm font-semibold text-slate-700">Email</label>
          <input
            type="email"
            {...register("email")}
            disabled={remainingSeconds > 0}
            className="w-full bg-slate-100/80 hover:bg-slate-100 focus:bg-white border-2 border-transparent focus:border-teal-500 rounded-2xl px-5 py-4 text-slate-900 text-sm focus:outline-none transition disabled:opacity-60 disabled:cursor-not-allowed"
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
              disabled={remainingSeconds > 0}
              className="w-full bg-slate-100/80 hover:bg-slate-100 focus:bg-white border-2 border-transparent focus:border-teal-500 rounded-2xl px-5 py-4 pr-12 text-slate-900 text-sm focus:outline-none transition disabled:opacity-60 disabled:cursor-not-allowed"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              disabled={remainingSeconds > 0}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer disabled:cursor-not-allowed"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
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
              disabled={remainingSeconds > 0}
              {...register("rememberMe")}
              className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 accent-teal-600 cursor-pointer disabled:cursor-not-allowed"
            />
            <span className="text-slate-600 text-xs font-medium">
              Remember me
            </span>
          </label>
          <Link
            href="/forgot-password"
            onClick={() =>
              localStorage.setItem("auth_origin", window.location.pathname)
            }
            className="text-xs font-semibold text-teal-600 hover:text-teal-700 transition"
          >
            Forgot Password?
          </Link>
        </div>
        <button
          type="submit"
          disabled={loading || remainingSeconds > 0}
          className={`cursor-pointer w-full inline-flex items-center justify-center gap-2 font-semibold py-4 rounded-2xl transition shadow-lg disabled:cursor-not-allowed ${
            remainingSeconds > 0
              ? "bg-slate-200 text-slate-500 shadow-none"
              : "bg-linear-to-br from-teal-400 to-teal-600 active:from-teal-500 active:to-teal-700 text-white shadow-teal-600/20 disabled:opacity-60"
          }`}
        >
          {remainingSeconds > 0 ? (
            <>
              <Clock size={18} />
              Try again in {formatTime(remainingSeconds)}
            </>
          ) : loading ? (
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
          <span className="bg-white px-3 text-slate-400 font-medium">Or</span>
        </div>
      </div>

      <button
        type="button"
        onClick={handlePasskeyLogin}
        disabled={passkeyLoading || remainingSeconds > 0}
        className="w-full inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 font-semibold py-4 rounded-2xl transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {passkeyLoading ? (
          <>
            <Spinner size="sm" /> Verifying Passkey...
          </>
        ) : (
          <>
            <KeyRound
              size={18}
              className={
                remainingSeconds > 0 ? "text-slate-400" : "text-teal-600"
              }
            />{" "}
            Sign in with Passkey
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
  );
}
