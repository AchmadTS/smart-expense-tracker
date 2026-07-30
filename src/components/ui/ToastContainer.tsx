"use client";

import { useEffect, useState } from "react";
import { subscribeToast } from "@/lib/toast";
import { AlertCircle, CheckCircle2, X } from "lucide-react";

export default function ToastContainer() {
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  useEffect(() => {
    return subscribeToast((newToast) => {
      setToast(newToast);
      if (newToast) {
        const timer = setTimeout(() => {
          setToast(null);
        }, 4000);
        return () => clearTimeout(timer);
      }
    });
  }, []);

  if (!toast) return null;

  const isError = toast.type === "error";

  return (
    <div className="fixed bottom-6 right-6 z-200 animate-in fade-in slide-in-from-bottom-3 duration-200">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border text-sm font-medium bg-white ${
          isError
            ? "border-rose-100 text-slate-900"
            : "border-teal-100 text-slate-900"
        }`}
      >
        {isError ? (
          <div className="h-8 w-8 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
            <AlertCircle size={18} />
          </div>
        ) : (
          <div className="h-8 w-8 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 shrink-0">
            <CheckCircle2 size={18} />
          </div>
        )}
        <span className="max-w-xs">{toast.message}</span>
        <button
          onClick={() => setToast(null)}
          className="ml-2 text-slate-400 hover:text-slate-600 transition p-1 cursor-pointer"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
