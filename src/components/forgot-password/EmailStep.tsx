"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { requestPasswordReset } from "@/services/auth";
import Spinner from "@/components/Spinner";
import { showToast } from "@/lib/toast";
import ToastContainer from "@/components/ui/ToastContainer";

const emailSchema = z.object({
  email: z.string().email("Invalid email format"),
});

type EmailFormData = z.infer<typeof emailSchema>;

interface EmailStepProps {
  onClearFlow: () => void;
  onSuccess: (email: string) => void;
}

export default function EmailStep({ onClearFlow, onSuccess }: EmailStepProps) {
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
  });

  const onSubmit = async (data: EmailFormData) => {
    setLoading(true);
    try {
      const result = await requestPasswordReset(data.email);

      if (result.error) {
        showToast(result.error, "error");
        return;
      }

      onSuccess(data.email);
      showToast("OTP code has been sent!", "success");
    } catch {
      showToast("Failed to send OTP. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <motion.div
        key="email-step"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ duration: 0.3 }}
      >
        <Link
          href="/login"
          onClick={onClearFlow}
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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
      <ToastContainer />
    </>
  );
}
