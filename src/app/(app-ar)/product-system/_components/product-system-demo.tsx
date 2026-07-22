import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  DataRecordCard,
  DataTable,
  DialogFrame,
  FilterBar,
  MaterialSymbol,
  MetricCard,
  SearchInput,
  Select,
  StateBlock,
  Tabs,
  TextInput,
  Textarea,
  Toast
} from "@/components/ui";
import { DashboardShell, ProductThemeProvider } from "@/components/layout";
import { AIOrganizerPanel, DocumentCard, ServiceCard, TaskCard } from "@/components/domain";
import { plan35AdminListAccessibilityCopy } from "@/lib/ui-copy";

export type ProductSystemScreen = "dashboard" | "clients" | "cases" | "documents" | "settings";

const screenMeta: Record<ProductSystemScreen, { eyebrow: string; title: string }> = {
  dashboard: { eyebrow: "نظام الواجهة", title: "نظام واجهة KMT\u00A0Legal" },
  clients: { eyebrow: "CRM العملاء", title: "إدارة العملاء" },
  cases: { eyebrow: "تشغيل القضايا", title: "إدارة القضايا والجلسات" },
  documents: { eyebrow: "المستندات", title: "إدارة المستندات" },
  settings: { eyebrow: "الحوكمة", title: "الإعدادات والحوكمة" }
};

const navConfig = [
  { screen: "dashboard", label: "لوحة التحكم", href: "/product-system", icon: "dashboard" },
  { screen: "clients", label: "العملاء", href: "/product-system/clients", icon: "groups" },
  { screen: "cases", label: "القضايا", href: "/product-system/cases", icon: "folder_open" },
  { screen: "documents", label: "المستندات", href: "/product-system/documents", icon: "description" },
  { screen: "settings", label: "الإعدادات", href: "/product-system/settings", icon: "settings" }
] satisfies Array<{ screen: ProductSystemScreen; label: string; href: string; icon: string }>;

const caseRows = [
  {
    id: "case-001",
    number: "KMT-2024-089",
    client: "شركة النهضة التجارية",
    service: "صياغة العقود",
    lawyer: "أ. مريم خالد",
    nextStep: "مراجعة مسودة العقد",
    status: "active"
  },
  {
    id: "case-002",
    number: "KMT-2024-104",
    client: "مؤسسة المدار",
    service: "استشارة عقارية",
    lawyer: "أ. عمر فؤاد",
    nextStep: "انتظار مستندات الملكية",
    status: "pending"
  },
  {
    id: "case-003",
    number: "KMT-2024-117",
    client: "مجموعة الصفوة",
    service: "تحصيل تجاري",
    lawyer: "أ. نادين سامي",
    nextStep: "إغلاق ملف المتابعة",
    status: "closed"
  }
];

const clientRows = [
  {
    id: "client-001",
    name: "شركة النهضة التجارية",
    contact: "أحمد منصور",
    segment: "شركة",
    openCases: "4",
    lastActivity: "اليوم 11:20 ص",
    status: "active"
  },
  {
    id: "client-002",
    name: "مؤسسة المدار",
    contact: "ليلى حسن",
    segment: "عقارات",
    openCases: "2",
    lastActivity: "أمس 04:10 م",
    status: "pending"
  },
  {
    id: "client-003",
    name: "مجموعة الصفوة",
    contact: "خالد عادل",
    segment: "تحصيل",
    openCases: "0",
    lastActivity: "15 يونيو",
    status: "closed"
  }
];

const documentRows = [
  {
    id: "doc-001",
    title: "عقد توريد نهائي",
    owner: "شركة النهضة التجارية",
    type: "PDF",
    size: "2.4MB",
    uploadedAt: "اليوم 09:45 ص",
    status: "review"
  },
  {
    id: "doc-002",
    title: "مستندات ملكية عقارية",
    owner: "مؤسسة المدار",
    type: "JPG",
    size: "4.8MB",
    uploadedAt: "أمس 02:30 م",
    status: "pending"
  },
  {
    id: "doc-003",
    title: "إيصال سداد يدوي",
    owner: "مجموعة الصفوة",
    type: "PNG",
    size: "1.1MB",
    uploadedAt: "12 يونيو",
    status: "approved"
  }
];

const auditRows = [
  { id: "audit-001", action: "تغيير صلاحية", actor: "سارة - مدير المكتب", target: "مستخدم التسويق", time: "اليوم 12:05 م" },
  { id: "audit-002", action: "تأكيد تأجيل 2FA", actor: "مدير النظام", target: "تسجيل دخول الموظفين", time: "أمس 05:42 م" },
  { id: "audit-003", action: "مراجعة تعطيل SMTP", actor: "مدير النظام", target: "إشعارات البريد مؤجلة", time: "18 يونيو" }
];

function statusBadge(status: string) {
  if (status === "active" || status === "approved") {
    return <Badge tone="active">{status === "approved" ? "معتمد" : "نشط"}</Badge>;
  }

  if (status === "closed") {
    return <Badge tone="closed">مغلق</Badge>;
  }

  if (status === "review") {
    return <Badge tone="pending">قيد المراجعة</Badge>;
  }

  return <Badge tone="pending">معلق</Badge>;
}

export function ProductSystemDemo({ activeScreen }: { activeScreen: ProductSystemScreen }) {
  const meta = screenMeta[activeScreen];
  const navItems = navConfig.map((item) => ({
    label: item.label,
    href: item.href,
    icon: item.icon,
    active: item.screen === activeScreen
  }));

  return (
    <ProductThemeProvider>
      <DashboardShell eyebrow={meta.eyebrow} mode="admin" navItems={navItems} title={meta.title} userLabel="سارة - مدير المكتب">
        {activeScreen === "dashboard" ? <DashboardScreen /> : null}
        {activeScreen === "clients" ? <ClientsScreen /> : null}
        {activeScreen === "cases" ? <CasesScreen /> : null}
        {activeScreen === "documents" ? <DocumentsScreen /> : null}
        {activeScreen === "settings" ? <SettingsScreen /> : null}
      </DashboardShell>
    </ProductThemeProvider>
  );
}

function DashboardScreen() {
  return (
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard label="القضايا النشطة" meta="تحتاج 4 قضايا إلى متابعة اليوم" value="128" />
        <MetricCard label="استشارات جديدة" meta="آخر طلب قبل 12 دقيقة" value="24" />
        <MetricCard label="مستندات للمراجعة" meta="6 ملفات بانتظار اعتماد محام" value="36" />
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-kmt-title text-kmt-ink">قائمة القضايا</h2>
            <p className="mt-1 text-sm leading-6 text-kmt-muted">عرض تشغيلي كثيف لكنه واضح للفرق القانونية.</p>
          </div>
          <Button leadingIcon={<MaterialSymbol className="text-[18px]" name="add" />}>قضية جديدة</Button>
        </div>
        <Tabs
          activeValue="all"
          items={[
            { value: "all", label: "الكل", badge: <Badge>188</Badge> },
            { value: "active", label: "نشطة", badge: <Badge tone="active">128</Badge> },
            { value: "pending", label: "معلقة", badge: <Badge tone="pending">24</Badge> },
            { value: "closed", label: "مغلقة", badge: <Badge tone="closed">36</Badge> }
          ]}
        />
        <FilterBar ariaLabel={plan35AdminListAccessibilityCopy.productSystem.casesFilters}>
          <SearchInput ariaLabel={plan35AdminListAccessibilityCopy.productSystem.casesSearch} className="min-w-64 flex-1" placeholder="ابحث برقم القضية أو اسم العميل" />
          <Select aria-label="حالة القضية" className="max-w-48" label="حالة القضية" name="caseStatus" defaultValue="all">
            <option value="all">كل الحالات</option>
            <option value="active">نشطة</option>
            <option value="pending">معلقة</option>
          </Select>
        </FilterBar>
        <CasesTable compact />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <ServiceCard description="صياغة ومراجعة العقود التجارية مع ضبط المخاطر والبنود الحرجة." icon="history_edu" title="صياغة العقود" />
        <DocumentCard meta="PDF - تم رفعه منذ ساعتين" status="قيد المراجعة" title="عقد توريد نهائي" />
        <TaskCard due="الاستحقاق: غدا 10:00 ص" priority="urgent" title="مراجعة بند التعويضات" />
      </section>

      <AIOrganizerPanel>
        كل مخرجات الذكاء الاصطناعي في المنتج الحقيقي يجب أن تكون مساعدة تنظيمية فقط وتحتاج مراجعة محام قبل الاستخدام.
      </AIOrganizerPanel>

      <section className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <form className="space-y-4 rounded-lg border border-kmt-border bg-white p-5">
          <div>
            <h2 className="text-kmt-title text-kmt-ink">نموذج إدخال</h2>
            <p className="mt-1 text-sm leading-6 text-kmt-muted">حقول عربية بمساحات مريحة ورسائل مساعدة واضحة.</p>
          </div>
          <TextInput hint="استخدم الاسم القانوني كما يظهر في السجل التجاري." label="اسم العميل" name="clientName" placeholder="شركة مثال القانونية" />
          <Select label="نوع الخدمة" name="serviceType" defaultValue="contracts">
            <option value="contracts">صياغة العقود</option>
            <option value="corporate">قضايا الشركات</option>
            <option value="collection">التحصيل التجاري</option>
          </Select>
          <Textarea error="الملخص مطلوب قبل حفظ الطلب." label="ملخص الطلب" name="summary" placeholder="اكتب ملخصا مختصرا..." />
          <div className="flex flex-wrap justify-end gap-3">
            <Button type="button" variant="secondary">
              إلغاء
            </Button>
            <Button type="button">حفظ المسودة</Button>
          </div>
        </form>

        <div className="space-y-4">
          <Toast description="تم حفظ المسودة محليا في واجهة العرض." title="تم تحديث الحالة" tone="success" />
          <StateBlock
            action={
              <Button size="sm" variant="secondary">
                إعادة المحاولة
              </Button>
            }
            description="تعذر تحميل جزء من البيانات. يمكن إعادة المحاولة بدون فقدان المدخلات الحالية."
            title="تعذر تحديث البيانات"
            tone="error"
          />
          <DialogFrame
            description="هذا الإجراء سيسجل في سجل التدقيق ويمكن مراجعته لاحقا."
            footer={
              <>
                <Button variant="ghost">إلغاء</Button>
                <Button>تأكيد الإجراء</Button>
              </>
            }
            title="تأكيد تغيير حالة القضية"
          >
            <p className="text-sm leading-6 text-kmt-muted">سيتم نقل القضية إلى حالة المراجعة الداخلية وإبلاغ المحامي المسؤول.</p>
          </DialogFrame>
        </div>
      </section>
    </div>
  );
}

function ClientsScreen() {
  return (
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard label="إجمالي العملاء" meta="يشمل الشركات والأفراد" value="842" />
        <MetricCard label="عملاء نشطون" meta="لديهم قضايا مفتوحة" value="319" />
        <MetricCard label="متابعات اليوم" meta="مكالمات ومهام CRM" value="18" />
        <MetricCard label="طلبات جديدة" meta="من نموذج الاستشارة" value="7" />
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-kmt-title text-kmt-ink">سجل العملاء</h2>
            <p className="mt-1 text-sm leading-6 text-kmt-muted">واجهة CRM ثابتة تعرض شكل البحث، الفلاتر، والحالة قبل ربط البيانات.</p>
          </div>
          <Button leadingIcon={<MaterialSymbol className="text-[18px]" name="person_add" />}>عميل جديد</Button>
        </div>
        <FilterBar ariaLabel={plan35AdminListAccessibilityCopy.productSystem.clientsFilters}>
          <SearchInput ariaLabel={plan35AdminListAccessibilityCopy.productSystem.clientsSearch} className="min-w-64 flex-1" placeholder="ابحث باسم العميل أو جهة الاتصال" />
          <Select className="max-w-48" label="نوع العميل" name="clientType" defaultValue="all">
            <option value="all">كل العملاء</option>
            <option value="company">شركات</option>
            <option value="individual">أفراد</option>
          </Select>
          <Select className="max-w-48" label="الحالة" name="clientStatus" defaultValue="active">
            <option value="active">نشط</option>
            <option value="pending">معلق</option>
            <option value="closed">مغلق</option>
          </Select>
        </FilterBar>
        <DataTable
          caption={plan35AdminListAccessibilityCopy.productSystem.clientsTable}
          columns={[
            { key: "name", header: "العميل", render: (row) => <span className="font-medium">{row.name}</span> },
            { key: "contact", header: "جهة الاتصال", render: (row) => row.contact },
            { key: "segment", header: "التصنيف", render: (row) => row.segment },
            { key: "openCases", header: "قضايا مفتوحة", render: (row) => <span className="tabular-nums">{row.openCases}</span> },
            { key: "lastActivity", header: "آخر نشاط", render: (row) => row.lastActivity },
            { key: "status", header: "الحالة", render: (row) => statusBadge(row.status) }
          ]}
          rows={clientRows}
          mobileRender={(row) => (
            <DataRecordCard
              title={row.name}
              description={row.contact}
              badges={statusBadge(row.status)}
              fields={[
                { label: "التصنيف", value: row.segment },
                { label: "قضايا مفتوحة", value: row.openCases },
                { label: "آخر نشاط", value: row.lastActivity, className: "sm:col-span-2" }
              ]}
            />
          )}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <TaskCard due="اليوم 03:00 م" priority="urgent" title="الاتصال بشركة النهضة لتأكيد موعد التوقيع" />
        <TaskCard due="غدا 11:30 ص" priority="normal" title="تحديث بيانات مفوض مؤسسة المدار" />
        <StateBlock description="لا يتم عرض بيانات شخصية حساسة في أي telemetry أو event داخلي." title="تنبيه خصوصية CRM" tone="permission" />
      </section>
    </div>
  );
}

function CasesScreen() {
  return (
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard label="قضايا نشطة" meta="12 قضية بلا جلسة قادمة" value="128" />
        <MetricCard label="جلسات هذا الأسبوع" meta="محاكم ومراجعات داخلية" value="42" />
        <MetricCard label="مهام متأخرة" meta="تحتاج تصعيد إداري" value="9" />
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-kmt-title text-kmt-ink">تشغيل القضايا</h2>
            <p className="mt-1 text-sm leading-6 text-kmt-muted">قائمة ثابتة تمثل slice لاحق للقضايا والجلسات والتقويم.</p>
          </div>
          <Button leadingIcon={<MaterialSymbol className="text-[18px]" name="event_available" />}>جدولة جلسة</Button>
        </div>
        <Tabs
          activeValue="active"
          items={[
            { value: "active", label: "نشطة", badge: <Badge tone="active">128</Badge> },
            { value: "hearing", label: "جلسات", badge: <Badge tone="pending">42</Badge> },
            { value: "review", label: "مراجعة", badge: <Badge>16</Badge> },
            { value: "closed", label: "مغلقة", badge: <Badge tone="closed">36</Badge> }
          ]}
        />
        <CasesTable />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>تقويم اليوم</CardTitle>
            <CardDescription>عرض ثابت للجلسات القادمة.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <DocumentCard meta="10:30 ص - محكمة القاهرة الاقتصادية" status="مؤكد" title="جلسة KMT-2024-089" />
            <DocumentCard meta="01:00 م - مراجعة داخلية" status="داخلي" title="مراجعة ملف التحصيل" />
          </CardContent>
        </Card>
        <TaskCard due="قبل نهاية اليوم" priority="urgent" title="رفع مذكرة الدفاع للقضية KMT-2024-104" />
        <TaskCard due="الخميس 09:00 ص" priority="normal" title="تأكيد حضور العميل في جلسة التوقيع" />
      </section>
    </div>
  );
}

function DocumentsScreen() {
  return (
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard label="مستندات مرفوعة" meta="داخل التخزين الخاص" value="1,284" />
        <MetricCard label="بانتظار المراجعة" meta="لا تظهر للعميل قبل الاعتماد" value="36" />
        <MetricCard label="مرفوضة" meta="نوع أو جودة غير مناسبة" value="5" />
        <MetricCard label="حد الرفع" meta="PDF/DOC/DOCX/JPG/PNG" value="5MB" />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-kmt-title text-kmt-ink">مكتبة المستندات</h2>
              <p className="mt-1 text-sm leading-6 text-kmt-muted">تمثيل لإدارة المستندات قبل تنفيذ صلاحيات الرفع والتنزيل في PLAN-07.</p>
            </div>
            <Button leadingIcon={<MaterialSymbol className="text-[18px]" name="upload_file" />}>رفع مستند</Button>
          </div>
          <FilterBar ariaLabel={plan35AdminListAccessibilityCopy.productSystem.documentsFilters}>
            <SearchInput ariaLabel={plan35AdminListAccessibilityCopy.productSystem.documentsSearch} className="min-w-64 flex-1" placeholder="ابحث باسم المستند أو العميل" />
            <Select className="max-w-48" label="نوع الملف" name="documentType" defaultValue="all">
              <option value="all">كل الأنواع</option>
              <option value="pdf">PDF</option>
              <option value="image">صور</option>
              <option value="word">Word</option>
            </Select>
          </FilterBar>
          <DataTable
            caption={plan35AdminListAccessibilityCopy.productSystem.documentsTable}
            columns={[
              { key: "title", header: "المستند", render: (row) => <span className="font-medium">{row.title}</span> },
              { key: "owner", header: "المالك", render: (row) => row.owner },
              { key: "type", header: "النوع", render: (row) => <span className="tabular-nums">{row.type}</span> },
              { key: "size", header: "الحجم", render: (row) => <span className="tabular-nums">{row.size}</span> },
              { key: "uploadedAt", header: "تاريخ الرفع", render: (row) => row.uploadedAt },
              { key: "status", header: "الحالة", render: (row) => statusBadge(row.status) }
            ]}
            rows={documentRows}
            mobileRender={(row) => (
              <DataRecordCard
                title={row.title}
                description={row.owner}
                badges={statusBadge(row.status)}
                fields={[
                  { label: "النوع", value: row.type },
                  { label: "الحجم", value: row.size },
                  { label: "تاريخ الرفع", value: row.uploadedAt, className: "sm:col-span-2" }
                ]}
              />
            )}
          />
        </div>

        <div className="space-y-4">
          <StateBlock
            description="في التنفيذ الحقيقي، الملفات تحفظ في مجلد خاص داخل VPS ولا يخدمها Nginx مباشرة."
            title="عقد التخزين"
            tone="permission"
          />
          <Card>
            <CardHeader>
              <CardTitle>قواعد الرفع</CardTitle>
              <CardDescription>نسخة ثابتة من القرار المعتمد في الخطط.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-kmt-muted">
              <p>الحد الأقصى: 5MB لكل ملف.</p>
              <p>الأنواع: PDF, DOC, DOCX, JPG, JPEG, PNG.</p>
              <p>كل تنزيل يجب أن يمر من التطبيق بعد فحص الصلاحيات.</p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

function SettingsScreen() {
  return (
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard label="مستخدمون إداريون" meta="يشمل المحامين والتسويق والإدارة" value="24" />
        <MetricCard label="2FA مؤجل" meta="TOTP غير مفعل في هذه النسخة" value="0%" />
        <MetricCard label="أحداث تدقيق" meta="آخر 7 أيام" value="318" />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_420px]">
        <Card>
          <CardHeader>
            <CardTitle>إعدادات النظام</CardTitle>
            <CardDescription>واجهة ثابتة لقرارات SMTP وAI والتخزين قبل ربط البيئة الحقيقية.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select label="موفر الذكاء الاصطناعي" name="aiProvider" defaultValue="mock">
              <option value="mock">Mock</option>
              <option value="openrouter">OpenRouter</option>
              <option value="openai-compatible">OpenAI-compatible</option>
              <option value="local">Local / Custom Adapter</option>
            </Select>
            <TextInput hint="يستخدم داخل السيرفر فقط ولا يظهر للعميل." label="نموذج الذكاء الاصطناعي" name="aiModel" placeholder="provider/model-name" />
            <StateBlock
              description="خاصية SMTP موجودة في متغيرات البيئة والخطط فقط، لكنها مؤجلة ومعطلة بدون واجهة حفظ أو إرسال فعلي في هذه النسخة."
              title="SMTP مؤجل ومعطل"
              tone="permission"
            />
            <TextInput label="مجلد التخزين الخاص" name="storagePath" defaultValue="/var/lib/kmt-legal/uploads" />
          </CardContent>
          <CardFooter className="justify-end gap-3">
            <Button variant="secondary">إلغاء</Button>
            <Button>حفظ الإعدادات</Button>
          </CardFooter>
        </Card>

        <div className="space-y-4">
          <Toast description="TOTP مؤجل في PLAN-25، وتسجيل دخول الموظفين يتم بكلمة مرور فقط حتى خطة إعادة تفعيل التحقق الثنائي للموظفين." title="حكم أمني" tone="warning" />
          <StateBlock description="هذه الصفحة تعرض شكل الحوكمة فقط. تنفيذ الصلاحيات الحقيقي يبدأ في PLAN-05 وPLAN-18." title="لا توجد صلاحيات متصلة بعد" tone="permission" />
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-kmt-title text-kmt-ink">سجل التدقيق</h2>
          <p className="mt-1 text-sm leading-6 text-kmt-muted">شكل الجدول الذي سيستخدم لاحقا لأحداث الصلاحيات والإعدادات.</p>
        </div>
        <DataTable
          caption={plan35AdminListAccessibilityCopy.productSystem.auditTable}
          columns={[
            { key: "action", header: "الإجراء", render: (row) => <span className="font-medium">{row.action}</span> },
            { key: "actor", header: "المنفذ", render: (row) => row.actor },
            { key: "target", header: "الهدف", render: (row) => row.target },
            { key: "time", header: "الوقت", render: (row) => row.time }
          ]}
          rows={auditRows}
          mobileRender={(row) => (
            <DataRecordCard
              title={row.action}
              description={row.target}
              fields={[
                { label: "المنفذ", value: row.actor },
                { label: "الوقت", value: row.time }
              ]}
            />
          )}
        />
      </section>
    </div>
  );
}

function CasesTable({ compact = false }: { compact?: boolean }) {
  return (
    <DataTable
      caption={plan35AdminListAccessibilityCopy.productSystem.casesTable}
      columns={[
        {
          key: "number",
          header: "رقم القضية",
          render: (row) => <span className="font-medium tabular-nums">{row.number}</span>
        },
        { key: "client", header: "العميل", render: (row) => row.client },
        { key: "service", header: "الخدمة", render: (row) => row.service },
        ...(compact
          ? []
          : [
              { key: "lawyer", header: "المحامي", render: (row: (typeof caseRows)[number]) => row.lawyer },
              { key: "nextStep", header: "الخطوة التالية", render: (row: (typeof caseRows)[number]) => row.nextStep }
            ]),
        {
          key: "status",
          header: "الحالة",
          render: (row) => statusBadge(row.status)
        }
      ]}
      rows={caseRows}
      mobileRender={(row) => (
        <DataRecordCard
          title={row.number}
          description={row.client}
          badges={statusBadge(row.status)}
          fields={[
            { label: "الخدمة", value: row.service },
            { label: "المحامي", value: row.lawyer },
            { label: "الخطوة التالية", value: row.nextStep, className: "sm:col-span-2" }
          ]}
        />
      )}
    />
  );
}
