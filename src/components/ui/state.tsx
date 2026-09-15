import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type StateTone = "empty" | "loading" | "info" | "success" | "warning" | "error" | "permission";

const toneClasses: Record<StateTone, string> = {
  empty: "border-border bg-surface",
  loading: "border-info-border bg-info-surface",
  info: "border-info-border bg-info-surface",
  success: "border-success-border bg-success-surface",
  warning: "border-warning-border bg-warning-surface",
  error: "border-danger-border bg-danger-surface",
  permission: "border-warning-border bg-warning-surface"
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
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
