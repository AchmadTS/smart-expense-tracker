"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Wallet } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import AuthHero from "@/components/AuthHero";
import EmailStep from "@/components/forgot-password/EmailStep";
import OtpStep from "@/components/forgot-password/OtpStep";
import SuccessStep from "@/components/forgot-password/SuccessStep";

type Step = "EMAIL" | "OTP" | "SUCCESS";

export default function ForgotPassword() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [step, setStep] = useState<Step>("EMAIL");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    sessionStorage.setItem("last_auth_page", window.location.pathname);

    const timer = setTimeout(() => {
      const savedStep = localStorage.getItem("forgot_step") as Step;
      const savedEmail = localStorage.getItem("forgot_email");

      if (savedStep && savedStep !== "EMAIL" && savedEmail) {
        setStep(savedStep);
        setUserEmail(savedEmail);
      }
      setIsMounted(true);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const handleClearFlow = () => {
    localStorage.removeItem("forgot_step");
    localStorage.removeItem("forgot_email");
    localStorage.removeItem("otp_resend_expiry");
    setStep("EMAIL");
  };

  const handleEmailSuccess = (email: string) => {
    setUserEmail(email);
    localStorage.setItem("forgot_step", "OTP");
    localStorage.setItem("forgot_email", email);
    localStorage.setItem(
      "otp_resend_expiry",
      (new Date().getTime() + 60000).toString(),
    );
    setStep("OTP");
  };

  const handleOtpSuccess = (token: string) => {
    localStorage.setItem("reset_token", token);
    localStorage.setItem(
      `reset_expiry_${token}`,
      (new Date().getTime() + 10 * 60 * 1000).toString(),
    );
    localStorage.setItem("forgot_step", "SUCCESS");
    setStep("SUCCESS");
  };

  const handleProceedToReset = () => {
    handleClearFlow();
    const token = localStorage.getItem("reset_token");
    router.push(`/reset-password?token=${token}`);
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
                <EmailStep
                  onClearFlow={handleClearFlow}
                  onSuccess={handleEmailSuccess}
                />
              )}
              {step === "OTP" && (
                <OtpStep
                  email={userEmail}
                  onChangeEmail={handleClearFlow}
                  onSuccess={handleOtpSuccess}
                />
              )}
              {step === "SUCCESS" && (
                <SuccessStep onProceed={handleProceedToReset} />
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
