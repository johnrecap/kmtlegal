import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type BadgeTone = "neutral" | "active" | "pending" | "closed" | "danger" | "info";
type BadgeSize = "sm" | "md";

const toneClasses: Record<BadgeTone, string> = {
  neutral: "border-border bg-surface-muted text-muted-foreground",
  active: "border-success-border bg-success-surface text-success-strong",
  pending: "border-warning-border bg-warning-surface text-warning-strong",
  closed: "border-border bg-surface text-muted-foreground",
  danger: "border-danger-border bg-danger-surface text-danger-strong",
  info: "border-info-border bg-info-surface text-info-strong"
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: "min-h-6 px-2 text-xs",
  md: "min-h-6 px-2.5 text-xs"
};

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
  size?: BadgeSize;
};

export function Badge({ className, tone = "neutral", size = "md", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-medium",
        toneClasses[tone],
        sizeClasses[size],
        className
      )}
      {...props}
    />
  );
}
