import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

type FieldProps = {
  label: string;
  error?: string;
};

export function TextField({
  label,
  error,
  className = '',
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & FieldProps) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </span>
      <input
        {...rest}
        className={`w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 ${className}`}
      />
      {error ? (
        <span className="mt-1 block text-xs text-red-600">{error}</span>
      ) : null}
    </label>
  );
}

export function TextArea({
  label,
  error,
  className = '',
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement> & FieldProps) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </span>
      <textarea
        {...rest}
        className={`w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 ${className}`}
      />
      {error ? (
        <span className="mt-1 block text-xs text-red-600">{error}</span>
      ) : null}
    </label>
  );
}
