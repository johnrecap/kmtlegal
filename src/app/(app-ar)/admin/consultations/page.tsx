import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { DashboardShell } from "@/components/layout";
import { AdminNotificationBell } from "@/features/admin/notifications/admin-notification-bell";
import { Badge, Button, DataRecordCard, DataTable, FilterBar, SearchInput, Select, type DataTableColumn } from "@/components/ui";
import { buttonClasses } from "@/components/ui/button";
import { consultationServiceCategoryLabel, consultationStatusLabels, formatDateTime, labelFrom, modeLabels, urgencyLabels } from "@/lib/legal-format";
import {
  consultationOutcomeReasonLabel,
  plan35AdminListAccessibilityCopy,
  plan36ConsultationOutcomeCopy,
  plan37ConsultationOverdueCopy
} from "@/lib/ui-copy";
import { AdminPermissionBlocked as PermissionBlocked, requireAdminRoutePage } from "@/server/auth/page-guards";
import { listAdminConsultations } from "@/server/admin/consultation-review-service";
import {
  CONSULTATION_OUTCOME_VIEWS,
  type ConsultationOutcomeView
} from "@/server/admin/consultation-outcome-service";
import { adminNavForPath } from "../admin-navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "مراجعة الاستشارات | KMT Legal",
  description: "قائمة مراجعة طلبات الاستشارة وتحويلها إلى قضايا."
};

type SearchParams = Record<string, string | string[] | undefined>;
type ConsultationRow = Awaited<ReturnType<typeof listAdminConsultations>>["items"][number];

function flattenSearchParams(searchParams: SearchParams) {
  return Object.fromEntries(
    Object.entries(searchParams).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value ?? ""])
  );
}

function badgeTone(status: string) {
  if (status === "CONVERTED") {
    return "active" as const;
  }
  if (status === "REJECTED") {
    return "danger" as const;
  }
  if (status === "REVIEWING" || status === "SCHEDULED") {
    return "pending" as const;
  }
  return "neutral" as const;
}

function outcomeTone(status: string) {
  if (status === "SUCCESSFUL") return "active" as const;
  if (status === "AWAITING_RESULT") return "pending" as const;
  if (status === "MISSED") return "danger" as const;
  if (status === "NO_SHOW" || status === "CANCELLED") return "closed" as const;
  return "neutral" as const;
}

function consultationReviewBadges(row: ConsultationRow): ReactNode {
  const badges: ReactNode[] = [];
  if (row.operationalTiming.isOverdueUnbooked) {
    badges.push(
      <Badge key="overdue-unbooked" tone="danger">
        {plan36ConsultationOutcomeCopy.tabs.overdue_unbooked}
      </Badge>
    );
  }
  if (row.outcomeStatus === "PENDING" && row.status === "SCHEDULED" && !row.secretaryReviewedAt) {
    badges.push(
      <Badge key="secretary-review" tone="pending">
        لم تراجعه السكرتيرة
      </Badge>
    );
    badges.push(
      <Badge key="new" tone="active">
        جديد
      </Badge>
    );
  }
  if (row.outcomeStatus === "PENDING" && !row.assignedLawyerId) {
    badges.push(
      <Badge key="unassigned" tone="danger">
        بدون محامي
      </Badge>
    );
  }
  return badges;
}

function listHref(
  filters: {
    view?: ConsultationOutcomeView;
    q?: string;
    status?: string;
    assigned?: string;
    review?: string;
    pageSize?: number;
  },
  page: number
) {
  const params = new URLSearchParams();
  if (filters.view) {
    params.set("view", filters.view);
  }
  if (filters.q) {
    params.set("q", filters.q);
  }
  if (filters.status) {
    params.set("status", filters.status);
  }
  if (filters.assigned) {
    params.set("assigned", filters.assigned);
  }
  if (filters.review) {
    params.set("review", filters.review);
  }
  if (filters.pageSize) {
    params.set("pageSize", String(filters.pageSize));
  }
  params.set("page", String(page));
  return `/admin/consultations?${params.toString()}`;
}

function viewHref(filters: Parameters<typeof listHref>[0], view: ConsultationOutcomeView) {
  return listHref({
    ...filters,
    view,
    review: view === "current" || view === "overdue_unbooked" ? filters.review : ""
  }, 1);
}

const columns: Array<DataTableColumn<ConsultationRow>> = [
  {
    key: "client",
    header: "العميل",
    render: (row) => (
      <div>
        <Link className="font-semibold text-kmt-navy hover:underline" href={`/admin/consultations/${row.id}`}>
          {row.fullName}
        </Link>
        <p className="mt-1 text-xs text-kmt-muted">{row.phone}</p>
      </div>
    )
  },
  {
    key: "requestText",
    header: plan36ConsultationOutcomeCopy.list.serviceAndMode,
    render: (row) => (
      <div className="min-w-0">
        <p className="break-words font-medium">{consultationServiceCategoryLabel(row.serviceCategory)}</p>
        <p className="mt-1 text-xs text-kmt-muted">{labelFrom(modeLabels, row.preferredMode)}</p>
      </div>
    )
  },
  {
    key: "status",
    header: plan36ConsultationOutcomeCopy.list.workflowAndOutcome,
    render: (row) => (
      <div className="flex flex-wrap gap-2">
        <Badge tone={outcomeTone(row.outcomeStatus)}>
          {plan36ConsultationOutcomeCopy.statuses[row.outcomeStatus]}
        </Badge>
        <Badge tone={badgeTone(row.status)}>{labelFrom(consultationStatusLabels, row.status)}</Badge>
        {consultationReviewBadges(row)}
      </div>
    )
  },
  {
    key: "primaryAppointment",
    header: plan36ConsultationOutcomeCopy.list.primaryAppointment,
    render: (row) => row.primaryAppointment ? (
      <div className="text-sm">
        <p>{plan36ConsultationOutcomeCopy.list.startsAt}: {formatDateTime(row.primaryAppointment.startsAt)}</p>
        <p className="mt-1 text-xs text-kmt-muted">
          {plan36ConsultationOutcomeCopy.list.endsAt}: {formatDateTime(row.primaryAppointment.endsAt)}
        </p>
      </div>
    ) : (
      <div className="text-sm text-kmt-muted">
        <span>{plan36ConsultationOutcomeCopy.list.noPrimaryAppointment}</span>
        {row.operationalTiming.isOverdueUnbooked && row.operationalTiming.overdueAt ? (
          <p className="mt-1 text-xs text-kmt-danger">
            {plan37ConsultationOverdueCopy.list.overdueSince}: {formatDateTime(row.operationalTiming.overdueAt)}
          </p>
        ) : null}
      </div>
    )
  },
  {
    key: "urgency",
    header: "الأولوية",
    render: (row) => <Badge tone={row.urgency === "URGENT" || row.urgency === "HIGH" ? "pending" : "neutral"}>{labelFrom(urgencyLabels, row.urgency)}</Badge>
  },
  {
    key: "lawyer",
    header: "المحامي",
    render: (row) => row.assignedLawyer?.name ?? "غير معين"
  },
  {
    key: "created",
    header: plan37ConsultationOverdueCopy.list.creationDate,
    render: (row) => formatDateTime(row.createdAt)
  },
  {
    key: "action",
    header: "",
    render: (row) => (
      <Link className="text-sm font-semibold text-kmt-navy hover:underline" href={`/admin/consultations/${row.id}`}>
        مراجعة
      </Link>
    )
  }
];

function ConsultationMobileCard({ row }: { row: ConsultationRow }) {
  return (
    <DataRecordCard
      title={
        <Link className="text-kmt-navy hover:underline" href={`/admin/consultations/${row.id}`}>
          {row.fullName}
        </Link>
      }
      description={<span dir="ltr">{row.phone}</span>}
      badges={
        <>
          <Badge tone={outcomeTone(row.outcomeStatus)}>
            {plan36ConsultationOutcomeCopy.statuses[row.outcomeStatus]}
          </Badge>
          <Badge tone={badgeTone(row.status)}>{labelFrom(consultationStatusLabels, row.status)}</Badge>
          <Badge tone={row.urgency === "URGENT" || row.urgency === "HIGH" ? "pending" : "neutral"}>{labelFrom(urgencyLabels, row.urgency)}</Badge>
          {consultationReviewBadges(row)}
        </>
      }
      fields={[
        { label: plan36ConsultationOutcomeCopy.list.serviceAndMode, value: consultationServiceCategoryLabel(row.serviceCategory) },
        { label: "طريقة التواصل", value: labelFrom(modeLabels, row.preferredMode) },
        { label: "المحامي", value: row.assignedLawyer?.name ?? "غير معين" },
        {
          label: plan36ConsultationOutcomeCopy.list.primaryAppointment,
          value: row.primaryAppointment
            ? `${formatDateTime(row.primaryAppointment.startsAt)} — ${formatDateTime(row.primaryAppointment.endsAt)}`
            : plan36ConsultationOutcomeCopy.list.noPrimaryAppointment
        },
        ...(row.operationalTiming.isOverdueUnbooked && row.operationalTiming.overdueAt ? [{
          label: plan37ConsultationOverdueCopy.list.overdueSince,
          value: formatDateTime(row.operationalTiming.overdueAt)
        }] : []),
        ...(row.outcomeBy ? [{ label: plan36ConsultationOutcomeCopy.list.resultBy, value: row.outcomeBy.name }] : []),
        ...(row.outcomeReasonCode ? [{
          label: plan36ConsultationOutcomeCopy.list.resultReason,
          value: consultationOutcomeReasonLabel(row.outcomeReasonCode) ?? ""
        }] : []),
        { label: plan37ConsultationOverdueCopy.list.creationDate, value: formatDateTime(row.createdAt) }
      ]}
      action={
        <Link className={buttonClasses({ variant: "secondary", size: "sm", className: "min-h-11 w-full" })} href={`/admin/consultations/${row.id}`}>
          {plan36ConsultationOutcomeCopy.list.open}
        </Link>
      }
    />
  );
}

export default async function AdminConsultationsPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const guard = await requireAdminRoutePage("/admin/consultations");
  if (guard.status === "forbidden") {
    return <PermissionBlocked title={guard.title} description={guard.description} />;
  }

  const result = await listAdminConsultations({
    actor: guard.context.principal,
    query: flattenSearchParams((await searchParams) ?? {})
  });
  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));
  const operationalActionView = result.filters.view === "overdue_unbooked"
    ? "overdue_unbooked"
    : "current";

  return (
    <DashboardShell
      eyebrow="لوحة المكتب"
      mode="admin"
      navItems={adminNavForPath("/admin/consultations")}
      title="مراجعة الاستشارات"
      userLabel={guard.context.user.name}
      principal={guard.context.principal}
      notificationBell={<AdminNotificationBell principal={guard.context.principal} />}
    >
      <div className="min-w-0 space-y-5">
        <nav
          aria-label={plan36ConsultationOutcomeCopy.list.tabsLabel}
          className="flex min-h-11 max-w-full gap-2 overflow-x-auto pb-2"
        >
          {CONSULTATION_OUTCOME_VIEWS.map((view) => (
            <Link
              aria-current={result.filters.view === view ? "page" : undefined}
              className={buttonClasses({
                variant: result.filters.view === view ? "primary" : "secondary",
                size: "sm",
                className: "min-h-11 shrink-0"
              })}
              href={viewHref(result.filters, view)}
              key={view}
            >
              <span>{plan36ConsultationOutcomeCopy.tabs[view]}</span>
              <Badge tone={result.filters.view === view ? "active" : "neutral"}>
                {result.viewCounts[view]}
              </Badge>
            </Link>
          ))}
        </nav>

        <p className="rounded border border-kmt-border bg-white px-3 py-2 text-sm leading-6 text-kmt-muted">
          {plan37ConsultationOverdueCopy.list.definitions[result.filters.view]}
        </p>

        <form action="/admin/consultations" method="get">
          <input name="view" type="hidden" value={result.filters.view} />
          <FilterBar ariaLabel={plan35AdminListAccessibilityCopy.consultations.filters}>
            <SearchInput ariaLabel={plan35AdminListAccessibilityCopy.consultations.search} className="min-w-0 flex-1 sm:min-w-80" defaultValue={result.filters.q ?? ""} name="q" placeholder="ابحث بالاسم أو الهاتف أو نص طلب العميل" />
            <Select className="min-w-44" defaultValue={result.filters.status ?? ""} label="الحالة" name="status">
              <option value="">كل الحالات</option>
              {Object.entries(consultationStatusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
            <Select className="min-w-44" defaultValue={result.filters.assigned ?? ""} label="التعيين" name="assigned">
              <option value="">كل الطلبات</option>
              <option value="unassigned">يحتاج تعيين محامي</option>
              <option value="assigned">تم تعيين محامي</option>
            </Select>
            <Select className="min-w-44" defaultValue={result.filters.review ?? ""} label="مراجعة السكرتيرة" name="review">
              <option value="">كل الطلبات</option>
              <option value="unreviewed">تحتاج مراجعة</option>
            </Select>
            <Button type="submit" variant="secondary">
              تطبيق
            </Button>
          </FilterBar>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-kmt-muted">
          <div className="flex flex-wrap gap-2">
            <Link className={buttonClasses({ variant: result.filters.view === operationalActionView && result.filters.assigned === "unassigned" ? "primary" : "secondary", size: "sm" })} href={listHref({ view: operationalActionView, assigned: "unassigned" }, 1)}>
              {result.unassignedTotal} يحتاج تعيين محامي
            </Link>
            <Link className={buttonClasses({ variant: result.filters.view === operationalActionView && result.filters.review === "unreviewed" ? "primary" : "secondary", size: "sm" })} href={listHref({ view: operationalActionView, review: "unreviewed" }, 1)}>
              {result.unreviewedTotal} يحتاج مراجعة السكرتيرة
            </Link>
          </div>
          <p>{result.total} {plan36ConsultationOutcomeCopy.list.countSuffix}</p>
          <p>
            صفحة {result.page} من {totalPages}
          </p>
        </div>

        <DataTable
          caption={plan35AdminListAccessibilityCopy.consultations.table}
          columns={columns}
          rows={result.items}
          empty={plan36ConsultationOutcomeCopy.list.empty}
          mobileRender={(row) => <ConsultationMobileCard row={row} />}
        />

        <div className="flex flex-wrap items-center justify-end gap-3">
          {result.page > 1 ? (
            <Link className={buttonClasses({ variant: "secondary", size: "sm" })} href={listHref(result.filters, result.page - 1)}>
              السابق
            </Link>
          ) : null}
          {result.page < totalPages ? (
            <Link className={buttonClasses({ variant: "secondary", size: "sm" })} href={listHref(result.filters, result.page + 1)}>
              التالي
            </Link>
          ) : null}
        </div>
      </div>
    </DashboardShell>
  );
}
