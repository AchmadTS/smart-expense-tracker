"use client";

import { useEffect, useState } from "react";
import { subscribeToast, ToastPayload } from "@/lib/toast";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ToastContainer() {
  const [toast, setToast] = useState<ToastPayload | null>(null);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    return subscribeToast((newToast) => {
      if (newToast) {
        setToast(newToast);
        setProgress(100);
      } else {
        setToast(null);
      }
    });
  }, []);

  useEffect(() => {
    if (!toast) return;

    const progressTimer = setTimeout(() => {
      setProgress(0);
    }, 50);

    const hideTimer = setTimeout(() => {
      setToast(null);
    }, 5000);

    return () => {
      clearTimeout(progressTimer);
      clearTimeout(hideTimer);
    };
  }, [toast]);

  return (
    <div className="fixed top-6 right-6 z-200 pointer-events-none flex flex-col gap-2">
      <AnimatePresence mode="wait">
        {toast && (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className="pointer-events-auto"
            role="alert"
            aria-live={toast.type === "error" ? "assertive" : "polite"}
          >
            <div
              className={`relative overflow-hidden flex items-center gap-3 px-4 py-3 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border text-sm font-medium bg-white dark:bg-slate-900 ${
                toast.type === "error"
                  ? "border-rose-100 dark:border-rose-950/60 text-slate-900 dark:text-slate-100"
                  : toast.type === "info"
                    ? "border-blue-100 dark:border-blue-950/60 text-slate-900 dark:text-slate-100"
                    : "border-teal-100 dark:border-teal-950/60 text-slate-900 dark:text-slate-100"
              }`}
            >
              {toast.type === "error" ? (
                <div className="h-8 w-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                  <AlertCircle size={18} />
                </div>
              ) : toast.type === "info" ? (
                <div className="h-8 w-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                  <Info size={18} />
                </div>
              ) : (
                <div className="h-8 w-8 rounded-xl bg-teal-50 dark:bg-teal-950/40 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0">
                  <CheckCircle2 size={18} />
                </div>
              )}

              <span className="max-w-xs">{toast.message}</span>

              <button
                onClick={() => setToast(null)}
                aria-label="Close notification"
                className="ml-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition p-1 cursor-pointer z-10"
              >
                <X size={14} />
              </button>

              <div
                className={`absolute bottom-0 left-0 h-1 transition-all ease-linear ${
                  toast.type === "error"
                    ? "bg-rose-500"
                    : toast.type === "info"
                      ? "bg-blue-500"
                      : "bg-teal-500"
                }`}
                style={{
                  width: `${progress}%`,
                  transitionDuration: progress === 100 ? "0ms" : "5000ms",
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
