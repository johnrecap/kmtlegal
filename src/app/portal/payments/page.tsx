import type { Metadata } from "next";
import Link from "next/link";
import { DashboardShell } from "@/components/layout";
import { Badge, DataTable, type DataTableColumn } from "@/components/ui";
import { formatDateTime, formatMoney, labelFrom, paymentStatusLabels } from "@/lib/legal-format";
import { PermissionBlocked, requirePortalPage } from "@/server/auth/page-guards";
import { listPortalPayments } from "@/server/portal/client-portal-service";
import { portalNavForPath } from "../portal-navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "مدفوعاتي | KMT Legal"
};

type PaymentRow = Awaited<ReturnType<typeof listPortalPayments>>[number];

const columns: Array<DataTableColumn<PaymentRow>> = [
  {
    key: "invoice",
    header: "الفاتورة",
    render: (row) => (
      <div>
        <p className="font-semibold text-kmt-ink">{row.invoiceNumber}</p>
        {row.receiptNumber ? <p className="mt-1 text-xs text-kmt-muted">إيصال: {row.receiptNumber}</p> : null}
      </div>
    )
  },
  {
    key: "case",
    header: "القضية",
    render: (row) =>
      row.case ? (
        <Link className="font-semibold text-kmt-navy hover:underline" href={`/portal/cases/${row.case.id}`}>
          {row.case.internalFileNumber}
        </Link>
      ) : (
        "بدون قضية"
      )
  },
  {
    key: "amount",
    header: "المبلغ",
    render: (row) => formatMoney(row.amount.toString(), row.currency)
  },
  {
    key: "status",
    header: "الحالة",
    render: (row) => <Badge tone={row.status === "PAID" ? "active" : row.status === "CANCELLED" ? "closed" : "pending"}>{labelFrom(paymentStatusLabels, row.status)}</Badge>
  },
  {
    key: "issueDate",
    header: "تاريخ الإصدار",
    render: (row) => formatDateTime(row.issueDate)
  },
  {
    key: "dueDate",
    header: "تاريخ الاستحقاق",
    render: (row) => formatDateTime(row.dueDate)
  }
];

export default async function PortalPaymentsPage() {
  const guard = await requirePortalPage("/portal/payments");
  if (guard.status === "forbidden") {
    return <PermissionBlocked title={guard.title} description={guard.description} />;
  }

  const payments = await listPortalPayments(guard.context.principal);

  return (
    <DashboardShell
      eyebrow="بوابة العميل"
      mode="portal"
      navItems={portalNavForPath("/portal/payments")}
      title="مدفوعاتي"
      userLabel={guard.context.user.name}
    >
      <DataTable columns={columns} rows={payments} empty="لا توجد فواتير أو إيصالات مرتبطة بحسابك حتى الآن." />
    </DashboardShell>
  );
}
