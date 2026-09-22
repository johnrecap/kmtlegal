import type { Metadata } from "next";
import Link from "next/link";
import { DashboardShell } from "@/components/layout";
import { AdminNotificationBell } from "@/features/admin/notifications/admin-notification-bell";
import { AdminDialog } from "@/components/admin/admin-dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/animate-ui/components/radix/accordion";
import { AdminPagination, AdminTabs, MobileFiltersSheet, MoreFiltersPopover } from "@/components/admin";
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
import { plan35AdminListAccessibilityCopy, plan35AdminRestrictedActionCopy, sourceTypeDisplayLabel } from "@/lib/ui-copy";
import {
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
import { AdminPermissionBlocked as PermissionBlocked, requireAdminRoutePage } from "@/server/auth/page-guards";
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
          <Link className="font-semibold text-primary hover:underline" href={row.href}>
            {row.title}
          </Link>
          <p className="mt-1 text-xs text-muted-foreground">{typeLabel(row.type)}</p>
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
        <Link className="text-sm font-semibold text-primary hover:underline" href={row.href}>
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
        <Link className="text-primary hover:underline" href={row.href}>
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

type EditorPanelProps = {
  activeTab: ContentTab;
  editArticle: Awaited<ReturnType<typeof getAdminArticleDetail>> | null;
  editCaseStudy: Awaited<ReturnType<typeof getAdminCaseStudyDetail>> | null;
  editSocialDraft: Awaited<ReturnType<typeof getAdminSocialDraftDetail>> | null;
  canArticleCreate: boolean;
  canArticleApprove: boolean;
  canCaseStudyCreate: boolean;
  canCaseStudyApprove: boolean;
  canSocialCreate: boolean;
  canSocialApprove: boolean;
  idPrefix?: string;
};

/**
 * Shared editor forms (Phase 11): ONE form JSX rendered in the desktop
 * side Card and in the mobile Sheet. The `idPrefix` disambiguates control
 * IDs across the two placements (the desktop instance is CSS-hidden on
 * mobile but stays mounted, and the Sheet instance mounts on open).
 */
function EditorPanelForms(props: EditorPanelProps) {
  const {
    activeTab,
    editArticle,
    editCaseStudy,
    editSocialDraft,
    canArticleCreate,
    canArticleApprove,
    canCaseStudyCreate,
    canCaseStudyApprove,
    canSocialCreate,
    canSocialApprove,
    idPrefix
  } = props;
  if (activeTab === "case-studies" || editCaseStudy) {
    return canCaseStudyCreate ? (
      <CaseStudyForm key={editCaseStudy?.id ?? "create"} canApprove={canCaseStudyApprove} idPrefix={idPrefix} study={editCaseStudy ? caseStudyFormValue(editCaseStudy) : undefined} />
    ) : (
      <StateBlock tone="permission" {...plan35AdminRestrictedActionCopy.caseStudyCreate} />
    );
  }
  if (activeTab === "social" || editSocialDraft) {
    return canSocialCreate ? (
      <SocialDraftForm key={editSocialDraft?.id ?? "create"} canApprove={canSocialApprove} draft={editSocialDraft ? socialDraftFormValue(editSocialDraft) : undefined} idPrefix={idPrefix} />
    ) : (
      <StateBlock tone="permission" {...plan35AdminRestrictedActionCopy.socialDraftCreate} />
    );
  }
  return canArticleCreate ? (
    <ArticleForm key={editArticle?.id ?? "create"} article={editArticle ? articleFormValue(editArticle) : undefined} canApprove={canArticleApprove} idPrefix={idPrefix} />
  ) : (
    <StateBlock tone="permission" {...plan35AdminRestrictedActionCopy.articleCreate} />
  );
}

/**
 * Saved-content preview (Phase 11): preview-variant Dialog over the record
 * being edited. Create mode has nothing saved to preview, so no trigger
 * renders there.
 */
function ContentPreview({
  editArticle,
  editCaseStudy,
  editSocialDraft
}: Pick<EditorPanelProps, "editArticle" | "editCaseStudy" | "editSocialDraft">) {
  if (editArticle) {
    return (
      <AdminDialog
        variant="preview"
        trigger={
          <button className={buttonClasses({ variant: "ghost", size: "sm" })} type="button">
            معاينة المقال
          </button>
        }
        title={editArticle.title}
      >
        <p className="text-sm leading-7 text-muted-foreground">{editArticle.excerpt}</p>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-foreground" dir="auto">{editArticle.content}</p>
      </AdminDialog>
    );
  }
  if (editCaseStudy) {
    return (
      <AdminDialog
        variant="preview"
        trigger={
          <button className={buttonClasses({ variant: "ghost", size: "sm" })} type="button">
            معاينة دراسة الحالة
          </button>
        }
        title={editCaseStudy.title}
      >
        <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-foreground" dir="auto">{editCaseStudy.challenge}</p>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-foreground" dir="auto">{editCaseStudy.approach}</p>
      </AdminDialog>
    );
  }
  if (editSocialDraft) {
    return (
      <AdminDialog
        variant="preview"
        trigger={
          <button className={buttonClasses({ variant: "ghost", size: "sm" })} type="button">
            معاينة المسودة
          </button>
        }
        title={editSocialDraft.title}
      >
        <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-foreground" dir="auto">{editSocialDraft.content}</p>
      </AdminDialog>
    );
  }
  return null;
}

export default async function AdminContentPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const guard = await requireAdminRoutePage("/admin/content");
  if (guard.status === "forbidden") {
    return <PermissionBlocked title={guard.title} description={guard.description} />;
  }

  const query = flattenSearchParams((await searchParams) ?? {});
  const result = await getAdminContentHub({ actor: guard.context.principal, query });
  const activeTab = result.tab as ContentTab;
  const rows = rowsFor(result, query);
  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));
  const editType = query.editType;
  const editId = query.editId;
  const editorMode = query.editor === "new" || Boolean(editId);

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
      principal={guard.context.principal}
      notificationBell={<AdminNotificationBell principal={guard.context.principal} />}
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <MetricCard label="المقالات" value={String(result.summary.articles)} meta="كل حالات المحتوى" />
          <MetricCard label="دراسات الحالة" value={String(result.summary.caseStudies)} meta="مجهولة أو قيد الإعداد" />
          <MetricCard label="مسودات السوشيال" value={String(result.summary.socialDrafts)} meta="لا يوجد نشر خارجي تلقائي" />
          <MetricCard label="قيد الاعتماد" value={String(result.summary.pendingApproval)} meta="مراجعة قانونية مطلوبة" />
          <MetricCard label="الإعلام والسوشيال" value={String(result.summary.mediaEntries)} meta="مداخل السوشيال كعداد قراءة فقط" />
        </div>

        <AdminTabs
          active={activeTab}
          ariaLabel="أنواع المحتوى"
          tabs={[
            { value: "articles", label: "المقالات", href: tabHref("articles"), badge: result.summary.articles },
            { value: "case-studies", label: "دراسات الحالة", href: tabHref("case-studies"), badge: result.summary.caseStudies },
            { value: "social", label: "منشورات السوشيال", href: tabHref("social"), badge: result.summary.socialDrafts },
            { value: "pending", label: "قيد الاعتماد", href: tabHref("pending"), badge: result.summary.pendingApproval }
          ]}
        />

        <div className={editorMode ? "grid gap-5" : "grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]"}>
          <div className={editorMode ? "hidden" : "space-y-5"}>
            <div className="flex flex-wrap items-start gap-3">
            <form action="/admin/content" className="min-w-0 flex-1" method="get">
              <input name="tab" type="hidden" value={activeTab} />
              <FilterBar ariaLabel={plan35AdminListAccessibilityCopy.content.filters}>
                <SearchInput ariaLabel={plan35AdminListAccessibilityCopy.content.search} className="min-w-0 flex-1 sm:min-w-80" defaultValue={result.filters.q ?? ""} name="q" placeholder="البحث في المحتوى..." />
                <span className="hidden lg:contents">
                <Select className="min-w-44" defaultValue={result.filters.status ?? ""} label="الحالة" name="status">
                  <option value="">كل الحالات</option>
                  {statusOptions(activeTab).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
                </span>
                <input type="hidden" name="platform" value={result.filters.platform ?? ""} />
                <input type="hidden" name="category" value={result.filters.category ?? ""} />
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
              <form action="/admin/content" className="space-y-3" method="get">
                <input name="tab" type="hidden" value={activeTab} />
                <input type="hidden" name="q" value={result.filters.q ?? ""} />
                <input type="hidden" name="status" value={result.filters.status ?? ""} />
                {activeTab === "social" ? (
                  <Select className="w-full" defaultValue={result.filters.platform ?? ""} label="المنصة" name="platform">
                    <option value="">كل المنصات</option>
                    {socialPlatformValues.map((platform) => (
                      <option key={platform} value={platform}>
                        {labelFrom(socialPlatformLabels, platform)}
                      </option>
                    ))}
                  </Select>
                ) : activeTab !== "pending" ? (
                  <Select className="w-full" defaultValue={result.filters.category ?? ""} label="التصنيف" name="category">
                    <option value="">كل التصنيفات</option>
                    {result.categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </Select>
                ) : null}
                <Select className="w-full" defaultValue={result.filters.sortBy} label="الترتيب" name="sortBy">
                  <option value="updatedAt">آخر تحديث</option>
                  <option value="createdAt">تاريخ الإنشاء</option>
                  <option value="publishedAt">تاريخ النشر</option>
                  <option value="scheduledAt">تاريخ الجدولة</option>
                  <option value="title">العنوان</option>
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
            <MobileFiltersSheet description="ابحث وصفِّ عناصر المحتوى." title="فلاتر المحتوى" triggerLabel="الفلاتر">
              <form action="/admin/content" className="space-y-3" method="get">
                <input name="tab" type="hidden" value={activeTab} />
                <SearchInput ariaLabel={plan35AdminListAccessibilityCopy.content.search} className="w-full" defaultValue={result.filters.q ?? ""} name="q" placeholder="البحث في المحتوى..." />
                <Select className="w-full" defaultValue={result.filters.status ?? ""} label="الحالة" name="status">
                  <option value="">كل الحالات</option>
                  {statusOptions(activeTab).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
                {activeTab === "social" ? (
                  <Select className="w-full" defaultValue={result.filters.platform ?? ""} label="المنصة" name="platform">
                    <option value="">كل المنصات</option>
                    {socialPlatformValues.map((platform) => (
                      <option key={platform} value={platform}>
                        {labelFrom(socialPlatformLabels, platform)}
                      </option>
                    ))}
                  </Select>
                ) : activeTab !== "pending" ? (
                  <Select className="w-full" defaultValue={result.filters.category ?? ""} label="التصنيف" name="category">
                    <option value="">كل التصنيفات</option>
                    {result.categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </Select>
                ) : null}
                <Select className="w-full" defaultValue={result.filters.sortBy} label="الترتيب" name="sortBy">
                  <option value="updatedAt">آخر تحديث</option>
                  <option value="createdAt">تاريخ الإنشاء</option>
                  <option value="publishedAt">تاريخ النشر</option>
                  <option value="scheduledAt">تاريخ الجدولة</option>
                  <option value="title">العنوان</option>
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
              <p>{result.total} عنصر داخل الفلاتر الحالية</p>
              <p>
                صفحة {result.page} من {totalPages}
              </p>
            </div>

            <DataTable
              caption={plan35AdminListAccessibilityCopy.content.table}
              columns={columns(activeTab)}
              rows={rows}
              empty="لا توجد عناصر مطابقة للفلاتر الحالية."
              mobileRender={(row) => <ContentMobileCard row={row} tab={activeTab} />}
            />

            <AdminPagination
              page={result.page}
              pageSize={result.pageSize}
              total={result.total}
              hrefForPage={(page) => listHref(result.filters, page)}
              resetHref={tabHref(activeTab)}
              resetLabel="مسح الفلاتر"
            />
          </div>

          <div className="space-y-5">
            <div className={editorMode ? "block" : "hidden xl:block"}>
              <Card>
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <CardTitle>
                        {editArticle || editCaseStudy || editSocialDraft ? "تعديل المحتوى" : activeTab === "case-studies" ? "دراسة حالة جديدة" : activeTab === "social" ? "مسودة سوشيال جديدة" : "مقال جديد"}
                      </CardTitle>
                      <CardDescription>النشر والاعتماد داخليان فقط. لا يوجد نشر خارجي تلقائي على منصات السوشيال في هذه النسخة.</CardDescription>
                    </div>
                    <ContentPreview editArticle={editArticle} editCaseStudy={editCaseStudy} editSocialDraft={editSocialDraft} />
                  </div>
                </CardHeader>
                <CardContent>
                  {editorMode ? (
                    <div className="space-y-5">
                      <Link className={buttonClasses({ variant: "secondary", size: "sm" })} href={tabHref(activeTab)}>العودة إلى قائمة المحتوى</Link>
                      <EditorPanelForms
                        activeTab={activeTab}
                        editArticle={editArticle}
                        editCaseStudy={editCaseStudy}
                        editSocialDraft={editSocialDraft}
                        canArticleCreate={canArticleCreate}
                        canArticleApprove={canArticleApprove}
                        canCaseStudyCreate={canCaseStudyCreate}
                        canCaseStudyApprove={canCaseStudyApprove}
                        canSocialCreate={canSocialCreate}
                        canSocialApprove={canSocialApprove}
                      />
                    </div>
                  ) : (
                    <StateBlock
                      action={<Link className={buttonClasses()} href={`${tabHref(activeTab)}&editor=new`}>فتح المحرر</Link>}
                      description="يفتح المحرر في مساحة كاملة حتى لا تتزاحم الحقول مع قائمة المحتوى."
                      title="إنشاء محتوى جديد"
                    />
                  )}
                </CardContent>
              </Card>
            </div>
            {!editorMode ? <Link className={buttonClasses({ className: "w-full xl:hidden" })} href={`${tabHref(activeTab)}&editor=new`}>فتح محرر المحتوى</Link> : null}

            {canSocialCreate && editorMode ? (
              <Accordion type="single" collapsible defaultValue="ai-drafts">
                <AccordionItem value="ai-drafts" className="rounded-lg border border-border bg-surface px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <span className="flex flex-1 flex-col gap-1 text-start">
                      <span className="text-base font-semibold text-foreground">لوحة مسودات الذكاء الاصطناعي</span>
                      <span className="text-sm font-normal text-muted-foreground">توليد مسودة توعوية فقط عبر بوابة مزود الذكاء الاصطناعي. تحفظ كل مسودة في حالة مراجعة قانونية وتحتاج مراجعة بشرية.</span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="pb-4">
                      <AiSocialDraftForm />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            ) : null}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
