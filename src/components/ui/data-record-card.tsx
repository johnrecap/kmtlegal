import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type DataRecordCardField = {
  label: ReactNode;
  value: ReactNode;
  dir?: "rtl" | "ltr";
  className?: string;
};

export function DataRecordCard({
  title,
  description,
  badges,
  meta,
  fields = [],
  action,
  footer,
  className
}: {
  title: ReactNode;
  description?: ReactNode;
  badges?: ReactNode;
  meta?: ReactNode;
  fields?: DataRecordCardField[];
  action?: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <article className={cn("rounded-lg border border-kmt-border bg-white p-4 shadow-sm shadow-slate-200/40", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="break-words text-base font-semibold text-kmt-ink">{title}</div>
          {description ? <div className="mt-1 break-words text-sm leading-6 text-kmt-muted">{description}</div> : null}
        </div>
        {badges ? <div className="flex shrink-0 flex-wrap items-center gap-2">{badges}</div> : null}
      </div>

      {meta ? <div className="mt-3 text-sm leading-6 text-kmt-muted">{meta}</div> : null}

      {fields.length ? (
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          {fields.map((field, index) => (
            <div key={index} className={field.className}>
              <dt className="font-semibold text-kmt-muted">{field.label}</dt>
              <dd className="mt-1 break-words text-kmt-ink" dir={field.dir}>
                {field.value}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}

      {footer ? <div className="mt-4 text-sm leading-6 text-kmt-muted">{footer}</div> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </article>
  );
}
