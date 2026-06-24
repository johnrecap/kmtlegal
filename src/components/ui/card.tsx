import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("min-w-0 rounded-lg border border-kmt-border bg-white", className)} {...props} />;
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("border-b border-kmt-border px-5 py-4", className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-lg font-semibold text-kmt-ink", className)} {...props} />;
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("mt-1 text-sm leading-6 text-kmt-muted", className)} {...props} />;
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 py-5", className)} {...props} />;
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("border-t border-kmt-border px-5 py-4", className)} {...props} />;
}

export function MetricCard({
  label,
  value,
  meta,
  className
}: {
  label: string;
  value: string;
  meta?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0 rounded-lg border border-kmt-border bg-white p-5", className)}>
      <p className="break-words text-sm font-medium text-kmt-muted">{label}</p>
      <p className="mt-3 break-words text-3xl font-semibold tabular-nums text-kmt-ink">{value}</p>
      {meta ? <div className="mt-3 break-words text-sm text-kmt-muted">{meta}</div> : null}
    </div>
  );
}
