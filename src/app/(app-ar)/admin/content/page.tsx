import type { Metadata } from "next";
import Link from "next/link";
import { DashboardShell } from "@/components/layout";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, DataRecordCard, DataTable, FilterBar, MetricCard, SearchInput, Select, StateBlock, type DataTableColumn } from "@/components/ui";
import { buttonClasses } from "@/components/ui/button";
import { AiSocialDraftForm, ArticleForm, CaseStudyForm, SocialDraftForm } from "@/features/admin/content/content-forms";
import {
  articleStatusLabels,
  articleStatusValues,
  caseStudyStatusLabels,
  caseStudyStatusValues,
  socialDraftStatusLabels,
  socialDraftStatusValues,
  socialPlatformLabels,
  socialPlatformValues
} from "@/lib/legal-content";
import { formatDateTime, labelFrom } from "@/lib/legal-format";
import { sourceTypeDisplayLabel } from "@/lib/ui-copy";
import {
  canAccessContentHub,
  canApproveArticles,
  canApproveCaseStudies,
  canApproveSocialDrafts,
  canCreateArticles,
  canCreateCaseStudies,
  canCreateSocialDrafts,
  getAdminArticleDetail,
  getAdminCaseStudyDetail,
  getAdminContentHub,
  getAdminSocialDraftDetail
} from "@/server/admin/content-social-service";
import { PermissionBlocked, requireAdminPage } from "@/server/auth/page-guards";
import { adminNavForPath } from "../admin-navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "المحتوى والسوشيال | KMT Legal",
  description: "إدارة المقالات ودراسات الحالة المجهولة ومسودات السوشيال داخل لوحة المكتب."
};

type SearchParams = Record<string, string | string[] | undefined>;
type HubResult = Awaited<ReturnType<typeof getAdminContentHub>>;
type ContentTab = "articles" | "case-studies" | "social" | "pending";

type ContentRow = {
  id: string;
  type: "article" | "caseStudy" | "social";
  title: string;
  status: string;
  meta: string;
  owner: string;
  updatedAt: Date;
  href: string;
};

function flattenSearchParams(searchParams: SearchParams) {
  return Object.fromEntries(
    Object.entries(searchParams).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value ?? ""])
  );
}

function tabHref(tab: ContentTab) {
  return `/admin/content?tab=${tab}`;
}

function listHref(filters: HubResult["filters"], page: number) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) {
      params.set(key, String(value));
    }
  }
  params.set("page", String(page));
  return `/admin/content?${params.toString()}`;
}

function editHref(tab: ContentTab, type: ContentRow["type"], id: string, query: Record<string, string>) {
  const params = new URLSearchParams(query);
  params.set("tab", tab);
  params.set("editType", type);
  params.set("editId", id);
  return `/admin/content?${params.toString()}`;
}

function statusTone(status: string) {
  if (["PUBLISHED", "APPROVED"].includes(status)) {
    return "active" as const;
  }
  if (["REJECTED"].includes(status)) {
    return "danger" as const;
  }
  if (["ARCHIVED"].includes(status)) {
    return "closed" as const;
  }
  return ["REVIEW", "LEGAL_REVIEW", "SCHEDULED"].includes(status) ? ("pending" as const) : ("neutral" as const);
}

function typeLabel(type: ContentRow["type"]) {
  if (type === "article") return "مقال";
  if (type === "caseStudy") return "دراسة حالة";
  return "سوشيال";
}

function statusLabel(type: ContentRow["type"], status: string) {
  if (type === "article") return labelFrom(articleStatusLabels, status);
  if (type === "caseStudy") return labelFrom(caseStudyStatusLabels, status);
  return labelFrom(socialDraftStatusLabels, status);
}

function rowsFor(result: HubResult, query: Record<string, string>): ContentRow[] {
  if (result.tab === "pending") {
    return result.pendingRows.map((row) => ({
      id: row.id,
      type: row.type,
      title: row.title,
      status: row.status,
      meta: row.platform ? labelFrom(socialPlatformLabels, row.platform) : row.category || "قيد الاعتماد",
      owner: "في انتظار مراجعة",
      updatedAt: row.updatedAt,
      href: row.href
    }));
  }

  if (result.tab === "case-studies") {
    return result.caseStudies.map((study) => ({
      id: study.id,
      type: "caseStudy",
      title: study.title,
      status: study.status,
      meta: `${study.locale === "ar" ? "العربية" : "English"} · ${study.category} · ${study.isAnonymized ? "مجهولة" : "تحتاج إخفاء هوية"}`,
      owner: study.approvedBy?.name ?? "بدون اعتماد",
      updatedAt: study.updatedAt,
      href: editHref("case-studies", "caseStudy", study.id, query)
    }));
  }

  if (result.tab === "social") {
    return result.socialDrafts.map((draft) => ({
      id: draft.id,
      type: "social",
      title: draft.title,
      status: draft.status,
      meta: `${labelFrom(socialPlatformLabels, draft.platform)} · ${sourceTypeDisplayLabel(draft.sourceType)}`,
      owner: draft.approvedBy?.name ?? draft.createdBy.name,
      updatedAt: draft.updatedAt,
      href: editHref("social", "social", draft.id, query)
    }));
  }

  return result.articles.map((article) => ({
    id: article.id,
    type: "article",
    title: article.title,
    status: article.status,
    meta: `${article.locale === "ar" ? "العربية" : "English"} · ${article.category}`,
    owner: article.author.name,
    updatedAt: article.updatedAt,
    href: editHref("articles", "article", article.id, query)
  }));
}

function statusOptions(tab: ContentTab) {
  if (tab === "case-studies") return caseStudyStatusValues.map((status) => [status, labelFrom(caseStudyStatusLabels, status)] as const);
  if (tab === "social") return socialDraftStatusValues.map((status) => [status, labelFrom(socialDraftStatusLabels, status)] as const);
  if (tab === "pending") {
    return [
      ["REVIEW", labelFrom(articleStatusLabels, "REVIEW")],
      ["LEGAL_REVIEW", labelFrom(caseStudyStatusLabels, "LEGAL_REVIEW")]
    ] as const;
  }
  return articleStatusValues.map((status) => [status, labelFrom(articleStatusLabels, status)] as const);
}

function columns(tab: ContentTab): Array<DataTableColumn<ContentRow>> {
  return [
    {
      key: "title",
      header: "العنصر",
      render: (row) => (
        <div>
          <Link className="font-semibold text-kmt-navy hover:underline" href={row.href}>
            {row.title}
          </Link>
          <p className="mt-1 text-xs text-kmt-muted">{typeLabel(row.type)}</p>
        </div>
      )
    },
    {
      key: "status",
      header: "الحالة",
      render: (row) => <Badge tone={statusTone(row.status)}>{statusLabel(row.type, row.status)}</Badge>
    },
    {
      key: "meta",
      header: tab === "social" ? "المنصة / المصدر" : "التصنيف",
      render: (row) => row.meta
    },
    {
      key: "owner",
      header: "المسؤول",
      render: (row) => row.owner
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
        <Link className="text-sm font-semibold text-kmt-navy hover:underline" href={row.href}>
          فتح
        </Link>
      )
    }
  ];
}

function ContentMobileCard({ row, tab }: { row: ContentRow; tab: ContentTab }) {
  return (
    <DataRecordCard
      title={
        <Link className="text-kmt-navy hover:underline" href={row.href}>
          {row.title}
        </Link>
      }
      description={typeLabel(row.type)}
      badges={<Badge tone={statusTone(row.status)}>{statusLabel(row.type, row.status)}</Badge>}
      fields={[
        { label: tab === "social" ? "المنصة / المصدر" : "التصنيف", value: row.meta },
        { label: "المسؤول", value: row.owner },
        { label: "آخر تحديث", value: formatDateTime(row.updatedAt), className: "sm:col-span-2" }
      ]}
      action={
        <Link className={buttonClasses({ variant: "secondary", size: "sm", className: "min-h-11 w-full" })} href={row.href}>
          فتح
        </Link>
      }
    />
  );
}

function articleFormValue(article: Awaited<ReturnType<typeof getAdminArticleDetail>>) {
  return {
    id: article.id,
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt,
    content: article.content,
    category: article.category,
    status: article.status,
    publishedAt: article.publishedAt
  };
}

function caseStudyFormValue(study: Awaited<ReturnType<typeof getAdminCaseStudyDetail>>) {
  return {
    id: study.id,
    title: study.title,
    slug: study.slug,
    category: study.category,
    challenge: study.challenge,
    approach: study.approach,
    generalOutcome: study.generalOutcome,
    lessons: study.lessons,
    status: study.status,
    isAnonymized: study.isAnonymized,
    publishedAt: study.publishedAt
  };
}

function socialDraftFormValue(draft: Awaited<ReturnType<typeof getAdminSocialDraftDetail>>) {
  return {
    id: draft.id,
    title: draft.title,
    platform: draft.platform,
    content: draft.content,
    sourceType: draft.sourceType,
    sourceId: draft.sourceId,
    status: draft.status,
    scheduledAt: draft.scheduledAt
  };
}

export default async function AdminContentPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const guard = await requireAdminPage("/admin/content");
  if (guard.status === "forbidden") {
    return <PermissionBlocked title={guard.title} description={guard.description} />;
  }

  if (!canAccessContentHub(guard.context.principal)) {
    return <PermissionBlocked title="غير مسموح بإدارة المحتوى" description="هذا المسار يحتاج صلاحيات content أو caseStudy أو socialDraft." />;
  }

  const query = flattenSearchParams((await searchParams) ?? {});
  const result = await getAdminContentHub({ actor: guard.context.principal, query });
  const activeTab = result.tab as ContentTab;
  const rows = rowsFor(result, query);
  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));
  const editType = query.editType;
  const editId = query.editId;

  const canArticleCreate = canCreateArticles(guard.context.principal);
  const canArticleApprove = canApproveArticles(guard.context.principal);
  const canCaseStudyCreate = canCreateCaseStudies(guard.context.principal);
  const canCaseStudyApprove = canApproveCaseStudies(guard.context.principal);
  const canSocialCreate = canCreateSocialDrafts(guard.context.principal);
  const canSocialApprove = canApproveSocialDrafts(guard.context.principal);

  const [editArticle, editCaseStudy, editSocialDraft] = await Promise.all([
    editType === "article" && editId ? getAdminArticleDetail({ actor: guard.context.principal, articleId: editId }).catch(() => null) : null,
    editType === "caseStudy" && editId ? getAdminCaseStudyDetail({ actor: guard.context.principal, caseStudyId: editId }).catch(() => null) : null,
    editType === "social" && editId ? getAdminSocialDraftDetail({ actor: guard.context.principal, draftId: editId }).catch(() => null) : null
  ]);

  return (
    <DashboardShell
      eyebrow="لوحة المكتب"
      mode="admin"
      navItems={adminNavForPath("/admin/content")}
      title="المحتوى والسوشيال"
      userLabel={guard.context.user.name}
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <MetricCard label="المقالات" value={String(result.summary.articles)} meta="كل حالات المحتوى" />
          <MetricCard label="دراسات الحالة" value={String(result.summary.caseStudies)} meta="مجهولة أو قيد الإعداد" />
          <MetricCard label="مسودات السوشيال" value={String(result.summary.socialDrafts)} meta="لا يوجد نشر خارجي تلقائي" />
          <MetricCard label="قيد الاعتماد" value={String(result.summary.pendingApproval)} meta="مراجعة قانونية مطلوبة" />
          <MetricCard label="الإعلام والسوشيال" value={String(result.summary.mediaEntries)} meta="مداخل السوشيال كعداد قراءة فقط" />
        </div>

        <div className="flex flex-wrap gap-2 border-b border-kmt-border">
          {[
            ["articles", "المقالات"],
            ["case-studies", "دراسات الحالة"],
            ["social", "منشورات السوشيال"],
            ["pending", "قيد الاعتماد"]
          ].map(([tab, label]) => (
            <Link
              key={tab}
              className={`mb-[-1px] inline-flex min-h-11 items-center border-b-2 px-3 text-sm font-semibold ${
                activeTab === tab ? "border-kmt-gold text-kmt-ink" : "border-transparent text-kmt-muted hover:text-kmt-ink"
              }`}
              href={tabHref(tab as ContentTab)}
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_26rem]">
          <div className="space-y-5">
            <form action="/admin/content" method="get">
              <input name="tab" type="hidden" value={activeTab} />
              <FilterBar>
                <SearchInput className="min-w-0 flex-1 sm:min-w-80" defaultValue={result.filters.q ?? ""} name="q" placeholder="البحث في المحتوى..." />
                <Select className="min-w-44" defaultValue={result.filters.status ?? ""} label="الحالة" name="status">
                  <option value="">كل الحالات</option>
                  {statusOptions(activeTab).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
                {activeTab === "social" ? (
                  <Select className="min-w-40" defaultValue={result.filters.platform ?? ""} label="المنصة" name="platform">
                    <option value="">كل المنصات</option>
                    {socialPlatformValues.map((platform) => (
                      <option key={platform} value={platform}>
                        {labelFrom(socialPlatformLabels, platform)}
                      </option>
                    ))}
                  </Select>
                ) : activeTab !== "pending" ? (
                  <Select className="min-w-40" defaultValue={result.filters.category ?? ""} label="التصنيف" name="category">
                    <option value="">كل التصنيفات</option>
                    {result.categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </Select>
                ) : null}
                <Select className="min-w-40" defaultValue={result.filters.sortBy} label="الترتيب" name="sortBy">
                  <option value="updatedAt">آخر تحديث</option>
                  <option value="createdAt">تاريخ الإنشاء</option>
                  <option value="publishedAt">تاريخ النشر</option>
                  <option value="scheduledAt">تاريخ الجدولة</option>
                  <option value="title">العنوان</option>
                </Select>
                <Select className="min-w-32" defaultValue={result.filters.sortDirection} label="الاتجاه" name="sortDirection">
                  <option value="desc">تنازلي</option>
                  <option value="asc">تصاعدي</option>
                </Select>
                <Button type="submit" variant="secondary">
                  تطبيق
                </Button>
              </FilterBar>
            </form>

            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-kmt-muted">
              <p>{result.total} عنصر داخل الفلاتر الحالية</p>
              <p>
                صفحة {result.page} من {totalPages}
              </p>
            </div>

            <DataTable
              columns={columns(activeTab)}
              rows={rows}
              empty="لا توجد عناصر مطابقة للفلاتر الحالية."
              mobileRender={(row) => <ContentMobileCard row={row} tab={activeTab} />}
            />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <Link className="text-sm font-semibold text-kmt-navy hover:underline" href={tabHref(activeTab)}>
                مسح الفلاتر
              </Link>
              <div className="flex flex-wrap items-center gap-3">
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
          </div>

          <div className="space-y-5">
            <Card>
              <CardHeader>
                <CardTitle>
                  {editArticle || editCaseStudy || editSocialDraft ? "تعديل المحتوى" : activeTab === "case-studies" ? "دراسة حالة جديدة" : activeTab === "social" ? "مسودة سوشيال جديدة" : "مقال جديد"}
                </CardTitle>
                <CardDescription>النشر والاعتماد داخليان فقط. لا يوجد نشر خارجي تلقائي على منصات السوشيال في هذه النسخة.</CardDescription>
              </CardHeader>
              <CardContent>
                {activeTab === "case-studies" || editCaseStudy ? (
                  canCaseStudyCreate ? (
                    <CaseStudyForm canApprove={canCaseStudyApprove} study={editCaseStudy ? caseStudyFormValue(editCaseStudy) : undefined} />
                  ) : (
                    <StateBlock tone="permission" title="إنشاء دراسات الحالة غير متاح" description="هذا الحساب يحتاج صلاحية caseStudy.create.any." />
                  )
                ) : activeTab === "social" || editSocialDraft ? (
                  canSocialCreate ? (
                    <SocialDraftForm canApprove={canSocialApprove} draft={editSocialDraft ? socialDraftFormValue(editSocialDraft) : undefined} />
                  ) : (
                    <StateBlock tone="permission" title="إنشاء مسودات السوشيال غير متاح" description="هذا الحساب يحتاج صلاحية socialDraft.create.any." />
                  )
                ) : canArticleCreate ? (
                  <ArticleForm article={editArticle ? articleFormValue(editArticle) : undefined} canApprove={canArticleApprove} />
                ) : (
                  <StateBlock tone="permission" title="إنشاء المقالات غير متاح" description="هذا الحساب يحتاج صلاحية content.create.any." />
                )}
              </CardContent>
            </Card>

            {canSocialCreate ? (
              <Card>
                <CardHeader>
                  <CardTitle>لوحة مسودات الذكاء الاصطناعي</CardTitle>
                  <CardDescription>توليد مسودة توعوية فقط عبر بوابة مزود الذكاء الاصطناعي. تحفظ كل مسودة في حالة مراجعة قانونية وتحتاج مراجعة بشرية.</CardDescription>
                </CardHeader>
                <CardContent>
                  <AiSocialDraftForm />
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
