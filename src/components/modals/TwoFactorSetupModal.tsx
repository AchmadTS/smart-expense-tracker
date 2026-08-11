"use client";

import { Shield, Copy, CheckCircle2 } from "lucide-react";

interface TwoFactorSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: () => void;
  qrCode: string;
  backupCodes: string[];
  otpToken: string;
  setOtpToken: (val: string) => void;
  isVerifying: boolean;
  copiedCode: string | null;
  onCopy: (code: string) => void;
}

export default function TwoFactorSetupModal({
  isOpen,
  onClose,
  onVerify,
  qrCode,
  backupCodes,
  otpToken,
  setOtpToken,
  isVerifying,
  copiedCode,
  onCopy,
}: TwoFactorSetupModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200 p-4">
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 w-full max-w-md shadow-xl flex flex-col max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden scrollbar-none [-ms-overflow-style:none]">
        <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-teal-50 dark:bg-teal-950/40 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0">
            <Shield size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Setup 2FA
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Improve your account security
            </p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-3 text-center">
            <div className="inline-block p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm">
              {qrCode ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrCode} alt="QR Code 2FA" className="w-40 h-40" />
              ) : (
                <div className="w-40 h-40 bg-slate-50 dark:bg-slate-700 animate-pulse rounded-xl" />
              )}
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                1.
              </span>{" "}
              Scan this QR code with an app like{" "}
              <span className="font-semibold">Google Authenticator</span> or{" "}
              <span className="font-semibold">Authy</span>.
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60">
            <p className="text-sm text-slate-700 dark:text-slate-200 mb-2 font-medium flex items-center gap-2">
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                2.
              </span>{" "}
              Save Backup Codes
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Keep this code in a safe place. Use it if you lose access to your
              app.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {backupCodes.map((code) => (
                <div
                  key={code}
                  className="bg-white dark:bg-slate-900 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-700 dark:text-slate-300 flex justify-between items-center group"
                >
                  {code}
                  <button
                    onClick={() => onCopy(code)}
                    className="text-slate-300 dark:text-slate-600 hover:text-teal-600 dark:hover:text-teal-400 transition opacity-0 group-hover:opacity-100 cursor-pointer"
                    title="Copy"
                  >
                    {copiedCode === code ? (
                      <CheckCircle2 size={12} className="text-teal-500" />
                    ) : (
                      <Copy size={12} />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-700 dark:text-slate-300 mb-2 font-medium flex items-center gap-2">
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                3.
              </span>{" "}
              Enter 6 Digit Code
            </label>
            <input
              type="text"
              maxLength={6}
              value={otpToken}
              onChange={(e) => setOtpToken(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              className="w-full text-center tracking-[0.5em] font-mono text-lg px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
            />
          </div>
        </div>

        <div className="p-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            type="button"
            disabled={isVerifying}
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isVerifying || otpToken.length !== 6}
            onClick={onVerify}
            className="flex-1 px-4 py-2.5 rounded-xl bg-teal-600 text-sm font-medium text-white hover:bg-teal-700 transition cursor-pointer disabled:opacity-50 flex items-center justify-center"
          >
            {isVerifying ? "Verifying..." : "Verify and Activate"}
          </button>
        </div>
      </div>
    </div>
  );
}
