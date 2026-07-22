import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type BadgeTone = "neutral" | "active" | "pending" | "closed" | "danger";

const toneClasses: Record<BadgeTone, string> = {
  neutral: "border-kmt-border bg-white text-kmt-muted",
  active: "border-kmt-success-border bg-kmt-success-surface text-kmt-success",
  pending: "border-kmt-warning-border bg-kmt-warning-surface text-kmt-warning",
  closed: "border-kmt-border bg-kmt-canvas text-kmt-muted",
  danger: "border-kmt-danger-border bg-kmt-danger-surface text-kmt-danger"
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
