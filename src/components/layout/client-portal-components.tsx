import type { HTMLAttributes, ReactNode } from "react";
import { MaterialSymbol } from "@/components/ui";
import { cn } from "@/lib/cn";

export const clientPortalGoldText = "text-[#c79a52]";
export const clientPortalMutedText = "text-slate-300";
export const clientPortalPanelClass =
  "client-portal-panel min-w-0 rounded-lg border border-white/10 bg-white/[0.045] text-white shadow-[0_24px_80px_rgba(0,0,0,0.28)]";
export const clientPortalRowClass =
  "client-portal-row min-w-0 rounded border border-white/10 bg-black/20 p-4 transition-colors hover:border-kmt-gold/45 hover:bg-white/[0.065]";
export const clientPortalTableClass = "client-portal-table border-white/10 bg-white/[0.045] text-white";
export const clientPortalSecondaryActionClass =
  "!border-white/15 !bg-transparent !text-stone-100 hover:!border-kmt-gold/60 hover:!bg-kmt-gold/10 hover:!text-kmt-gold";
export const clientPortalPrimaryActionClass =
  "!border-kmt-gold !bg-kmt-gold !text-[#120d07] hover:!border-[#c7a363] hover:!bg-[#c7a363]";

export function ClientPortalPanel({
  title,
  description,
  action,
  children,
  className,
  contentClassName
}: {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <section className={cn(clientPortalPanelClass, className)}>
      {title || description || action ? (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 px-5 py-4">
          <div className="min-w-0">
            {title ? <h2 className="break-words text-lg font-semibold text-white">{title}</h2> : null}
            {description ? <p className={cn("mt-1 text-sm leading-7", clientPortalMutedText)}>{description}</p> : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </header>
      ) : null}
      <div className={cn("px-5 py-5", contentClassName)}>{children}</div>
    </section>
  );
}

export function ClientPortalMetric({
  label,
  value,
  meta,
  icon,
  tone = "default",
  className
}: {
  label: string;
  value: string;
  meta?: ReactNode;
  icon: string;
  tone?: "default" | "due" | "success";
  className?: string;
}) {
  const toneClass =
    tone === "due"
      ? "border-amber-300/30 bg-[linear-gradient(150deg,rgba(146,64,14,0.22),rgba(255,255,255,0.035))]"
      : tone === "success"
        ? "border-emerald-300/25 bg-[linear-gradient(150deg,rgba(22,101,52,0.20),rgba(255,255,255,0.035))]"
        : "border-white/10 bg-white/[0.045]";

  return (
    <article className={cn("client-portal-card min-w-0 rounded-lg border p-5 text-white shadow-[0_18px_64px_rgba(0,0,0,0.22)]", toneClass, className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className={cn("break-words text-sm font-medium", clientPortalMutedText)}>{label}</p>
          <p className="mt-3 break-words text-3xl font-semibold tabular-nums text-white">{value}</p>
        </div>
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded border border-kmt-gold/35 bg-kmt-gold/10 text-kmt-gold" aria-hidden="true">
          <MaterialSymbol className="text-[22px]" name={icon} />
        </span>
      </div>
      {meta ? <div className={cn("mt-4 break-words text-sm leading-7", clientPortalMutedText)}>{meta}</div> : null}
    </article>
  );
}

export function ClientPortalEmpty({
  title,
  description,
  icon = "folder_open",
  action,
  className
}: {
  title: string;
  description: string;
  icon?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg border border-dashed border-kmt-gold/30 bg-kmt-gold/10 p-6 text-white", className)} role="status">
      <div className="flex flex-wrap items-start gap-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded border border-kmt-gold/40 bg-black/20 text-kmt-gold" aria-hidden="true">
          <MaterialSymbol className="text-[22px]" name={icon} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <p className={cn("mt-2 max-w-2xl text-sm leading-7", clientPortalMutedText)}>{description}</p>
          {action ? <div className="mt-5">{action}</div> : null}
        </div>
      </div>
    </div>
  );
}

export function ClientPortalRow({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn(clientPortalRowClass, className)} {...props} />;
}

export function ClientPortalDetailItem({ label, value, className }: { label: string; value: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <p className="text-xs font-semibold text-slate-400">{label}</p>
      <div className="mt-1 break-words text-sm leading-6 text-white">{value || "غير محدد"}</div>
    </div>
  );
}
