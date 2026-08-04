import { ReactNode } from "react";

type StatusVariant =
  | "income"
  | "expense"
  | "warning"
  | "info"
  | "critical"
  | "neutral";

interface StatusPillProps {
  variant?: StatusVariant;
  children: ReactNode;
}

const styles: Record<StatusVariant, string> = {
  income: "bg-emerald-50 text-emerald-700",
  expense: "bg-rose-50 text-rose-700",
  warning: "bg-amber-50 text-amber-700",
  info: "bg-blue-50 text-blue-700",
  critical: "bg-red-50 text-red-700",
  neutral: "bg-slate-100 text-slate-700",
};

export default function StatusPill({
  variant = "neutral",
  children,
}: StatusPillProps) {
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium capitalize ${
        styles[variant] || styles.neutral
      }`}
    >
      {children}
    </span>
  );
}
