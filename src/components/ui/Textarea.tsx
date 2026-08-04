import { TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
}

export default function Textarea({ label, error, className = '', ...props }: TextareaProps) {
    return (
        <div className="space-y-1.5">
            {label && <label className="block text-sm font-medium text-slate-700">{label}</label>}
            <textarea
                className={`w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white shadow-xs focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent transition ${className}`}
                {...props}
            />
            {error && <p className="text-xs text-rose-600">{error}</p>}
        </div>
    );
}