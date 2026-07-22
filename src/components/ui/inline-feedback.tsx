import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { MaterialSymbol } from "./material-symbol";

type InlineFeedbackTone = "info" | "success" | "warning" | "error";

const toneClasses: Record<InlineFeedbackTone, string> = {
  info: "border-kmt-info-border bg-kmt-info-surface text-kmt-info-strong",
  success: "border-kmt-success-border bg-kmt-success-surface text-kmt-success-strong",
  warning: "border-kmt-warning-border bg-kmt-warning-surface text-kmt-warning-strong",
  error: "border-kmt-danger-border bg-kmt-danger-surface text-kmt-danger-strong"
};

const toneIcons: Record<InlineFeedbackTone, string> = {
  info: "info",
  success: "check_circle",
  warning: "warning",
  error: "error"
};

export function InlineFeedback({ tone = "info", title, description, action, loading = false, className }: {
  tone?: InlineFeedbackTone;
  title: string;
  description?: string;
  action?: ReactNode;
  loading?: boolean;
  className?: string;
}) {
  return (
    <div
      aria-busy={loading || undefined}
      aria-live={tone === "error" ? "assertive" : "polite"}
      className={cn("flex items-start gap-3 rounded-lg border p-4", toneClasses[tone], className)}
      role={tone === "error" ? "alert" : "status"}
    >
      <MaterialSymbol
        aria-hidden
        className={cn("mt-0.5 text-[20px]", loading ? "motion-safe:animate-spin" : undefined)}
        name={loading ? "schedule" : toneIcons[tone]}
      />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{title}</p>
        {description ? <p className="mt-1 text-sm leading-6 opacity-80">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
