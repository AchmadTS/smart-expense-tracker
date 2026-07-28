"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { Wallet, Eye, EyeOff, Sparkles, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import AuthHero from "@/components/AuthHero";
import Spinner from "@/components/Spinner";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { resetPassword } from "@/services/auth";

const resetSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Confirm password minimum 6 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password does not match",
    path: ["confirmPassword"],
  });

type ResetFormData = z.infer<typeof resetSchema>;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlToken = searchParams.get("token");
  const [token] = useState<string>(() => {
    if (urlToken) return urlToken;
    if (typeof window !== "undefined") {
      return localStorage.getItem("reset_token") || "";
    }
    return "";
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const activeToken =
      urlToken ||
      (typeof window !== "undefined"
        ? localStorage.getItem("reset_token")
        : null);
    if (!activeToken) {
      toast.error(
        "Invalid session. Please restart the forgot password process.",
      );
      router.push("/forgot-password");
    }
  }, [urlToken, router]);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const passwordValue = useWatch({ control, name: "password" }) || "";
  const getPasswordStrength = (pwd: string) => {
    let score = 0;
    if (!pwd) return 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const passwordStrength = getPasswordStrength(passwordValue);
  const handleGeneratePassword = () => {
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const specials = "!@#$%^&*()_+";
    const chars = [
      uppercase[Math.floor(Math.random() * uppercase.length)],
      lowercase[Math.floor(Math.random() * lowercase.length)],
      numbers[Math.floor(Math.random() * numbers.length)],
      specials[Math.floor(Math.random() * specials.length)],
    ];

    const allChars = uppercase + lowercase + numbers + specials;
    for (let i = chars.length; i < 12; i++) {
      chars.push(allChars[Math.floor(Math.random() * allChars.length)]);
    }

    const generated = chars.sort(() => Math.random() - 0.5).join("");
    setValue("password", generated, { shouldValidate: true });
    setValue("confirmPassword", generated, { shouldValidate: true });
    setShowPassword(true);
    toast.success("Strong password successfully created!");
  };

  const onSubmit = async (data: ResetFormData) => {
    if (!token) {
      toast.error(
        "Invalid session. Please restart the forgot password process.",
      );
      router.push("/forgot-password");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, data.password);
      localStorage.removeItem("reset_token");
      toast.success("Password changed successfully!");
      router.push("/login");
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to reset password, please try again.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white w-full">
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-md"
          >
            <h2 className="text-4xl font-bold text-slate-900 tracking-tight mb-2">
              Create New Password
            </h2>
            <p className="text-slate-500 mb-10">
              Your new password must be unique and different from your previous
              password.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-slate-700">
                    New Password
                  </label>
                  {passwordStrength < 4 && (
                    <button
                      type="button"
                      onClick={handleGeneratePassword}
                      className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1 transition cursor-pointer"
                    >
                      <Sparkles size={12} />
                      Generate password
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    {...register("password")}
                    className="w-full bg-slate-100/80 hover:bg-slate-100 focus:bg-white border-2 border-transparent focus:border-teal-500 rounded-2xl px-5 py-4 pr-12 text-slate-900 text-sm focus:outline-none transition"
                    placeholder="Minimum 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer"
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

                {passwordValue && (
                  <div className="space-y-1.5 pt-1">
                    <div className="grid grid-cols-4 gap-1.5 h-1.5">
                      <div
                        className={`rounded-full transition-all duration-300 ${passwordStrength >= 1 ? "bg-teal-500" : "bg-slate-200"}`}
                      />
                      <div
                        className={`rounded-full transition-all duration-300 ${passwordStrength >= 2 ? "bg-teal-500" : "bg-slate-200"}`}
                      />
                      <div
                        className={`rounded-full transition-all duration-300 ${passwordStrength >= 3 ? "bg-teal-500" : "bg-slate-200"}`}
                      />
                      <div
                        className={`rounded-full transition-all duration-300 ${passwordStrength >= 4 ? "bg-teal-500" : "bg-slate-200"}`}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-500">
                        {passwordStrength <= 1 && "Weak password"}
                        {passwordStrength === 2 && "Fair password"}
                        {passwordStrength === 3 && "Good password"}
                        {passwordStrength === 4 && "Strong password ✨"}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    {...register("confirmPassword")}
                    className={`w-full bg-slate-100/80 hover:bg-slate-100 focus:bg-white border-2 rounded-2xl px-5 py-4 pr-12 text-slate-900 text-sm focus:outline-none transition ${
                      errors.confirmPassword
                        ? "border-rose-500 focus:border-rose-500"
                        : "border-transparent focus:border-teal-500"
                    }`}
                    placeholder="Repeat new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-rose-500 mt-1 pl-1">
                    {errors.confirmPassword.message}
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
                    Saving...
                  </>
                ) : (
                  "Save New Password"
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition"
              >
                <ArrowLeft size={16} />
                Back to Login
              </Link>
            </div>
          </motion.div>
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
        <AuthHero
          headline="Protected"
          subheadline="Data security is our priority"
        />
      </div>
    </div>
  );
}

export default function ResetPassword() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <Spinner />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
