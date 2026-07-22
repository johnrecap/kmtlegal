import Link from "next/link";
import { Badge, SearchInput, StateBlock, buttonClasses } from "@/components/ui";
import {
  canAccessAdminRoute,
  getAdminRoutePolicy,
  type AdminRouteId
} from "@/lib/admin-route-policy";
import {
  caseStatusLabels,
  clientStatusLabels,
  formatDateTime,
  labelFrom
} from "@/lib/legal-format";
import {
  plan35AdminRouteLabels,
  plan35DashboardUiCopy
} from "@/lib/ui-copy";
import type {
  DashboardActivity,
  DashboardDisplayValue,
  DashboardSnapshotV1
} from "@/server/admin/dashboard-service";
import type { Principal } from "@/server/auth/policy";
import { DashboardMetricLink } from "./dashboard-metric-link";
import { DashboardPriorityList } from "./dashboard-priority-list";

export function AdminCommandCenter({
  principal,
  snapshot
}: {
  principal: Principal;
  snapshot: DashboardSnapshotV1;
}) {
  const actions = snapshot.quickActionRouteIds.map(resolveAction).filter(isResolvedAction);
  const canSearchClients = canAccessAdminRoute(principal, "clients.list");

  return (
    <div className="min-w-0 space-y-8" data-testid="admin-command-center">
      <header className="rounded-xl border border-kmt-navy/10 bg-kmt-navy px-5 py-6 text-white sm:px-7">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-kmt-goldLight">{plan35DashboardUiCopy.eyebrow}</p>
            <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">{plan35DashboardUiCopy.title}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/80">{plan35DashboardUiCopy.description}</p>
            <p className="mt-4 text-xs text-white/70">
              {plan35DashboardUiCopy.generatedAt}:{" "}
              <time data-visual-dynamic dateTime={snapshot.generatedAt}>{formatDateTime(snapshot.generatedAt)}</time>
            </p>
          </div>
          {actions.length ? (
            <nav aria-label={plan35DashboardUiCopy.quickActionsTitle} className="flex flex-wrap gap-3">
              {actions.map((action, index) => (
                <Link
                  className={buttonClasses({
                    variant: index === 0 ? "primary" : "secondary",
                    size: "sm",
                    className: index === 0 ? undefined : "border-white text-white hover:bg-white hover:text-kmt-navy"
                  })}
                  data-primary={index === 0 || undefined}
                  href={action.href}
                  key={action.id}
                >
                  {action.label}
                </Link>
              ))}
            </nav>
          ) : null}
        </div>
      </header>

      {canSearchClients ? <ClientSearch /> : null}

      <section aria-labelledby="dashboard-priority-title">
        <SectionHeading
          description={plan35DashboardUiCopy.priorityDescription}
          id="dashboard-priority-title"
          title={plan35DashboardUiCopy.priorityTitle}
        />
        {snapshot.prioritySections.length ? (
          <div className="mt-4 grid min-w-0 gap-5 xl:grid-cols-2">
            {snapshot.prioritySections.map((section) => <DashboardPriorityList key={section.key} section={section} />)}
          </div>
        ) : (
          <StateBlock
            className="mt-4"
            description={plan35DashboardUiCopy.noOperationalQueues}
            title={plan35DashboardUiCopy.priorityTitle}
          />
        )}
      </section>

      {snapshot.metrics.length ? (
        <section aria-labelledby="dashboard-metrics-title">
          <SectionHeading
            description={plan35DashboardUiCopy.metricsDescription}
            id="dashboard-metrics-title"
            title={plan35DashboardUiCopy.metricsTitle}
          />
          <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
            {snapshot.metrics.map((metric) => <DashboardMetricLink key={metric.key} metric={metric} />)}
          </div>
        </section>
      ) : null}

      {snapshot.recentActivity.length ? <RecentActivity activities={snapshot.recentActivity} /> : null}
    </div>
  );
}

function ClientSearch() {
  return (
    <form action="/admin/clients" aria-label={plan35DashboardUiCopy.clientSearchLabel} className="flex min-w-0 flex-col gap-3 rounded-lg border border-kmt-border bg-white p-4 sm:flex-row" method="get" role="search">
      <SearchInput
        ariaLabel={plan35DashboardUiCopy.clientSearchLabel}
        className="min-w-0 flex-1"
        id="dashboard-client-search"
        name="q"
        placeholder={plan35DashboardUiCopy.clientSearchPlaceholder}
      />
      <button className={buttonClasses({ variant: "secondary" })} type="submit">{plan35DashboardUiCopy.search}</button>
    </form>
  );
}

function RecentActivity({ activities }: { activities: DashboardActivity[] }) {
  return (
    <section aria-labelledby="dashboard-activity-title">
      <SectionHeading id="dashboard-activity-title" title={plan35DashboardUiCopy.recentActivityTitle} />
      <ol className="mt-4 divide-y divide-kmt-border rounded-lg border border-kmt-border bg-white">
        {activities.map((activity) => <ActivityRow activity={activity} key={`${activity.kind}:${activity.id}`} />)}
      </ol>
    </section>
  );
}

function ActivityRow({ activity }: { activity: DashboardActivity }) {
  const presentation = activityPresentation(activity);
  return (
    <li>
      <Link className="flex min-w-0 flex-col gap-2 p-4 hover:bg-kmt-canvas focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kmt-gold sm:flex-row sm:items-center sm:justify-between" href={activity.href}>
        <div className="min-w-0">
          <p className="font-semibold text-kmt-ink"><DisplayValue value={presentation.title} /></p>
          <p className="mt-1 break-words text-sm text-kmt-muted" data-visual-dynamic>
            <ActivityMeta activity={activity} />
          </p>
        </div>
        {presentation.badge ? <Badge tone="neutral">{presentation.badge}</Badge> : null}
      </Link>
    </li>
  );
}

function activityPresentation(activity: DashboardActivity) {
  switch (activity.kind) {
    case "case-updated":
      return {
        title: activity.title,
        badge: labelFrom(caseStatusLabels, activity.status)
      };
    case "client-created":
      return {
        title: activity.displayName,
        badge: labelFrom(clientStatusLabels, activity.status)
      };
    case "consultation-created":
      return {
        title: activity.reference,
        badge: plan35DashboardUiCopy.consultationActivityBadge
      };
  }
}

function ActivityMeta({ activity }: { activity: DashboardActivity }) {
  if (activity.kind === "case-updated") {
    return (
      <>
        <DisplayValue value={activity.reference} /> · {formatDateTime(activity.occurredAt)}
      </>
    );
  }
  return <>{formatDateTime(activity.occurredAt)}</>;
}

function SectionHeading({ id, title, description }: { id: string; title: string; description?: string }) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-kmt-ink" id={id}>{title}</h2>
      {description ? <p className="mt-1 text-sm leading-6 text-kmt-muted">{description}</p> : null}
    </div>
  );
}

function resolveAction(routeId: AdminRouteId) {
  const policy = getAdminRoutePolicy(routeId);
  return policy ? { id: policy.id, href: policy.href, label: plan35AdminRouteLabels[policy.labelKey] } : null;
}

function isResolvedAction(action: ReturnType<typeof resolveAction>): action is NonNullable<typeof action> {
  return action !== null;
}

function DisplayValue({ value }: { value: DashboardDisplayValue }) {
  return <bdi dir={value.dir}>{value.text}</bdi>;
}
