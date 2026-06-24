import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type StateTone = "empty" | "loading" | "error" | "permission";

const toneClasses: Record<StateTone, string> = {
  empty: "border-kmt-border bg-white",
  loading: "border-blue-100 bg-blue-50",
  error: "border-red-200 bg-red-50",
  permission: "border-amber-200 bg-amber-50"
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
    <div className={cn("rounded-lg border p-6", toneClasses[tone], className)} role={tone === "error" ? "alert" : "status"}>
      <h3 className="text-lg font-semibold text-kmt-ink">{title}</h3>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-kmt-muted">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
