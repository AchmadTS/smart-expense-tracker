import { InputHTMLAttributes } from "react";

interface InputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  label?: string;
  error?: string;
  type?: string;
}

export default function Input({
  label,
  error,
  className = "",
  type = "text",
  ...props
}: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <input
        type={type}
        className={`w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white shadow-xs focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent transition ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
}
