import Link from "next/link";
import { MaterialSymbol } from "@/components/ui";
import {
  plan35DashboardMetricCopy,
  plan35DashboardScopeCopy,
  plan35DashboardTimeframeCopy,
  plan35DashboardUiCopy
} from "@/lib/ui-copy";
import type { DashboardMetric } from "@/server/admin/dashboard-service";

export function DashboardMetricLink({ metric }: { metric: DashboardMetric }) {
  const copy = plan35DashboardMetricCopy[metric.key];
  const value = metric.state === "ready" ? String(metric.value) : "—";

  return (
    <Link
      aria-label={`${copy.label}: ${value}. ${plan35DashboardUiCopy.openDestination}`}
      className="group block min-w-0 rounded-lg border border-border bg-surface p-5 transition-colors hover:border-kmt-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kmt-gold"
      data-state={metric.state}
      data-testid="dashboard-metric-link"
      href={metric.href}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-primary">{copy.label}</p>
        <MaterialSymbol aria-hidden className="text-xl text-kmt-gold" name="arrow_back" />
      </div>
      <p className="mt-3 text-3xl font-semibold tabular-nums text-foreground" data-visual-dynamic>
        {value}
      </p>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        {metric.state === "ready" ? copy.definition : plan35DashboardUiCopy.metricUnavailable}
      </p>
      <dl className="mt-4 grid gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
        <div className="flex flex-wrap justify-between gap-2">
          <dt>{plan35DashboardUiCopy.timeframe}</dt>
          <dd className="font-medium text-foreground">{plan35DashboardTimeframeCopy[metric.timeframe]}</dd>
        </div>
        <div className="flex flex-wrap justify-between gap-2">
          <dt>{plan35DashboardUiCopy.scope}</dt>
          <dd className="font-medium text-foreground">{plan35DashboardScopeCopy[metric.scopeKey]}</dd>
        </div>
      </dl>
    </Link>
  );
}
