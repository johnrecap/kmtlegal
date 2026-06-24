import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type BadgeTone = "neutral" | "active" | "pending" | "closed" | "danger";

const toneClasses: Record<BadgeTone, string> = {
  neutral: "border-kmt-border bg-white text-kmt-muted",
  active: "border-blue-200 bg-blue-50 text-blue-800",
  pending: "border-amber-200 bg-amber-50 text-amber-800",
  closed: "border-slate-200 bg-slate-100 text-slate-700",
  danger: "border-red-200 bg-red-50 text-red-800"
};

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
};

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex min-h-6 items-center rounded-full border px-2.5 text-xs font-medium",
        toneClasses[tone],
        className
      )}
      {...props}
    />
  );
}
