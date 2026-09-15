import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { MaterialSymbol } from "./material-symbol";

type InlineFeedbackTone = "info" | "success" | "warning" | "error";

const toneClasses: Record<InlineFeedbackTone, string> = {
  info: "border-info-border bg-info-surface text-info-strong",
  success: "border-success-border bg-success-surface text-success-strong",
  warning: "border-warning-border bg-warning-surface text-warning-strong",
  error: "border-danger-border bg-danger-surface text-danger-strong"
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
