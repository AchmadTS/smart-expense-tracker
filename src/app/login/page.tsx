"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Wallet, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import AuthHero from "@/components/AuthHero";
import Spinner from "@/components/Spinner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const { login } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  useEffect(() => {
    const savedEmail = localStorage.getItem("remembered_email") || "";
    const savedPassword = localStorage.getItem("remembered_password") || "";

    if (savedEmail || savedPassword) {
      reset({
        email: savedEmail,
        password: savedPassword,
        rememberMe: true,
      });
    }
  }, [reset]);

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    try {
      await login(data.email, data.password);
      if (data.rememberMe) {
        localStorage.setItem("remembered_email", data.email);
        localStorage.setItem("remembered_password", data.password);
      } else {
        localStorage.removeItem("remembered_email");
        localStorage.removeItem("remembered_password");
      }

      toast.success("Welcome back!");
      router.push("/");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Login failed";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

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

        <div className="flex-1 flex items-center justify-center py-10">
          <div className="w-full max-w-md">
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
                    {...register("rememberMe")}
                    className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 accent-teal-600 cursor-pointer"
                  />
                  <span className="text-slate-600 text-xs font-medium">
                    Remember me
                  </span>
                </label>

                <Link
                  href="/forgot-password"
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
                    <Spinner size="sm" />
                    Signing in...
                  </>
                ) : (
                  "Login"
                )}
              </button>
            </form>

            <p className="text-center mt-8 text-sm text-slate-500">
              No Account Yet?{" "}
              <Link
                href="/register"
                className="text-teal-600 font-semibold hover:text-teal-700 transition"
              >
                Get Yours Now
              </Link>
            </p>
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
        <AuthHero headline="SExpense" subheadline="Your financial future" />
      </div>
    </div>
  );
}
