import React from 'react';
import { cn } from './Button';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className, ...props }) => {
  return (
    <div className="w-full space-y-1.5">
      {label && <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</label>}
      <input
        className={cn(
          'w-full bg-[#11111B] border border-slate-800 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all duration-200 focus:ring-2 focus:ring-purple-500/20',
          error && 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-rose-400 mt-1">{error}</p>}
    </div>
  );
};

