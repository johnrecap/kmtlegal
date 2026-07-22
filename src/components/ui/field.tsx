import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
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
        <p id={errorId} className="text-sm leading-6 text-kmt-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

const controlClasses =
  "w-full rounded border border-kmt-border bg-kmt-paper px-3 py-2.5 text-base text-kmt-ink placeholder:text-kmt-muted shadow-none transition-colors focus:border-kmt-navy focus:ring-2 focus:ring-kmt-gold/20 disabled:cursor-not-allowed disabled:bg-kmt-canvas disabled:text-kmt-muted";

const selectClasses = cn(controlClasses, "appearance-none bg-none pe-12");
const nativePickerInputTypes = new Set(["date", "datetime-local", "month", "time", "week"]);

export type TextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  idPrefix?: string;
  hint?: ReactNode;
  error?: ReactNode;
};

export function TextInput({ id, idPrefix, label, hint, error, className, type, dir, "aria-describedby": describedBy, "aria-errormessage": errorMessage, "aria-invalid": ariaInvalid, ...props }: TextInputProps) {
  const htmlFor = controlId({ id, idPrefix, name: props.name, generatedId: useId() });
  const usesNativePicker = typeof type === "string" && nativePickerInputTypes.has(type);
  return (
    <FieldShell htmlFor={htmlFor} label={label} hint={hint} error={error}>
      <input
        {...props}
        id={htmlFor}
        className={cn(controlClasses, usesNativePicker ? "pe-11 text-left" : undefined, error ? "border-kmt-danger focus:border-kmt-danger" : undefined, className)}
        dir={dir ?? (usesNativePicker ? "ltr" : undefined)}
        type={type}
        aria-invalid={error ? true : ariaInvalid}
        aria-describedby={describedByIds({ htmlFor, hint, error, describedBy })}
        aria-errormessage={error ? `${htmlFor}-error` : errorMessage}
      />
    </FieldShell>
  );
}

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  idPrefix?: string;
  hint?: ReactNode;
  error?: ReactNode;
};

export function Textarea({ id, idPrefix, label, hint, error, className, "aria-describedby": describedBy, "aria-errormessage": errorMessage, "aria-invalid": ariaInvalid, ...props }: TextareaProps) {
  const htmlFor = controlId({ id, idPrefix, name: props.name, generatedId: useId() });
  return (
    <FieldShell htmlFor={htmlFor} label={label} hint={hint} error={error}>
      <textarea
        {...props}
        id={htmlFor}
        className={cn(controlClasses, "min-h-28 resize-y", error ? "border-kmt-danger focus:border-kmt-danger" : undefined, className)}
        aria-invalid={error ? true : ariaInvalid}
        aria-describedby={describedByIds({ htmlFor, hint, error, describedBy })}
        aria-errormessage={error ? `${htmlFor}-error` : errorMessage}
      />
    </FieldShell>
  );
}

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  idPrefix?: string;
  hint?: ReactNode;
  error?: ReactNode;
};

export function Select({ id, idPrefix, label, hint, error, className, children, "aria-describedby": describedBy, "aria-errormessage": errorMessage, "aria-invalid": ariaInvalid, ...props }: SelectProps) {
  const htmlFor = controlId({ id, idPrefix, name: props.name, generatedId: useId() });
  return (
    <FieldShell htmlFor={htmlFor} label={label} hint={hint} error={error}>
      <div className="relative">
        <select
          {...props}
          id={htmlFor}
          className={cn(selectClasses, error ? "border-kmt-danger focus:border-kmt-danger" : undefined, className)}
          aria-invalid={error ? true : ariaInvalid}
          aria-describedby={describedByIds({ htmlFor, hint, error, describedBy })}
          aria-errormessage={error ? `${htmlFor}-error` : errorMessage}
        >
          {children}
        </select>
        <span className="pointer-events-none absolute inset-y-0 end-3 z-10 flex w-5 items-center justify-center text-kmt-navy/70" aria-hidden="true">
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none">
            <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
          </svg>
        </span>
      </div>
    </FieldShell>
  );
}

function controlId({ id, idPrefix, name, generatedId }: { id?: string; idPrefix?: string; name?: string; generatedId: string }) {
  if (id) return id;
  const uniqueSuffix = generatedId.replace(/[^A-Za-z0-9_-]/g, "");
  if (name) return idPrefix ? `${idPrefix}-${name}` : `${name}-${uniqueSuffix}`;
  return idPrefix ? `${idPrefix}-${uniqueSuffix}` : `field-${uniqueSuffix}`;
}

function describedByIds({ htmlFor, hint, error, describedBy }: { htmlFor: string; hint?: ReactNode; error?: ReactNode; describedBy?: string }) {
  return [describedBy, hint ? `${htmlFor}-hint` : undefined, error ? `${htmlFor}-error` : undefined]
    .filter(Boolean)
    .join(" ") || undefined;
}
