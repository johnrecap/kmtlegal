import { paymentRequiresReview, paymentNeedsOrderVerification } from "@/lib/legal-finance";
import type { Metadata } from "next";
import Link from "next/link";
import { paymentReviewCopy } from "@/lib/ui-copy";
import { DashboardShell } from "@/components/layout";
import { AdminNotificationBell } from "@/features/admin/notifications/admin-notification-bell";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DataRecordCard,
  DataTable,
  FilterBar,
  MetricCard,
  SearchInput,
  Select,
  StateBlock,
  TextInput,
  type DataTableColumn
} from "@/components/ui";
import { buttonClasses } from "@/components/ui/button";
import {
  ConsultationPricingRuleForm,
  PaymentForm,
  PaymentGatewaySettingsForm,
  WebhookReplayButton,
} from "@/features/admin/finance/finance-forms";
import {
  attemptTone,
  editHref,
  exportHref,
  financeTabHref,
  financeTabValues,
  flattenSearchParams,
  listHref,
  operationalFilterHref,
  operationsPageHref,
  paymentFormValue,
  pricingRuleEditHref,
  pricingRuleFormValue,
  statusTone,
  webhookMoneyTone,
  webhookTone,
  type FinanceSearchParams as SearchParams,
  type FinanceTab
} from "@/features/admin/finance/finance-page-helpers";
import { AdminPagination, AdminTabs, MobileFiltersSheet, MoreFiltersPopover } from "@/components/admin";
import { currencyValues, paymentStatusValues } from "@/lib/legal-finance";
import { formatDate, formatDateTime, formatMoney, labelFrom, paymentStatusLabels } from "@/lib/legal-format";
import { plan35AdminListAccessibilityCopy, plan35AdminRestrictedActionCopy } from "@/lib/ui-copy";
import {
  getAdminFinanceOptions,
  getAdminPaymentDetail,
  listAdminPayments
} from "@/server/admin/finance-report-service";
import { AdminPermissionBlocked as PermissionBlocked, requireAdminRoutePage } from "@/server/auth/page-guards";
import { listAdminPaymentAttempts, listAdminPaymentWebhookEvents } from "@/server/payments/payment-service";
import { listAdminConsultationPricingRules } from "@/server/payments/pricing-service";
import { getAdminPaymentGatewaySettings } from "@/server/payments/payment-settings-service";
import { adminNavForPath } from "../admin-navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "الفواتير والتحصيل | KMT Legal",
  description: "إدارة الفواتير اليدوية وسجلات الدفع الأساسية داخل لوحة المكتب."
};

type PaymentRow = Awaited<ReturnType<typeof listAdminPayments>>["items"][number];
type PaymentDetail = Awaited<ReturnType<typeof getAdminPaymentDetail>>;
type PaymentAttemptRow = Awaited<ReturnType<typeof listAdminPaymentAttempts>>["items"][number];
type PaymentWebhookRow = Awaited<ReturnType<typeof listAdminPaymentWebhookEvents>>["items"][number];
type PricingRuleRow = Awaited<ReturnType<typeof listAdminConsultationPricingRules>>[number];
type PaymentGatewaySettings = Awaited<ReturnType<typeof getAdminPaymentGatewaySettings>>;

const paymentAttemptStatusValues = ["CREATED", "PENDING", "PAID", "FAILED", "EXPIRED", "REFUNDED", "DISPUTED", "CANCELLED"] as const;
const webhookProcessingStatusValues = ["PENDING", "PROCESSED", "FAILED", "IGNORED"] as const;
const webhookProviderValues = ["paytabs", "paymob"] as const;
const webhookMoneyStatusValues = ["MATCHED", "AMOUNT_MISMATCH", "CURRENCY_MISMATCH", "MISSING_ATTEMPT", "NOT_PAID", "NEEDS_REVIEW"] as const;
const paymentOperationsPageSize = 20;

const paymentAttemptStatusLabels: Record<string, string> = {
  CREATED: "تم الإنشاء",
  PENDING: "قيد الانتظار",
  PAID: "مدفوع",
  FAILED: "فشل",
  EXPIRED: "انتهت المهلة",
  REFUNDED: "مسترد",
  DISPUTED: "اعتراض",
  CANCELLED: "ملغي"
};

const webhookProcessingStatusLabels: Record<string, string> = {
  PENDING: "قيد المعالجة",
  PROCESSED: "تمت المعالجة",
  FAILED: "فشل",
  IGNORED: "تم تجاهله"
};

const webhookProviderLabels: Record<string, string> = {
  paytabs: "PayTabs",
  paymob: "Paymob"
};

const webhookSignatureStatusLabels: Record<string, string> = {
  VERIFIED: "موثّق",
  UNVERIFIED: "غير متحقق",
  INVALID: "غير صالح"
};

const webhookMoneyStatusLabels: Record<string, string> = {
  MATCHED: "مطابق",
  AMOUNT_MISMATCH: "فرق مبلغ",
  CURRENCY_MISMATCH: "فرق عملة",
  MISSING_ATTEMPT: "بدون محاولة",
  NOT_PAID: "لم يصل كمدفوع",
  NEEDS_REVIEW: "يحتاج مراجعة"
};

const paymentIssueLabels: Record<string, string> = {
  PAYMENT_AMOUNT_MISMATCH: "المبلغ القادم من بوابة الدفع لا يطابق المبلغ المطلوب.",
  PAYMENT_CURRENCY_MISMATCH: "عملة الدفع القادمة من البوابة لا تطابق العملة المطلوبة.",
  ATTEMPT_EXPIRED: "انتهت مهلة الدفع وتم تحرير الموعد.",
  INVALID_SIGNATURE: "توقيع إشعار بوابة الدفع غير صحيح.",
  WEBHOOK_PROCESSING_FAILED: "إشعار الدفع لم يكتمل ويحتاج مراجعة.",
  WEBHOOK_PAYLOAD_HASH_MISMATCH: "وصل إشعار دفع مكرر بنفس الرقم لكن بمحتوى مختلف، ويحتاج مراجعة.",
  PROVIDER_TRANSACTION_ATTEMPT_MISMATCH: "رقم عملية الدفع مرتبط بمحاولة دفع أخرى، وتم منع تغيير السجل."
};

function paymentIssueText(code?: string | null) {
  if (!code) {
    return "";
  }
  return paymentIssueLabels[code] ?? `تحتاج مراجعة: ${code}`;
}

function summaryAmount(amount: number, currency?: string) {
  if (currency) {
    return formatMoney(amount, currency);
  }

  return `${new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 2 }).format(amount)} مجموع خام`;
}

function columns(query: Record<string, string>): Array<DataTableColumn<PaymentRow>> {
  return [
    {
      key: "invoice",
      header: "الفاتورة",
      render: (row) => (
        <div>
          <p className="font-semibold text-foreground">{row.invoiceNumber}</p>
          <p className="mt-1 text-xs text-muted-foreground">أُنشئت بواسطة {row.createdBy?.name ?? "النظام"}</p>
        </div>
      )
    },
    {
      key: "client",
      header: "العميل / القضية",
      render: (row) => (
        <div>
          <Link className="font-semibold text-primary hover:underline" href={`/admin/clients/${row.client.id}`}>
            {row.client.fullName}
          </Link>
          <p className="mt-1 text-xs text-muted-foreground">
            {row.case ? `${row.case.internalFileNumber} - ${row.case.title}` : "بدون قضية مرتبطة"}
          </p>
        </div>
      )
    },
    {
      key: "amount",
      header: "القيمة",
      render: (row) => <span className="font-semibold tabular-nums">{formatMoney(row.amount.toString(), row.currency)}</span>
    },
    {
      key: "status",
      header: "الحالة",
      render: (row) => <Badge tone={paymentRequiresReview(row.paymentAttempt) ? "danger" : statusTone(row.status)}>{paymentRequiresReview(row.paymentAttempt) ? paymentReviewCopy.ar.review : labelFrom(paymentStatusLabels, row.status)}</Badge>
    },
    {
      key: "dates",
      header: "التواريخ",
      render: (row) => (
        <div className="text-sm leading-6">
          <p>إصدار: {formatDate(row.issueDate)}</p>
          <p className="text-muted-foreground">استحقاق: {formatDate(row.dueDate)}</p>
        </div>
      )
    },
    {
      key: "receipt",
      header: "الدفع",
      render: (row) => (
        <div className="text-sm leading-6">
          <p>{row.paymentMethod || "غير محدد"}</p>
          <p className="text-muted-foreground">{row.receiptNumber || "بدون إيصال"}</p>
        </div>
      )
    },
    {
      key: "updated",
      header: "آخر تحديث",
      render: (row) => formatDateTime(row.updatedAt)
    },
    {
      key: "action",
      header: "",
      render: (row) => (
        <Link className="text-sm font-semibold text-primary hover:underline" href={editHref(row.id, query)}>
          تعديل
        </Link>
      )
    }
  ];
}

function PaymentMobileCard({ row, query }: { row: PaymentRow; query: Record<string, string> }) {
  return (
    <DataRecordCard
      title={row.invoiceNumber}
      description={`أُنشئت بواسطة ${row.createdBy?.name ?? "النظام"}`}
      badges={<Badge tone={paymentRequiresReview(row.paymentAttempt) ? "danger" : statusTone(row.status)}>{paymentRequiresReview(row.paymentAttempt) ? paymentReviewCopy.ar.review : labelFrom(paymentStatusLabels, row.status)}</Badge>}
      fields={[
        {
          label: "العميل",
          value: (
            <Link className="font-semibold text-primary hover:underline" href={`/admin/clients/${row.client.id}`}>
              {row.client.fullName}
            </Link>
          )
        },
        { label: "القضية", value: row.case ? `${row.case.internalFileNumber} - ${row.case.title}` : "بدون قضية مرتبطة" },
        { label: "القيمة", value: formatMoney(row.amount.toString(), row.currency) },
        { label: "التواريخ", value: `إصدار: ${formatDate(row.issueDate)} · استحقاق: ${formatDate(row.dueDate)}` },
        { label: "الدفع", value: `${row.paymentMethod || "غير محدد"} · ${row.receiptNumber || "بدون إيصال"}` },
        { label: "آخر تحديث", value: formatDateTime(row.updatedAt) }
      ]}
      action={
        <Link className={buttonClasses({ variant: "secondary", size: "sm", className: "min-h-11 w-full" })} href={editHref(row.id, query)}>
          تعديل
        </Link>
      }
    />
  );
}

function PaymentGatewayOperationsPanel({
  activeTab,
  attempts,
  attemptPage,
  attemptPageSize,
  attemptTotal,
  canManage,
  gatewaySettings,
  query,
  selectedPricingRule,
  pricingRules,
  webhookEvents,
  webhookPage,
  webhookPageSize,
  webhookTotal
}: {
  activeTab: FinanceTab;
  attempts: PaymentAttemptRow[];
  attemptPage: number;
  attemptPageSize: number;
  attemptTotal: number;
  canManage: boolean;
  gatewaySettings: PaymentGatewaySettings;
  query: Record<string, string>;
  selectedPricingRule: PricingRuleRow | null;
  pricingRules: PricingRuleRow[];
  webhookEvents: PaymentWebhookRow[];
  webhookPage: number;
  webhookPageSize: number;
  webhookTotal: number;
}) {
  const attemptTotalPages = Math.max(1, Math.ceil(attemptTotal / attemptPageSize));
  const webhookTotalPages = Math.max(1, Math.ceil(webhookTotal / webhookPageSize));

  return (
    <div className="space-y-5">
      {activeTab === "gateway" ? (
      <Card>
        <CardHeader>
          <CardTitle>وضع الحجز وبوابة الدفع</CardTitle>
          <CardDescription>لا يتم حفظ المفاتيح هنا. عند تفعيل الدردشة مع الدفع يجب وجود سعر استشارة نشط وبوابة دفع جاهزة.</CardDescription>
        </CardHeader>
        <CardContent>
          {canManage ? (
            <PaymentGatewaySettingsForm settings={gatewaySettings} />
          ) : (
            <StateBlock tone="permission" {...plan35AdminRestrictedActionCopy.paymentSettingsManage} />
          )}
        </CardContent>
      </Card>
      ) : null}
      {activeTab === "pricing" ? (
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <Card>
          <CardHeader>
            <CardTitle>قواعد أسعار الاستشارة</CardTitle>
            <CardDescription>السعر يأتي من قواعد المكتب فقط.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {pricingRules.length ? (
              pricingRules.slice(0, 8).map((rule) => (
                <div key={rule.id} className="rounded border border-border bg-surface px-3 py-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">{rule.label || rule.serviceCategory || "سعر عام"}</p>
                      <p className="mt-1 text-muted-foreground">
                        {formatMoney(rule.amount.toString(), rule.currency)} · {rule.mode || "كل الطرق"} · v{rule.version}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone={rule.active ? "active" : "neutral"}>{rule.active ? "نشط" : "متوقف"}</Badge>
                      {canManage ? (
                        <Link className="text-sm font-semibold text-primary hover:underline" href={pricingRuleEditHref(rule.id, query)}>
                          تعديل
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <StateBlock tone="empty" title="لا توجد قواعد سعر" description="يجب إنشاء قاعدة سعر نشطة قبل تفعيل الدفع العام للحجوزات." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{selectedPricingRule ? "تعديل سعر الاستشارة" : "سعر استشارة جديد"}</CardTitle>
            <CardDescription>اترك التصنيف أو الطريقة فارغة لاستخدام السعر كقاعدة عامة.</CardDescription>
          </CardHeader>
          <CardContent>
            {canManage ? (
              <ConsultationPricingRuleForm pricingRule={selectedPricingRule ? pricingRuleFormValue(selectedPricingRule) : undefined} />
            ) : (
              <StateBlock tone="permission" {...plan35AdminRestrictedActionCopy.paymentSettingsManage} />
            )}
          </CardContent>
        </Card>
      </div>
      ) : null}
      {activeTab === "attempts" ? (
      <div className="space-y-5">
        <form action="/admin/finance" method="get">
          <input name="tab" type="hidden" value="attempts" />
          <input type="hidden" name="webhookQ" value={query.webhookQ ?? ""} />
          <input type="hidden" name="webhookStatus" value={query.webhookStatus ?? ""} />
          <input type="hidden" name="webhookProvider" value={query.webhookProvider ?? ""} />
          <input type="hidden" name="webhookMoneyStatus" value={query.webhookMoneyStatus ?? ""} />
          <FilterBar ariaLabel={plan35AdminListAccessibilityCopy.finance.operationsFilters}>
            <SearchInput ariaLabel={plan35AdminListAccessibilityCopy.finance.attemptsSearch} className="min-w-0 flex-1 sm:min-w-72" defaultValue={query.attemptQ ?? ""} name="attemptQ" placeholder="بحث في محاولات الدفع أو رقم الهاتف" />
            <Select className="min-w-44" defaultValue={query.attemptStatus ?? ""} label="حالة محاولة الدفع" name="attemptStatus">
              <option value="">كل المحاولات</option>
              {paymentAttemptStatusValues.map((status) => (
                <option key={status} value={status}>
                  {paymentAttemptStatusLabels[status]}
                </option>
              ))}
            </Select>
            <Button type="submit" variant="secondary">
              تطبيق
            </Button>
            <Link className="text-sm font-semibold text-primary hover:underline" href={operationalFilterHref({ tab: "attempts", webhookQ: query.webhookQ ?? "", webhookStatus: query.webhookStatus ?? "", webhookProvider: query.webhookProvider ?? "", webhookMoneyStatus: query.webhookMoneyStatus ?? "" })}>
              مسح فلاتر التشغيل
            </Link>
          </FilterBar>
        </form>
        <Card>
          <CardHeader>
            <CardTitle>محاولات الدفع</CardTitle>
            <CardDescription>محاولات Hosted Checkout وحجز المواعيد المؤقت. المعروض {attempts.length} من {attemptTotal}.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {attempts.length ? (
              attempts.map((attempt) => (
                <div key={attempt.id} className="rounded border border-border bg-surface px-3 py-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-foreground">{attempt.client.fullName}</p>
                    <Badge tone={paymentRequiresReview(attempt) ? "danger" : attemptTone(attempt.status)}>{paymentNeedsOrderVerification(attempt) ? paymentReviewCopy.ar.orderVerification : paymentRequiresReview(attempt) ? paymentReviewCopy.ar.review : paymentAttemptStatusLabels[attempt.status] ?? attempt.status}</Badge>
                  </div>
                  <p className="mt-1 text-muted-foreground">
                    {formatMoney(attempt.amount.toString(), attempt.currency)} · {attempt.provider} · {formatDateTime(attempt.appointment.startsAt)}
                  </p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{attempt.providerSessionId || attempt.id}</p>
                  {paymentIssueText(attempt.failureCode) ? (
                    <div className="mt-3 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900" role="status">
                      {paymentIssueText(attempt.failureCode)}
                    </div>
                  ) : null}
                </div>
              ))
            ) : (
              <StateBlock tone="empty" title="لا توجد محاولات دفع" description="ستظهر محاولات الدفع هنا بعد إنشاء أول checkout." />
            )}
            {attemptTotalPages > 1 ? (
              <AdminPagination
                page={attemptPage}
                pageSize={attemptPageSize}
                total={attemptTotal}
                hrefForPage={(page) => operationsPageHref(query, "attemptPage", page)}
                summary={`صفحة ${attemptPage} من ${attemptTotalPages}`}
              />
            ) : null}
          </CardContent>
        </Card>
      </div>
      ) : null}
      {activeTab === "webhooks" ? (
      <div className="space-y-5">
        <div className="flex flex-wrap items-start gap-3">
        <form action="/admin/finance" className="min-w-0 flex-1" method="get">
          <input name="tab" type="hidden" value="webhooks" />
          <input type="hidden" name="attemptQ" value={query.attemptQ ?? ""} />
          <input type="hidden" name="attemptStatus" value={query.attemptStatus ?? ""} />
          <FilterBar ariaLabel={plan35AdminListAccessibilityCopy.finance.operationsFilters}>
            <SearchInput ariaLabel={plan35AdminListAccessibilityCopy.finance.webhooksSearch} className="min-w-0 flex-1 sm:min-w-72" defaultValue={query.webhookQ ?? ""} name="webhookQ" placeholder="بحث في إشعارات البوابة" />
            <span className="hidden lg:contents">
            <Select className="min-w-44" defaultValue={query.webhookStatus ?? ""} label="حالة إشعار الدفع" name="webhookStatus">
              <option value="">كل الإشعارات</option>
              {webhookProcessingStatusValues.map((status) => (
                <option key={status} value={status}>
                  {webhookProcessingStatusLabels[status]}
                </option>
              ))}
            </Select>
            </span>
            <input type="hidden" name="webhookProvider" value={query.webhookProvider ?? ""} />
            <input type="hidden" name="webhookMoneyStatus" value={query.webhookMoneyStatus ?? ""} />
            <span className="hidden lg:contents">
            <Button type="submit" variant="secondary">
              تطبيق
            </Button>
            </span>
          </FilterBar>
        </form>
        <MoreFiltersPopover triggerLabel="المزيد من الفلاتر">
          <form action="/admin/finance" className="space-y-3" method="get">
            <input name="tab" type="hidden" value="webhooks" />
            <input type="hidden" name="attemptQ" value={query.attemptQ ?? ""} />
            <input type="hidden" name="attemptStatus" value={query.attemptStatus ?? ""} />
            <input type="hidden" name="webhookQ" value={query.webhookQ ?? ""} />
            <input type="hidden" name="webhookStatus" value={query.webhookStatus ?? ""} />
            <Select className="w-full" defaultValue={query.webhookProvider ?? ""} label="بوابة الدفع" name="webhookProvider">
              <option value="">كل البوابات</option>
              {webhookProviderValues.map((provider) => (
                <option key={provider} value={provider}>
                  {webhookProviderLabels[provider]}
                </option>
              ))}
            </Select>
            <Select className="w-full" defaultValue={query.webhookMoneyStatus ?? ""} label="مطابقة الأموال" name="webhookMoneyStatus">
              <option value="">كل حالات المطابقة</option>
              {webhookMoneyStatusValues.map((status) => (
                <option key={status} value={status}>
                  {webhookMoneyStatusLabels[status]}
                </option>
              ))}
            </Select>
            <Button className="w-full" type="submit" variant="secondary">
              تطبيق
            </Button>
          </form>
        </MoreFiltersPopover>
        <MobileFiltersSheet description="ابحث وصفِّ إشعارات بوابة الدفع." title="فلاتر الويب هوك" triggerLabel="الفلاتر">
          <form action="/admin/finance" className="space-y-3" method="get">
            <input name="tab" type="hidden" value="webhooks" />
            <input type="hidden" name="attemptQ" value={query.attemptQ ?? ""} />
            <input type="hidden" name="attemptStatus" value={query.attemptStatus ?? ""} />
            <SearchInput ariaLabel={plan35AdminListAccessibilityCopy.finance.webhooksSearch} className="w-full" defaultValue={query.webhookQ ?? ""} name="webhookQ" placeholder="بحث في إشعارات البوابة" />
            <Select className="w-full" defaultValue={query.webhookStatus ?? ""} label="حالة إشعار الدفع" name="webhookStatus">
              <option value="">كل الإشعارات</option>
              {webhookProcessingStatusValues.map((status) => (
                <option key={status} value={status}>
                  {webhookProcessingStatusLabels[status]}
                </option>
              ))}
            </Select>
            <Select className="w-full" defaultValue={query.webhookProvider ?? ""} label="بوابة الدفع" name="webhookProvider">
              <option value="">كل البوابات</option>
              {webhookProviderValues.map((provider) => (
                <option key={provider} value={provider}>
                  {webhookProviderLabels[provider]}
                </option>
              ))}
            </Select>
            <Select className="w-full" defaultValue={query.webhookMoneyStatus ?? ""} label="مطابقة الأموال" name="webhookMoneyStatus">
              <option value="">كل حالات المطابقة</option>
              {webhookMoneyStatusValues.map((status) => (
                <option key={status} value={status}>
                  {webhookMoneyStatusLabels[status]}
                </option>
              ))}
            </Select>
            <Button className="w-full" type="submit" variant="secondary">
              تطبيق
            </Button>
          </form>
        </MobileFiltersSheet>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>إشعارات بوابة الدفع</CardTitle>
            <CardDescription>حالة التوقيع والمعالجة وإعادة التشغيل الآمن. المعروض {webhookEvents.length} من {webhookTotal}.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {webhookEvents.length ? (
              webhookEvents.map((event) => {
                const money = event.moneyComparison;
                const moneyIssue = money.differenceAmount && money.differenceAmount !== "0" ? `فرق القيمة: ${formatMoney(money.differenceAmount, money.expectedCurrency ?? money.receivedCurrency ?? "EGP")}` : "";
                return (
                  <div key={event.id} className="rounded border border-border bg-surface px-3 py-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate font-semibold text-foreground">{event.eventId}</p>
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <Badge tone={webhookMoneyTone(money.status)}>{webhookMoneyStatusLabels[money.status] ?? money.status}</Badge>
                        <Badge tone={webhookTone(event.processingStatus)}>{webhookProcessingStatusLabels[event.processingStatus] ?? event.processingStatus}</Badge>
                      </div>
                    </div>
                    <p className="mt-1 text-muted-foreground">
                      {webhookProviderLabels[event.provider] ?? "بوابة الدفع"} · التوقيع {webhookSignatureStatusLabels[event.signatureStatus] ?? "غير معروف"} · مرات إعادة المعالجة {event.replayCount}
                    </p>
                    <details className="mt-3 rounded border border-border bg-surface-muted px-3 py-2 text-xs leading-5 text-muted-foreground">
                      <summary className="min-h-11 cursor-pointer py-2 font-semibold text-foreground">التفاصيل المالية والتقنية</summary>
                      <div className="grid gap-2 pt-2 sm:grid-cols-2">
                      <p>
                        <span className="font-semibold text-foreground">المبلغ المطلوب من العميل: </span>
                        {money.expectedAmount && money.expectedCurrency ? formatMoney(money.expectedAmount, money.expectedCurrency) : "غير مرتبط بمحاولة دفع"}
                      </p>
                      <p>
                        <span className="font-semibold text-foreground">المبلغ الواصل من الويب هوك: </span>
                        {money.receivedAmount && money.receivedCurrency ? formatMoney(money.receivedAmount, money.receivedCurrency) : "غير موجود في الإشعار"}
                      </p>
                      <p>
                        <span className="font-semibold text-foreground">حالة البوابة: </span>
                        {money.providerStatus ?? "غير محددة"}
                      </p>
                      <p>
                        <span className="font-semibold text-foreground">نتيجة المطابقة: </span>
                        {webhookMoneyStatusLabels[money.status] ?? money.status}
                        {moneyIssue ? ` · ${moneyIssue}` : ""}
                      </p>
                      </div>
                    </details>
                    <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(event.receivedAt)}</p>
                    {paymentIssueText(event.errorCode || (event.signatureStatus === "INVALID" ? "INVALID_SIGNATURE" : null)) ? (
                      <div className="mt-3 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900" role="status">
                        {paymentIssueText(event.errorCode || (event.signatureStatus === "INVALID" ? "INVALID_SIGNATURE" : null))}
                      </div>
                    ) : null}
                    {canManage ? <WebhookReplayButton eventId={event.id} /> : null}
                  </div>
                );
              })
            ) : (
              <StateBlock tone="empty" title="لا توجد Webhooks" description="ستظهر أحداث بوابة الدفع بعد أول إشعار من المزود." />
            )}
            {webhookTotalPages > 1 ? (
              <AdminPagination
                page={webhookPage}
                pageSize={webhookPageSize}
                total={webhookTotal}
                hrefForPage={(page) => operationsPageHref(query, "webhookPage", page)}
                summary={`صفحة ${webhookPage} من ${webhookTotalPages}`}
              />
            ) : null}
          </CardContent>
        </Card>
      </div>
      ) : null}
    </div>
  );
}

export default async function AdminFinancePage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const guard = await requireAdminRoutePage("/admin/finance");
  if (guard.status === "forbidden") {
    return <PermissionBlocked title={guard.title} description={guard.description} />;
  }

  const query = flattenSearchParams((await searchParams) ?? {});
  const attemptPage = Math.max(1, Number.parseInt(query.attemptPage ?? "1", 10) || 1);
  const webhookPage = Math.max(1, Number.parseInt(query.webhookPage ?? "1", 10) || 1);
  const [result, options, pricingRules, paymentGatewaySettings, paymentAttempts, webhookEvents] = await Promise.all([
    listAdminPayments({ actor: guard.context.principal, query }),
    getAdminFinanceOptions(guard.context.principal),
    listAdminConsultationPricingRules({ actor: guard.context.principal, query: { active: "" } }),
    getAdminPaymentGatewaySettings({ actor: guard.context.principal }),
    listAdminPaymentAttempts({
      actor: guard.context.principal,
      query: { page: attemptPage, pageSize: paymentOperationsPageSize, status: query.attemptStatus ?? "", q: query.attemptQ ?? "" }
    }),
    listAdminPaymentWebhookEvents({
      actor: guard.context.principal,
      query: {
        page: webhookPage,
        pageSize: paymentOperationsPageSize,
        provider: query.webhookProvider ?? "",
        processingStatus: query.webhookStatus ?? "",
        moneyStatus: query.webhookMoneyStatus ?? "",
        q: query.webhookQ ?? ""
      }
    })
  ]);
  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));
  const selectedCurrency = result.filters.currency || undefined;
  const editPaymentId = query.editPaymentId;
  const editPricingRuleId = query.editPricingRuleId;
  let editPayment: PaymentDetail | null = null;
  const selectedPricingRule = pricingRules.find((rule) => rule.id === editPricingRuleId) ?? null;

  if (editPaymentId && options.canManage) {
    try {
      editPayment = await getAdminPaymentDetail({ actor: guard.context.principal, paymentId: editPaymentId });
    } catch {
      editPayment = null;
    }
  }
  const activeTab: FinanceTab = financeTabValues.includes(query.tab as FinanceTab)
    ? (query.tab as FinanceTab)
    : "invoices";
  const financeTabs = [
    { value: "invoices", label: "الفواتير", href: financeTabHref(query, "invoices") },
    { value: "gateway", label: "البوابة", href: financeTabHref(query, "gateway") },
    { value: "pricing", label: "الأسعار", href: financeTabHref(query, "pricing") },
    { value: "attempts", label: "المحاولات", href: financeTabHref(query, "attempts") },
    { value: "webhooks", label: "إشعارات البوابة", href: financeTabHref(query, "webhooks") }
  ];

  return (
    <DashboardShell
      eyebrow="لوحة المكتب"
      mode="admin"
      navItems={adminNavForPath("/admin/finance")}
      title="الفواتير والتحصيل"
      userLabel={guard.context.user.name}
      principal={guard.context.principal}
      notificationBell={<AdminNotificationBell principal={guard.context.principal} />}
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="إجمالي الفواتير"
            value={String(result.summary.invoiceCount)}
            meta={summaryAmount(result.summary.totalAmount, selectedCurrency)}
          />
          <MetricCard label="المدفوع" value={String(result.summary.paidCount)} meta={summaryAmount(result.summary.paidAmount, selectedCurrency)} />
          <MetricCard label="المفتوح" value={String(result.summary.openCount)} meta={summaryAmount(result.summary.openAmount, selectedCurrency)} />
          <MetricCard label="المتأخر" value={String(result.summary.overdueCount)} meta={summaryAmount(result.summary.overdueAmount, selectedCurrency)} />
        </div>

          <p className="text-sm text-muted-foreground">{paymentReviewCopy.ar.totals} {paymentReviewCopy.ar.count}: {result.summary.reviewCount}. {paymentReviewCopy.ar.unallocated}: {result.summary.unallocatedReviewCount}</p>
          {!selectedCurrency ? (
          <div className="rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
            الأرقام المجمعة المعروضة هنا مجموع خام عبر العملات. استخدم فلتر العملة للحصول على قراءة مالية دقيقة.
          </div>
        ) : null}

        <AdminTabs
          active={activeTab}
          ariaLabel="أقسام المالية"
          tabs={financeTabs}
        />

        {activeTab === "invoices" ? (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_25rem]">
          <div className="space-y-5">
            <div className="flex flex-wrap items-start gap-3">
            <form action="/admin/finance" className="min-w-0 flex-1" method="get">
              <input name="tab" type="hidden" value="invoices" />
              <FilterBar ariaLabel={plan35AdminListAccessibilityCopy.finance.invoicesFilters}>
                <SearchInput ariaLabel={plan35AdminListAccessibilityCopy.finance.invoicesSearch} className="min-w-0 flex-1 sm:min-w-80" defaultValue={result.filters.q ?? ""} name="q" placeholder="ابحث برقم الفاتورة أو العميل أو الإيصال" />
                <span className="hidden lg:contents">
                <Select className="min-w-40" defaultValue={result.filters.status ?? ""} label="الحالة" name="status">
                  <option value="">كل الحالات</option>
                  {paymentStatusValues.map((status) => (
                    <option key={status} value={status}>
                      {labelFrom(paymentStatusLabels, status)}
                    </option>
                  ))}
                </Select>
                </span>
                <span className="hidden lg:contents">
                <Select className="min-w-36" defaultValue={result.filters.currency ?? ""} label="العملة" name="currency">
                  <option value="">كل العملات</option>
                  {currencyValues.map((currency) => (
                    <option key={currency} value={currency}>
                      {currency}
                    </option>
                  ))}
                </Select>
                </span>
                <input type="hidden" name="clientId" value={result.filters.clientId ?? ""} />
                <input type="hidden" name="caseId" value={result.filters.caseId ?? ""} />
                <input type="hidden" name="dateFrom" value={result.filters.dateFrom ?? ""} />
                <input type="hidden" name="dateTo" value={result.filters.dateTo ?? ""} />
                <input type="hidden" name="sortBy" value={result.filters.sortBy} />
                <input type="hidden" name="sortDirection" value={result.filters.sortDirection} />
                <span className="hidden lg:contents">
                <Button type="submit" variant="secondary">
                  تطبيق
                </Button>
                </span>
              </FilterBar>
            </form>
            <MoreFiltersPopover triggerLabel="المزيد من الفلاتر">
              <form action="/admin/finance" className="space-y-3" method="get">
                <input name="tab" type="hidden" value="invoices" />
                <input type="hidden" name="q" value={result.filters.q ?? ""} />
                <input type="hidden" name="status" value={result.filters.status ?? ""} />
                <input type="hidden" name="currency" value={result.filters.currency ?? ""} />
                <Select className="w-full" defaultValue={result.filters.clientId ?? ""} label="العميل" name="clientId">
                  <option value="">كل العملاء</option>
                  {options.clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.fullName}
                    </option>
                  ))}
                </Select>
                <Select className="w-full" defaultValue={result.filters.caseId ?? ""} label="القضية" name="caseId">
                  <option value="">كل القضايا</option>
                  {options.cases.map((legalCase) => (
                    <option key={legalCase.id} value={legalCase.id}>
                      {legalCase.internalFileNumber} - {legalCase.title}
                    </option>
                  ))}
                </Select>
                <TextInput className="w-full" defaultValue={result.filters.dateFrom ?? ""} label="من" name="dateFrom" type="date" />
                <TextInput className="w-full" defaultValue={result.filters.dateTo ?? ""} label="إلى" name="dateTo" type="date" />
                <Select className="w-full" defaultValue={result.filters.sortBy} label="الترتيب" name="sortBy">
                  <option value="issueDate">تاريخ الإصدار</option>
                  <option value="dueDate">تاريخ الاستحقاق</option>
                  <option value="createdAt">تاريخ الإدخال</option>
                  <option value="amount">القيمة</option>
                  <option value="status">الحالة</option>
                </Select>
                <Select className="w-full" defaultValue={result.filters.sortDirection} label="الاتجاه" name="sortDirection">
                  <option value="desc">تنازلي</option>
                  <option value="asc">تصاعدي</option>
                </Select>
                <Button className="w-full" type="submit" variant="secondary">
                  تطبيق
                </Button>
              </form>
            </MoreFiltersPopover>
            <MobileFiltersSheet description="ابحث وصفِّ الفواتير." title="فلاتر الفواتير" triggerLabel="الفلاتر">
              <form action="/admin/finance" className="space-y-3" method="get">
                <input name="tab" type="hidden" value="invoices" />
                <SearchInput ariaLabel={plan35AdminListAccessibilityCopy.finance.invoicesSearch} className="w-full" defaultValue={result.filters.q ?? ""} name="q" placeholder="ابحث برقم الفاتورة أو العميل أو الإيصال" />
                <Select className="w-full" defaultValue={result.filters.status ?? ""} label="الحالة" name="status">
                  <option value="">كل الحالات</option>
                  {paymentStatusValues.map((status) => (
                    <option key={status} value={status}>
                      {labelFrom(paymentStatusLabels, status)}
                    </option>
                  ))}
                </Select>
                <Select className="w-full" defaultValue={result.filters.currency ?? ""} label="العملة" name="currency">
                  <option value="">كل العملات</option>
                  {currencyValues.map((currency) => (
                    <option key={currency} value={currency}>
                      {currency}
                    </option>
                  ))}
                </Select>
                <Select className="w-full" defaultValue={result.filters.clientId ?? ""} label="العميل" name="clientId">
                  <option value="">كل العملاء</option>
                  {options.clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.fullName}
                    </option>
                  ))}
                </Select>
                <Select className="w-full" defaultValue={result.filters.caseId ?? ""} label="القضية" name="caseId">
                  <option value="">كل القضايا</option>
                  {options.cases.map((legalCase) => (
                    <option key={legalCase.id} value={legalCase.id}>
                      {legalCase.internalFileNumber} - {legalCase.title}
                    </option>
                  ))}
                </Select>
                <TextInput className="w-full" defaultValue={result.filters.dateFrom ?? ""} label="من" name="dateFrom" type="date" />
                <TextInput className="w-full" defaultValue={result.filters.dateTo ?? ""} label="إلى" name="dateTo" type="date" />
                <Select className="w-full" defaultValue={result.filters.sortBy} label="الترتيب" name="sortBy">
                  <option value="issueDate">تاريخ الإصدار</option>
                  <option value="dueDate">تاريخ الاستحقاق</option>
                  <option value="createdAt">تاريخ الإدخال</option>
                  <option value="amount">القيمة</option>
                  <option value="status">الحالة</option>
                </Select>
                <Select className="w-full" defaultValue={result.filters.sortDirection} label="الاتجاه" name="sortDirection">
                  <option value="desc">تنازلي</option>
                  <option value="asc">تصاعدي</option>
                </Select>
                <Button className="w-full" type="submit" variant="secondary">
                  تطبيق
                </Button>
              </form>
            </MobileFiltersSheet>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
              <p>{result.total} فاتورة داخل الفلاتر الحالية</p>
              <div className="flex flex-wrap items-center gap-3">
                <Link className={buttonClasses({ variant: "secondary", size: "sm" })} href={exportHref(query)}>
                  تصدير CSV
                </Link>
                <p>
                  صفحة {result.page} من {totalPages}
                </p>
              </div>
            </div>

            <DataTable caption={plan35AdminListAccessibilityCopy.finance.invoicesTable} columns={columns(query)} rows={result.items} empty="لا توجد فواتير مطابقة للفلاتر الحالية." mobileRender={(row) => <PaymentMobileCard row={row} query={query} />} />

            <AdminPagination
              page={result.page}
              pageSize={result.pageSize}
              total={result.total}
              hrefForPage={(page) => listHref(result.filters, page)}
              resetHref="/admin/finance?tab=invoices"
              resetLabel="مسح الفلاتر"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{editPayment ? "تعديل فاتورة" : "فاتورة يدوية جديدة"}</CardTitle>
              <CardDescription>
                سجلات مالية يدوية للمتابعة الداخلية. لا توجد بوابة دفع أو ضرائب أو بنود تفصيلية في هذه المرحلة.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {options.canManage ? (
                <PaymentForm
                  cases={options.cases}
                  clients={options.clients}
                  mode={editPayment ? "edit" : "create"}
                  payment={editPayment ? paymentFormValue(editPayment) : undefined}
                />
              ) : (
                <StateBlock tone="permission" {...plan35AdminRestrictedActionCopy.invoiceManage} />
              )}
            </CardContent>
          </Card>
        </div>
        ) : null}
        <PaymentGatewayOperationsPanel
          activeTab={activeTab}
          attempts={paymentAttempts.items}
          attemptPage={paymentAttempts.page}
          attemptPageSize={paymentAttempts.pageSize}
          attemptTotal={paymentAttempts.total}
          canManage={options.canManage}
          gatewaySettings={paymentGatewaySettings}
          query={query}
          selectedPricingRule={selectedPricingRule}
          pricingRules={pricingRules}
          webhookEvents={webhookEvents.items}
          webhookPage={webhookEvents.page}
          webhookPageSize={webhookEvents.pageSize}
          webhookTotal={webhookEvents.total}
        />
      </div>
    </DashboardShell>
  );
}
