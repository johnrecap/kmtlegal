import Link from "next/link";
import type { ReactNode } from "react";
import { plan35AdminShellCopy } from "@/lib/ui-copy";

export type DashboardBreadcrumb = { label: string; href?: string };

export function DashboardPageFrame({
  title,
  eyebrow,
  description,
  breadcrumbs,
  action,
  children
}: {
  title: string;
  eyebrow: string;
  description?: string;
  breadcrumbs?: DashboardBreadcrumb[];
  action?: ReactNode;
  children: ReactNode;
}) {
  const trail = breadcrumbs ?? [
    { label: plan35AdminShellCopy.workspaceHome, href: "/admin" },
    { label: eyebrow }
  ];
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <nav aria-label={plan35AdminShellCopy.pageBreadcrumb} className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {trail.map((item, index) => (
              <span className="contents" key={`${item.label}-${index}`}>
                {index ? <span aria-hidden="true">/</span> : null}
                {item.href ? <Link className="hover:text-primary" href={item.href}>{item.label}</Link> : <span aria-current="page">{item.label}</span>}
              </span>
            ))}
          </nav>
          <h1 className="break-words text-2xl font-semibold text-foreground sm:text-3xl">{title}</h1>
          {description ? <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p> : null}
        </div>
        {action ? <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div> : null}
      </header>
      {children}
    </div>
  );
}
