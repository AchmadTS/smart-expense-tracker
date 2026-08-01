"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Wallet, ChevronDown } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import AuthHero from "@/components/AuthHero";
import Spinner from "@/components/Spinner";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import PasswordInput from "@/components/register/PasswordInput";
import { showToast } from "@/lib/toast";
import ToastContainer from "@/components/ui/ToastContainer";

const CURRENCIES = [
  { value: "IDR", label: "IDR - Indonesian Rupiah" },
  { value: "USD", label: "USD - US Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound" },
  { value: "INR", label: "INR - Indian Rupee" },
  { value: "JPY", label: "JPY - Japanese Yen" },
  { value: "CAD", label: "CAD - Canadian Dollar" },
  { value: "AUD", label: "AUD - Australian Dollar" },
];

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  currency: z.string().min(1, "Select currency"),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function Register() {
  const { register: registerAuth } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      currency: "IDR",
    },
  });

  const passwordValue = useWatch({ control, name: "password" }) || "";

  const onSubmit = async (data: RegisterFormData) => {
    setLoading(true);
    try {
      await registerAuth(data);
      showToast("Account created!", "success");
      router.push("/");
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Registration failed";
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      sessionStorage.setItem("last_auth_page", window.location.pathname);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <div className="min-h-screen flex bg-white">
        <div className="flex-1 flex flex-col px-6 sm:px-10 lg:px-14 py-8 order-1">
          <div className="flex justify-start items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-linear-to-br from-primary-light to-primary flex items-center justify-center">
              <Wallet size={18} className="text-white" />
            </div>
            <span className="font-bold text-xl text-slate-900">
              Smart Expense
            </span>
          </div>

          <div className="flex-1 flex items-center justify-center py-10">
            <div className="w-full max-w-md">
              <h2 className="text-4xl font-bold text-slate-900 tracking-tight mb-2">
                Sign Up
              </h2>
              <p className="text-slate-500 mb-10">
                Create your account in seconds
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Name
                  </label>
                  <input
                    {...register("name")}
                    className="w-full bg-slate-100/80 hover:bg-slate-100 focus:bg-white border-2 border-transparent focus:border-primary rounded-2xl px-5 py-4 text-slate-900 text-sm focus:outline-none transition"
                    placeholder="Achmad Tirto Sudiro"
                  />
                  {errors.name && (
                    <p className="text-xs text-rose-500 mt-1 pl-1">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Email
                  </label>
                  <input
                    type="email"
                    {...register("email")}
                    className="w-full bg-slate-100/80 hover:bg-slate-100 focus:bg-white border-2 border-transparent focus:border-primary rounded-2xl px-5 py-4 text-slate-900 text-sm focus:outline-none transition"
                    placeholder="you@example.com"
                  />
                  {errors.email && (
                    <p className="text-xs text-rose-500 mt-1 pl-1">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <PasswordInput
                  registration={register("password")}
                  error={errors.password}
                  value={passwordValue}
                  setValue={setValue}
                />

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Currency
                  </label>
                  <div className="relative">
                    <select
                      {...register("currency")}
                      className="w-full appearance-none bg-slate-100/80 hover:bg-slate-100 focus:bg-white border-2 border-transparent focus:border-primary rounded-2xl px-5 py-4 pr-12 text-slate-900 text-sm focus:outline-none transition cursor-pointer"
                    >
                      {CURRENCIES.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={18}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    />
                  </div>
                  {errors.currency && (
                    <p className="text-xs text-rose-500 mt-1 pl-1">
                      {errors.currency.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 bg-linear-to-br from-primary-light to-primary active:bg-primary-hover text-white font-semibold py-4 rounded-2xl transition shadow-lg shadow-teal-600/20 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Spinner size="sm" />
                      Creating account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </button>
              </form>

              <p className="text-center mt-8 text-sm text-slate-500">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="text-primary font-semibold hover:text-primary-hover transition"
                >
                  Sign in
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
            <a className="hover:text-slate-900 transition cursor-pointer">
              FAQ
            </a>
          </div>
        </div>

        <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] order-2">
          <AuthHero headline="Begin" subheadline="your financial journey" />
        </div>
      </div>
      <ToastContainer />
    </>
  );
}
