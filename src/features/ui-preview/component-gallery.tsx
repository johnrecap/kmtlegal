/**
 * KMT Design System Lab (Phase 12, preview-only, env-gated). Client
 * component: the LabShell toolbar owns theme/locale state and takes section
 * content as a render prop, which requires a client-to-client boundary
 * (server components cannot pass functions to client components).
 */
"use client";

import { ThemeToggle } from "@/components/theme";
import {
  Badge,
  Button,
  ButtonLink,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DataRecordCard,
  DataTable,
  type DataTableColumn,
  FilterBar,
  InlineFeedback,
  MaterialSymbol,
  Pagination,
  SearchInput,
  Select,
  Skeleton,
  SkeletonCard,
  SkeletonTable,
  StateBlock,
  Tabs,
  TextInput,
  Textarea,
  Toast,
  LinkTabs
} from "@/components/ui";
import { AnimateUiDemo, CountUpDemo, DialogDemo, ShimmerDemo } from "./gallery-islands";
import { LabShell, Provenance, type LabLocale } from "./lab-shell";
import {
  AdminAccordionDemo,
  AdminDialogDemo,
  AdminPaginationDemo,
  AdminTabsDemo,
  BrandDemo,
  DockDemo,
  FileUploadDemo,
  MenuDemo,
  PopoverDemo,
  SheetDemo,
  SidebarDemo,
  StatefulButtonDemo,
  TooltipDemo
} from "./lab-demos";

type DemoRow = { id: string; matter: string; status: string; owner: string };

const demoRows: DemoRow[] = [
  { id: "1", matter: "KMT-2026-0148", status: "Active", owner: "M. Khaled" },
  { id: "2", matter: "KMT-2026-0151", status: "Pending", owner: "K. Adel" },
  { id: "3", matter: "KMT-2026-0155", status: "Closed", owner: "N. Samy" }
];

const demoColumns: Array<DataTableColumn<DemoRow>> = [
  { key: "matter", header: "File number", render: (row) => <span dir="ltr">{row.matter}</span> },
  { key: "status", header: "Status", render: (row) => row.status },
  { key: "owner", header: "Lawyer", render: (row) => row.owner }
];

const buttonVariants = ["primary", "secondary", "outline", "ghost", "danger"] as const;
const badgeTones = ["neutral", "active", "pending", "closed", "danger", "info"] as const;
const iconSample = ["gavel", "balance", "cases", "contract", "shield", "event_available", "payments", "smart_toy", "translate", "light_mode", "dark_mode", "info"] as const;

export function ComponentGallery() {
  return (
    <LabShell>
      {(locale) => (
        <div className="min-h-screen bg-background text-foreground">
          <main className="mx-auto max-w-6xl space-y-10 px-4 py-10 sm:px-6">
            <GallerySection
              description={
                locale === "ar"
                  ? "شعار الإنتاج الحالي بجميع نسخه على الأسطح الفاتحة والداكنة."
                  : "Current production brand lockup on light and dark surfaces."
              }
              provenance={{ label: "Local KMT" }}
              title={locale === "ar" ? "العلامة / الشعار" : "Brand / Logo"}
            >
              <BrandDemo locale={locale} />
            </GallerySection>

            <GallerySection
              description="All variants render on semantic tokens and flip correctly between light and dark themes."
              provenance={{ label: "Local KMT" }}
              title="Buttons"
            >
              <div className="flex flex-wrap items-center gap-3">
                {buttonVariants.map((variant) => (
                  <Button key={variant} variant={variant}>
                    {variant}
                  </Button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
                <Button disabled>Disabled</Button>
                <Button loading>Loading</Button>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <ButtonLink href="/preview/components" variant="primary">
                  Internal link
                </ButtonLink>
                <ButtonLink external href="https://example.com" variant="secondary">
                  External link
                </ButtonLink>
                <Button leadingIcon={<MaterialSymbol name="event_available" />} trailingIcon={<MaterialSymbol className="rtl:rotate-180" name="arrow_forward" />}>
                  With icons
                </Button>
              </div>
            </GallerySection>

            <GallerySection
              description={
                locale === "ar"
                  ? "الزرار الحالتي الإنتاجي: تحميل ثم نجاح حول الـ onClick الحقيقي. تجريبي فقط."
                  : "Production Stateful Button: loading then success around a real onClick. Demo only."
              }
              provenance={{ label: "Aceternity UI" }}
              title={locale === "ar" ? "زرار حالتي" : "Stateful Button"}
            >
              <StatefulButtonDemo locale={locale} />
            </GallerySection>

            <GallerySection description="Six semantic tones plus a compact size. Gold tints survive on both surfaces." provenance={{ label: "Local KMT" }} title="Badges">
              <div className="flex flex-wrap items-center gap-3">
                {badgeTones.map((tone) => (
                  <Badge key={tone} tone={tone}>
                    {tone}
                  </Badge>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {badgeTones.map((tone) => (
                  <Badge key={tone} size="sm" tone={tone}>
                    {tone} sm
                  </Badge>
                ))}
              </div>
            </GallerySection>

            <GallerySection description="One input skin across the family. Labels, hints, and errors stay wired with aria-describedby." provenance={{ label: "Local KMT" }} title="Fields">
              <div className="grid gap-5 md:grid-cols-2">
                <TextInput hint="Shown under the control, linked via aria-describedby." id="gallery-name" label="Full name" name="name" placeholder="e.g. Maryam Khaled" />
                <TextInput error="This field is required." id="gallery-email" label="Email address" name="email" placeholder="name@example.com" type="email" />
                <Select id="gallery-role" label="Role" name="role">
                  <option value="admin">Admin</option>
                  <option value="lawyer">Lawyer</option>
                  <option value="secretary">Secretary</option>
                </Select>
                <TextInput dir="ltr" id="gallery-date" label="Session date (native picker, LTR)" name="date" type="date" />
                <Textarea id="gallery-notes" label="Notes" name="notes" placeholder="Case summary…" />
                <div className="space-y-2">
                  <span className="block text-sm font-semibold text-foreground">Search</span>
                  <SearchInput ariaLabel="Search matters" placeholder="Search matters…" />
                </div>
              </div>
            </GallerySection>

            <GallerySection description="Info tone now shows a real info glyph. Error uses role=alert; the rest use role=status." provenance={{ label: "Local KMT" }} title="Feedback">
              <div className="grid gap-4 md:grid-cols-2">
                <InlineFeedback title="Info" description="Routine informational message." tone="info" />
                <InlineFeedback title="Success" description="The record was saved." tone="success" />
                <InlineFeedback title="Warning" description="Review before continuing." tone="warning" />
                <InlineFeedback title="Error" description="The request failed. Try again." tone="error" />
                <Toast title="Toast — info" description="Polite live region." tone="info" />
                <Toast title="Toast — error" description="Assertive live region." tone="error" />
              </div>
            </GallerySection>

            <GallerySection description="StateBlock covers empty, loading, and permission surfaces on state tokens." provenance={{ label: "Local KMT" }} title="States">
              <div className="grid gap-4 md:grid-cols-2">
                <StateBlock description="No records match the current filters." title="Nothing here yet" />
                <StateBlock description="Data is on its way." title="Loading" tone="loading" />
                <StateBlock action={<Button size="sm" variant="secondary">Request access</Button>} description="You do not have permission to view this section." title="Permission required" tone="permission" />
                <StateBlock description="Something went wrong while loading." title="Error" tone="error" />
              </div>
            </GallerySection>

            <GallerySection description="Button tabs keep the pressed-group pattern; LinkTabs drive URL state with aria-current." provenance={{ label: "Local KMT" }} title="Tabs">
              <Tabs activeValue="overview" ariaLabel="Gallery tabs" items={[{ value: "overview", label: "Overview" }, { value: "sessions", label: "Sessions" }, { value: "documents", label: "Documents" }]} />
              <LinkTabs ariaLabel="Gallery link tabs" items={[{ href: "#overview", label: "Overview", count: 12, active: true }, { href: "#sessions", label: "Sessions", count: 3 }, { href: "#documents", label: "Documents", count: 48 }]} />
            </GallerySection>

            <GallerySection
              description={
                locale === "ar"
                  ? "تبويبات الأدمن الإنتاجية: تفعيل يدوي وروابط hash وشارات."
                  : "Production admin Tabs: manual activation, hash hrefs, badges."
              }
              provenance={{ label: "Local KMT", note: "Built over Animate UI Tabs." }}
              title={locale === "ar" ? "تبويبات الأدمن" : "Admin Tabs"}
            >
              <AdminTabsDemo locale={locale} />
            </GallerySection>

            <GallerySection
              description={
                locale === "ar"
                  ? "نفس الأكورديون المستخدم في مجموعات الإجراءات الإنتاجية."
                  : "Same Accordion chrome as production action groups."
              }
              provenance={{ label: "Animate UI" }}
              title={locale === "ar" ? "أكورديون" : "Accordion"}
            >
              <AdminAccordionDemo locale={locale} />
            </GallerySection>

            <GallerySection description="One shared pagination pattern: summary, clear-filters slot, prev/next with localized labels." provenance={{ label: "Local KMT", note: "AdminPagination over shadcn Pagination." }} title="Pagination">
              <div className="space-y-4">
                <Pagination hrefForPage={(page) => `?page=${page}`} page={2} pageSize={10} resetHref="?" summary="Showing 11–20 of 37 matters" total={37} />
              </div>
            </GallerySection>

            <GallerySection
              description={
                locale === "ar"
                  ? "ترقيم الأدمن الإنتاجي مع الملخص ومسح الفلاتر."
                  : "Production admin pagination with summary and clear-filters."
              }
              provenance={{ label: "Local KMT", note: "Over shadcn Pagination." }}
              title={locale === "ar" ? "ترقيم الأدمن" : "Admin Pagination"}
            >
              <AdminPaginationDemo locale={locale} />
            </GallerySection>

            <GallerySection description="Native dialog primitive with focus trap, Escape, backdrop click, and focus return." provenance={{ label: "Local KMT" }} title="Dialog">
              <DialogDemo />
            </GallerySection>

            <GallerySection
              description={
                locale === "ar"
                  ? "ديالوج التأكيد التدميري الإنتاجي مع مسار الإلغاء."
                  : "Production destructive confirm dialog with cancel path."
              }
              provenance={{ label: "Local KMT", note: "Built over Animate UI Dialog." }}
              title={locale === "ar" ? "ديالوج التأكيد" : "Confirm Dialog"}
            >
              <AdminDialogDemo locale={locale} />
            </GallerySection>

            <GallerySection
              description={
                locale === "ar"
                  ? "غلاف فورم الموبايل الإنتاجي."
                  : "Production mobile form shell."
              }
              provenance={{ label: "Animate UI" }}
              title={locale === "ar" ? "اللوحة (Sheet)" : "Sheet"}
            >
              <SheetDemo locale={locale} />
            </GallerySection>

            <GallerySection
              description={
                locale === "ar"
                  ? "قائمة إجراءات الصفوف الإنتاجية: تنقل لوحة المفاتيح وفواصل وعنصر تدميري."
                  : "Production row-action menu: keyboard nav, separators, destructive item."
              }
              provenance={{ label: "Animate UI", note: "Owner-approved dependency-namespace adaptation." }}
              title={locale === "ar" ? "القائمة" : "Menu"}
            >
              <MenuDemo locale={locale} />
            </GallerySection>

            <GallerySection
              description={
                locale === "ar"
                  ? "نفس نافذة الجرس الإنتاجية."
                  : "Same panel chrome as the production bell."
              }
              provenance={{ label: "Animate UI", note: "Owner-approved dependency-namespace adaptation." }}
              title={locale === "ar" ? "النافذة المنبثقة" : "Popover"}
            >
              <PopoverDemo locale={locale} />
            </GallerySection>

            <GallerySection
              description={
                locale === "ar"
                  ? "تلميحات الإنتاج فوق الأزرار والأيقونات."
                  : "Production tooltips over buttons and icons."
              }
              provenance={{ label: "Animate UI" }}
              title={locale === "ar" ? "التلميح" : "Tooltip"}
            >
              <TooltipDemo locale={locale} />
            </GallerySection>

            <GallerySection
              description={
                locale === "ar"
                  ? "رفع المستندات الإنتاجي: سحب وإفلات مع تصفية الامتدادات. تجريبي فقط."
                  : "Production document intake: drag-and-drop with accept filtering. Demo only."
              }
              provenance={{ label: "Aceternity UI", note: "Owner-approved adaptation (native DnD, no new packages)." }}
              title={locale === "ar" ? "رفع الملفات" : "File Upload"}
            >
              <FileUploadDemo locale={locale} />
            </GallerySection>

            <GallerySection description="Token-based shimmer skeletons; reduced-motion renders static blocks." provenance={{ label: "Local KMT" }} title="Skeletons">
              <div className="grid gap-4 md:grid-cols-3">
                <Skeleton lines={4} />
                <SkeletonCard />
                <SkeletonTable rows={3} />
              </div>
            </GallerySection>

            <GallerySection description="DataTable on semantic tokens with optional sticky header; DataRecordCard for mobile lists." provenance={{ label: "Local KMT" }} title="Data">
              <DataTable columns={demoColumns} rows={demoRows} caption="Demo matters" stickyHeader />
              <DataRecordCard
                action={<Button size="sm" variant="secondary">Open</Button>}
                badges={<Badge tone="active">Active</Badge>}
                description="Commercial contract dispute — retail sector."
                fields={[
                  { label: "File number", value: "KMT-2026-0148", dir: "ltr" },
                  { label: "Lawyer", value: "M. Khaled" },
                  { label: "Next session", value: "Sun, 21 Sep 2026", dir: "ltr" },
                  { label: "Court", value: "Cairo Economic Court" }
                ]}
                title="KMT-2026-0148"
              />
            </GallerySection>

            <GallerySection description="Card family and metric tiles on surface tokens." provenance={{ label: "Local KMT" }} title="Cards">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Card title</CardTitle>
                    <CardDescription>Supporting description inside the card header.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-6 text-muted-foreground">Card body content on the shared surface token.</p>
                  </CardContent>
                </Card>
                <div className="grid gap-4 sm:grid-cols-2">
                  <CountUpDemo />
                </div>
              </div>
            </GallerySection>

            <GallerySection
              description={
                locale === "ar"
                  ? "تنقل الأدمن الإنتاجي للشاشات الكبيرة مع شعار العلامة."
                  : "Production admin desktop navigation with brand lockup."
              }
              provenance={{ label: "Aceternity UI", note: "Local kit over the Aceternity Sidebar primitive." }}
              title={locale === "ar" ? "الشريط الجانبي" : "Sidebar"}
            >
              <SidebarDemo locale={locale} />
            </GallerySection>

            <GallerySection description="FilterBar wraps filters in a responsive grid; the shared icon set renders inline SVG only." provenance={{ label: "Local KMT" }} title="Filter bar + icons">
              <FilterBar ariaLabel="Demo filters">
                <SearchInput ariaLabel="Search" placeholder="Search…" />
                <Select label="Status" name="status">
                  <option value="all">All</option>
                  <option value="active">Active</option>
                </Select>
              </FilterBar>
              <div className="flex flex-wrap gap-4 text-foreground">
                {iconSample.map((name) => (
                  <span className="flex flex-col items-center gap-1 text-muted-foreground" key={name}>
                    <MaterialSymbol className="text-2xl text-primary" name={name} />
                    <span className="text-[11px]">{name}</span>
                  </span>
                ))}
              </div>
            </GallerySection>

            <GallerySection description="Public floating dock and theme toggle, exactly as shipped on public routes." provenance={{ label: "Aceternity UI", note: "Dock vendored + adapted; toggle is Local KMT." }} title={locale === "ar" ? "المكونات العامة" : "Public components"}>
              <div className="flex flex-wrap items-center gap-4">
                <ThemeToggle label={locale === "ar" ? "تبديل السمة" : "Toggle theme"} />
                <span className="text-sm text-muted-foreground">
                  {locale === "ar" ? "الـ dock العائم ثابت أسفل الشاشة — بدّل اللغة لرؤية المحتوى." : "The floating dock is fixed at the viewport bottom — switch locale to see its content."}
                </span>
              </div>
              <DockDemo locale={locale} />
            </GallerySection>

            <GallerySection description="Vendored animate-ui primitives (MIT, animate-ui.com): ripple tap feedback, 3D tilt hover, splitting-text entrance. All reduced-motion safe." provenance={{ label: "Animate UI" }} title="Animate UI">
              <AnimateUiDemo />
            </GallerySection>

            <GallerySection description="Motion primitives: count-up numbers animate on scroll; hover states use lift and color only (no glow)." provenance={{ label: "Local KMT", note: "ShimmerButton is the live motion-ui primitive." }} title="Motion">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex flex-col justify-center gap-3 rounded-lg border border-border bg-surface p-5">
                  <ShimmerDemo />
                </div>
                <CountUpDemo />
              </div>
            </GallerySection>
          </main>

          <footer className="border-t border-border px-4 py-6 text-center text-sm text-muted-foreground">
            {locale === "ar" ? "مختبر نظام تصميم KMT · داخلي، محمي بمتغير KMT_ENABLE_UI_PREVIEW في الإنتاج" : "KMT Design System Lab · internal, protected by KMT_ENABLE_UI_PREVIEW in production"}
          </footer>
        </div>
      )}
    </LabShell>
  );
}

function GallerySection({
  title,
  description,
  provenance,
  children
}: {
  title: string;
  description: string;
  provenance: { label: string; note?: string };
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={`gallery-${title.toLowerCase().replace(/[^a-z\u0600-\u06FF]+/g, "-")}`} className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground" id={`gallery-${title.toLowerCase().replace(/[^a-z\u0600-\u06FF]+/g, "-")}`}>
          {title}
        </h2>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>
        <div className="mt-2">
          <Provenance label={provenance.label} note={provenance.note} />
        </div>
      </div>
      {children}
    </section>
  );
}
