import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type FieldShellProps = {
  label: string;
  htmlFor: string;
  hint?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
};

function FieldShell({ label, htmlFor, hint, error, children }: FieldShellProps) {
  const descriptionId = hint ? `${htmlFor}-hint` : undefined;
  const errorId = error ? `${htmlFor}-error` : undefined;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-kmt-ink" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {hint ? (
        <p id={descriptionId} className="text-sm leading-6 text-kmt-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-sm leading-6 text-kmt-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

const controlClasses =
  "w-full rounded border border-slate-300 bg-white px-3 py-2.5 text-base text-kmt-ink placeholder:text-slate-400 shadow-none transition-colors focus:border-kmt-navy focus:ring-2 focus:ring-kmt-gold/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";

const selectClasses = cn(controlClasses, "appearance-none bg-none pe-10");
const nativePickerInputTypes = new Set(["date", "datetime-local", "month", "time", "week"]);

export type TextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: ReactNode;
  error?: ReactNode;
};

export function TextInput({ id, label, hint, error, className, type, dir, ...props }: TextInputProps) {
  const htmlFor = id || props.name || label;
  const usesNativePicker = typeof type === "string" && nativePickerInputTypes.has(type);
  return (
    <FieldShell htmlFor={htmlFor} label={label} hint={hint} error={error}>
      <input
        id={htmlFor}
        className={cn(controlClasses, usesNativePicker ? "pe-11 text-left" : undefined, error ? "border-kmt-danger focus:border-kmt-danger" : undefined, className)}
        dir={dir ?? (usesNativePicker ? "ltr" : undefined)}
        type={type}
        aria-invalid={error ? true : undefined}
        aria-describedby={[hint ? `${htmlFor}-hint` : "", error ? `${htmlFor}-error` : ""].filter(Boolean).join(" ") || undefined}
        {...props}
      />
    </FieldShell>
  );
}

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  hint?: ReactNode;
  error?: ReactNode;
};

export function Textarea({ id, label, hint, error, className, ...props }: TextareaProps) {
  const htmlFor = id || props.name || label;
  return (
    <FieldShell htmlFor={htmlFor} label={label} hint={hint} error={error}>
      <textarea
        id={htmlFor}
        className={cn(controlClasses, "min-h-28 resize-y", error ? "border-kmt-danger focus:border-kmt-danger" : undefined, className)}
        aria-invalid={error ? true : undefined}
        aria-describedby={[hint ? `${htmlFor}-hint` : "", error ? `${htmlFor}-error` : ""].filter(Boolean).join(" ") || undefined}
        {...props}
      />
    </FieldShell>
  );
}

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  hint?: ReactNode;
  error?: ReactNode;
};

export function Select({ id, label, hint, error, className, children, ...props }: SelectProps) {
  const htmlFor = id || props.name || label;
  return (
    <FieldShell htmlFor={htmlFor} label={label} hint={hint} error={error}>
      <div className="relative">
        <select
          id={htmlFor}
          className={cn(selectClasses, error ? "border-kmt-danger focus:border-kmt-danger" : undefined, className)}
          aria-invalid={error ? true : undefined}
          aria-describedby={[hint ? `${htmlFor}-hint` : "", error ? `${htmlFor}-error` : ""].filter(Boolean).join(" ") || undefined}
          {...props}
        >
          {children}
        </select>
        <span className="pointer-events-none absolute inset-y-0 end-3 flex items-center text-kmt-muted" aria-hidden="true">
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none">
            <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
          </svg>
        </span>
      </div>
    </FieldShell>
  );
}
