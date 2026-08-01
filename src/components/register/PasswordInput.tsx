"use client";

import { useState } from "react";
import { Eye, EyeOff, Sparkles } from "lucide-react";
import { UseFormRegisterReturn, FieldError } from "react-hook-form";
import { showToast } from "@/lib/toast";
import ToastContainer from "@/components/ui/ToastContainer";

interface PasswordInputProps {
  registration: UseFormRegisterReturn;
  error?: FieldError;
  value: string;
  setValue: (
    name: "password",
    value: string,
    options?: { shouldValidate?: boolean },
  ) => void;
}

export default function PasswordInput({
  registration,
  error,
  value,
  setValue,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  const getPasswordStrength = (pwd: string) => {
    let score = 0;
    if (!pwd) return 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

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
    showToast("Strong password generated!", "success");
  };

  const passwordStrength = getPasswordStrength(value);

  return (
    <>
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
            {...registration}
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

        {error && (
          <p className="text-xs text-rose-500 mt-1 pl-1">{error.message}</p>
        )}

        {value && (
          <div className="space-y-1.5 pt-1">
            <div className="grid grid-cols-4 gap-1.5 h-1.5">
              <div
                className={`rounded-full transition-all duration-300 ${passwordStrength >= 1 ? "bg-success" : "bg-slate-200"}`}
              />
              <div
                className={`rounded-full transition-all duration-300 ${passwordStrength >= 2 ? "bg-success" : "bg-slate-200"}`}
              />
              <div
                className={`rounded-full transition-all duration-300 ${passwordStrength >= 3 ? "bg-success" : "bg-slate-200"}`}
              />
              <div
                className={`rounded-full transition-all duration-300 ${passwordStrength >= 4 ? "bg-success" : "bg-slate-200"}`}
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
      <ToastContainer />
    </>
  );
}
