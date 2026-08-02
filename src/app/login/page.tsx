"use client";

import { useState, useEffect } from "react";
import { Wallet } from "lucide-react";
import AuthHero from "@/components/AuthHero";
import { AnimatePresence } from "framer-motion";
import ToastContainer from "@/components/ui/ToastContainer";
import LoginForm, { LoginFormData } from "@/components/login/LoginForm";
import OtpForm from "@/components/login/OtpForm";
import BackupCodeForm from "@/components/login/BackupCodeForm";

type LoginStep = "LOGIN" | "OTP" | "BACKUP_CODE";

export default function Login() {
  const [step, setStep] = useState<LoginStep>("LOGIN");
  const [tempToken, setTempToken] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [authFormVals, setAuthFormVals] = useState<LoginFormData | null>(null);

  useEffect(() => {
    sessionStorage.setItem("last_auth_page", window.location.pathname);
  }, []);

  const handleRequire2FA = (data: {
    tempToken: string;
    email: string;
    formVals: LoginFormData;
  }) => {
    setTempToken(data.tempToken);
    setUserEmail(data.email);
    setAuthFormVals(data.formVals);
    setStep("OTP");
  };

  return (
    <>
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
                <LoginForm onRequire2FA={handleRequire2FA} />
              )}

              {step === "OTP" && (
                <OtpForm
                  userEmail={userEmail}
                  tempToken={tempToken}
                  formVals={authFormVals}
                  onBack={() => setStep("LOGIN")}
                  onSwitchToBackup={() => setStep("BACKUP_CODE")}
                />
              )}

              {step === "BACKUP_CODE" && (
                <BackupCodeForm
                  tempToken={tempToken}
                  formVals={authFormVals}
                  onBack={() => setStep("OTP")}
                />
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
            <a className="hover:text-slate-900 transition cursor-pointer">
              FAQ
            </a>
          </div>
        </div>

        <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] order-2 relative z-0">
          <AuthHero headline="SExpense" subheadline="Your financial future" />
        </div>
      </div>
      <ToastContainer />
    </>
  );
}
