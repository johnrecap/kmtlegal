import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { MaterialSymbol } from "./material-symbol";

type ToastTone = "success" | "warning" | "error" | "info";

const toneClasses: Record<ToastTone, string> = {
  success: "border-kmt-success-border bg-kmt-success-surface text-kmt-success-strong",
  warning: "border-kmt-warning-border bg-kmt-warning-surface text-kmt-warning-strong",
  error: "border-kmt-danger-border bg-kmt-danger-surface text-kmt-danger-strong",
  info: "border-kmt-info-border bg-kmt-info-surface text-kmt-info-strong"
};

const iconNames: Record<ToastTone, string> = {
  success: "check_circle",
  warning: "warning",
  error: "error",
  info: "info"
};

export function Toast({
  tone = "info",
  title,
  description,
  action,
  className
}: {
  tone?: ToastTone;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div aria-live={tone === "error" ? "assertive" : "polite"} className={cn("flex max-w-xl items-start gap-3 rounded-lg border p-4 shadow-kmt-popover", toneClasses[tone], className)} role={tone === "error" ? "alert" : "status"}>
      <MaterialSymbol className="mt-0.5 text-[20px]" name={iconNames[tone]} />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{title}</p>
        {description ? <p className="mt-1 text-sm leading-6 opacity-80">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
