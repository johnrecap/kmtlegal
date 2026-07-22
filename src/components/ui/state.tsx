import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type StateTone = "empty" | "loading" | "info" | "success" | "warning" | "error" | "permission";

const toneClasses: Record<StateTone, string> = {
  empty: "border-kmt-border bg-white",
  loading: "border-kmt-info-border bg-kmt-info-surface",
  info: "border-kmt-info-border bg-kmt-info-surface",
  success: "border-kmt-success-border bg-kmt-success-surface",
  warning: "border-kmt-warning-border bg-kmt-warning-surface",
  error: "border-kmt-danger-border bg-kmt-danger-surface",
  permission: "border-kmt-warning-border bg-kmt-warning-surface"
};

export function StateBlock({
  tone = "empty",
  title,
  description,
  action,
  className
}: {
  tone?: StateTone;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div aria-live={tone === "error" ? "assertive" : "polite"} className={cn("rounded-lg border p-6", toneClasses[tone], className)} role={tone === "error" ? "alert" : "status"}>
      <h3 className="text-lg font-semibold text-kmt-ink">{title}</h3>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-kmt-muted">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
