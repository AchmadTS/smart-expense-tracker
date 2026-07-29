"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Wallet, Eye, EyeOff, ChevronDown, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import AuthHero from "@/components/AuthHero";
import Spinner from "@/components/Spinner";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

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
  const [showPassword, setShowPassword] = useState(false);

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

  const passwordValue =
    useWatch({
      control,
      name: "password",
    }) || "";

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
    setShowPassword(true);
    toast.success("Strong password generated!");
  };

  const onSubmit = async (data: RegisterFormData) => {
    setLoading(true);
    try {
      await registerAuth(data);
      toast.success("Account created!");
      router.push("/");
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Registration failed";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    sessionStorage.setItem("last_auth_page", window.location.pathname);
  }, []);

  return (
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

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-slate-700">
                    Password
                  </label>
                  {passwordStrength < 4 && (
                    <button
                      type="button"
                      onClick={handleGeneratePassword}
                      className="text-xs font-semibold text-primary hover:text-primary-hover flex items-center gap-1 transition cursor-pointer"
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
                    className="w-full bg-slate-100/80 hover:bg-slate-100 focus:bg-white border-2 border-transparent focus:border-primary rounded-2xl px-5 py-4 pr-12 text-slate-900 text-sm focus:outline-none transition"
                    placeholder="At least 6 characters"
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
                        className={`rounded-full transition-all duration-300 ${
                          passwordStrength >= 1 ? "bg-success" : "bg-slate-200"
                        }`}
                      />
                      <div
                        className={`rounded-full transition-all duration-300 ${
                          passwordStrength >= 2 ? "bg-success" : "bg-slate-200"
                        }`}
                      />
                      <div
                        className={`rounded-full transition-all duration-300 ${
                          passwordStrength >= 3 ? "bg-success" : "bg-slate-200"
                        }`}
                      />
                      <div
                        className={`rounded-full transition-all duration-300 ${
                          passwordStrength >= 4 ? "bg-success" : "bg-slate-200"
                        }`}
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
          <a className="hover:text-slate-900 transition cursor-pointer">FAQ</a>
        </div>
      </div>

      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] order-2">
        <AuthHero headline="Begin" subheadline="your financial journey" />
      </div>
    </div>
  );
}
