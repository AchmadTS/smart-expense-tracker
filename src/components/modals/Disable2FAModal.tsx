"use client";

import { Shield } from "lucide-react";

interface Disable2FAModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDisabling: boolean;
}

export default function Disable2FAModal({
  isOpen,
  onClose,
  onConfirm,
  isDisabling,
}: Disable2FAModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 w-full max-w-sm shadow-xl mx-4 space-y-4">
        <div className="h-12 w-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-1">
          <Shield size={24} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Turn off 2FA?
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            Your account will be less secure. You&apos;ll only need your
            password to log in.
          </p>
        </div>
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            disabled={isDisabling}
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isDisabling}
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-xl bg-amber-500 text-sm font-medium text-white hover:bg-amber-600 transition cursor-pointer disabled:opacity-50 flex items-center justify-center"
          >
            {isDisabling ? "Turning off..." : "Yes, Turn Off"}
          </button>
        </div>
      </div>
    </div>
  );
}
