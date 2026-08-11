"use client";

import { AlertCircle } from "lucide-react";

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoggingOut: boolean;
  currentPageName: string;
}

export default function LogoutModal({
  isOpen,
  onClose,
  onConfirm,
  isLoggingOut,
  currentPageName,
}: LogoutModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 w-full max-w-sm shadow-xl mx-4 space-y-4">
        <div className="h-12 w-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-rose-600 dark:text-rose-400 mb-1">
          <AlertCircle size={24} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Logout?
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            You will need to log in again using your email and password to
            access{" "}
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {currentPageName}
            </span>
            .
          </p>
        </div>
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            disabled={isLoggingOut}
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isLoggingOut}
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 text-sm font-medium text-white hover:bg-rose-700 transition cursor-pointer disabled:opacity-50 flex items-center justify-center"
          >
            {isLoggingOut ? "Logging out..." : "Yes, Logout"}
          </button>
        </div>
      </div>
    </div>
  );
}
