import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function DialogFrame({
  title,
  description,
  children,
  footer,
  className
}: {
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <div
      aria-modal="true"
      className={cn("max-w-lg rounded-lg border border-kmt-border bg-white shadow-kmt-popover", className)}
      role="dialog"
    >
      <div className="border-b border-kmt-border px-5 py-4">
        <h2 className="text-lg font-semibold text-kmt-ink">{title}</h2>
        {description ? <p className="mt-1 text-sm leading-6 text-kmt-muted">{description}</p> : null}
      </div>
      {children ? <div className="px-5 py-5">{children}</div> : null}
      {footer ? <div className="flex flex-wrap justify-end gap-3 border-t border-kmt-border px-5 py-4">{footer}</div> : null}
    </div>
  );
}
