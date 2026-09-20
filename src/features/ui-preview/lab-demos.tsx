"use client";

import { useEffect, useState } from "react";
import { Badge, Button, MaterialSymbol, buttonClasses } from "@/components/ui";
import { Button as StatefulButton } from "@/components/ui/stateful-button";
import { FileUpload } from "@/components/ui/file-upload";
import { AdminDialog, AdminPagination, AdminRowActions, AdminSidebarNav, AdminTabs } from "@/components/admin";
import type { DashboardNavItem } from "@/components/layout/dashboard-navigation";
import { PublicFloatingDock } from "@/components/layout/public-floating-dock";
import { KmtBrandLogo } from "@/components/brand";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/animate-ui/components/radix/accordion";
import {
  Sheet,
  SheetContent,
  SheetTrigger
} from "@/components/animate-ui/components/radix/sheet";
import {
  Popover,
  PopoverPanel,
  PopoverTrigger
} from "@/components/animate-ui/components/base/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@/components/animate-ui/components/radix/tooltip";
import type { LabLocale } from "./lab-shell";

function t(locale: LabLocale, en: string, ar: string) {
  return locale === "ar" ? ar : en;
}

export function BrandDemo({ locale }: { locale: LabLocale }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="rounded-lg bg-[#14100a] p-5">
        <KmtBrandLogo size="sm" surface="dark" variant="lockup" />
        <p className="mt-3 text-xs text-white/60">{t(locale, "Lockup · dark surface", "الشعار الكامل · سطح داكن")}</p>
      </div>
      <div className="rounded-lg border border-kmt-border bg-white p-5">
        <KmtBrandLogo size="sm" surface="light" variant="lockup" />
        <p className="mt-3 text-xs text-kmt-muted">{t(locale, "Lockup · light surface", "الشعار الكامل · سطح فاتح")}</p>
      </div>
      <div className="flex items-center gap-4 rounded-lg border border-border bg-surface p-5">
        <KmtBrandLogo size="sm" variant="mark" />
        <p className="text-xs text-muted-foreground">{t(locale, "Mark only", "العلامة فقط")}</p>
      </div>
    </div>
  );
}

export function StatefulButtonDemo({ locale }: { locale: LabLocale }) {
  const [status, setStatus] = useState(t(locale, "Idle — click to run a fake save.", "جاهز — اضغط لتشغيل حفظ تجريبي."));
  useEffect(() => {
    setStatus(t(locale, "Idle — click to run a fake save.", "جاهز — اضغط لتشغيل حفظ تجريبي."));
  }, [locale]);
  return (
    <div className="flex flex-wrap items-center gap-4">
      <StatefulButton
        onClick={async () => {
          setStatus(t(locale, "Saving…", "جارٍ الحفظ…"));
          await new Promise((resolve) => setTimeout(resolve, 900));
          setStatus(t(locale, "Saved (demo only, no request sent).", "تم الحفظ (تجريبي فقط، لا طلبات مرسلة)."));
        }}
        type="button"
      >
        {t(locale, "Save changes", "حفظ التغييرات")}
      </StatefulButton>
      <p className="text-sm text-muted-foreground" role="status">{status}</p>
    </div>
  );
}

export function FileUploadDemo({ locale }: { locale: LabLocale }) {
  const [names, setNames] = useState<string[]>([]);
  return (
    <div className="space-y-3">
      <FileUpload
        accept=".pdf,.png,.jpg,.jpeg"
        onChange={(files) => setNames(files.map((file) => file.name))}
      />
      <p className="text-sm text-muted-foreground" role="status">
        {names.length
          ? `${t(locale, "Selected:", "الملفات المختارة:")} ${names.join("، ")}`
          : t(locale, "Drop a file or browse — demo only, nothing is uploaded.", "أسقط ملفًا أو تصفح — تجريبي فقط، لا يتم الرفع.")}
      </p>
    </div>
  );
}

const labTabValues = ["overview", "sessions", "documents"] as const;

export function AdminTabsDemo({ locale }: { locale: LabLocale }) {
  const [active, setActive] = useState<string>("overview");
  useEffect(() => {
    const sync = () => {
      const hash = window.location.hash.replace("#lab-tab-", "");
      if ((labTabValues as readonly string[]).includes(hash)) setActive(hash);
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);
  const labels: Record<string, string> =
    locale === "ar" ? { overview: "نظرة عامة", sessions: "الجلسات", documents: "المستندات" } : { overview: "Overview", sessions: "Sessions", documents: "Documents" };
  return (
    <div className="space-y-3">
      <AdminTabs
        active={active}
        ariaLabel={t(locale, "Lab tabs demo", "عرض تجريبي للتبويبات")}
        tabs={labTabValues.map((value) => ({ value, label: labels[value], href: `#lab-tab-${value}`, badge: value === "sessions" ? 3 : undefined }))}
      />
      <p className="text-sm text-muted-foreground" role="status">
        {t(locale, "Active tab:", "التبويب النشط:")} {labels[active]} · {t(locale, "manual activation, hash hrefs", "تفعيل يدوي، روابط hash")}
      </p>
    </div>
  );
}

export function AdminAccordionDemo({ locale }: { locale: LabLocale }) {
  return (
    <Accordion className="space-y-3" collapsible defaultValue="lab-item-1" type="single">
      <AccordionItem className="rounded border border-kmt-border bg-white px-4" value="lab-item-1">
        <AccordionTrigger className="text-sm font-semibold text-kmt-ink">
          {t(locale, "Action group one", "مجموعة إجراءات واحد")}
          <Badge tone="pending">{t(locale, "2 pending", "2 معلقة")}</Badge>
        </AccordionTrigger>
        <AccordionContent>
          <p className="text-sm leading-6 text-kmt-muted">
            {t(locale, "Same Accordion chrome as production action groups.", "نفس الأكورديون المستخدم في مجموعات الإجراءات الإنتاجية.")}
          </p>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem className="rounded border border-kmt-border bg-white px-4" value="lab-item-2">
        <AccordionTrigger className="text-sm font-semibold text-kmt-ink">{t(locale, "Action group two", "مجموعة إجراءات اثنان")}</AccordionTrigger>
        <AccordionContent>
          <p className="text-sm leading-6 text-kmt-muted">
            {t(locale, "Keyboard: Enter/Space toggles, arrows move between triggers.", "لوحة المفاتيح: Enter/Space للتبديل والأسهم للتنقل.")}
          </p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

export function AdminDialogDemo({ locale }: { locale: LabLocale }) {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button onClick={() => setOpen(true)} variant="danger">
        {t(locale, "Open destructive confirm", "فتح تأكيد إجراء خطر")}
      </Button>
      <p className="text-sm text-muted-foreground" role="status">
        {t(locale, "Confirmed count:", "عدد مرات التأكيد:")} {count}
      </p>
      <AdminDialog
        cancelLabel={t(locale, "Cancel", "إلغاء")}
        confirmLabel={t(locale, "Confirm delete", "تأكيد الحذف")}
        description={t(locale, "Demo only — nothing is deleted.", "تجريبي فقط — لا يتم حذف شيء.")}
        onConfirm={() => setCount((value) => value + 1)}
        onOpenChange={setOpen}
        open={open}
        title={t(locale, "Delete this record?", "حذف هذا السجل؟")}
        variant="destructive"
      />
    </div>
  );
}

export function SheetDemo({ locale }: { locale: LabLocale }) {
  return (
    <Sheet>
      <SheetTrigger className={buttonClasses({ variant: "secondary" })}>
        {t(locale, "Open sheet (mobile form shell)", "فتح اللوحة (غلاف فورم الموبايل)")}
      </SheetTrigger>
      <SheetContent aria-label={t(locale, "Demo sheet", "لوحة تجريبية")} className="overflow-y-auto border-kmt-border bg-white text-kmt-ink" side="right">
        <p className="text-base font-semibold text-kmt-ink">{t(locale, "Demo sheet", "لوحة تجريبية")}</p>
        <p className="mt-2 text-sm leading-6 text-kmt-muted">
          {t(locale, "Same Sheet shell as production mobile forms.", "نفس اللوحة المستخدمة في فورمات الموبايل الإنتاجية.")}
        </p>
      </SheetContent>
    </Sheet>
  );
}

export function MenuDemo({ locale }: { locale: LabLocale }) {
  const [lastAction, setLastAction] = useState(t(locale, "No action yet.", "لا إجراء بعد."));
  useEffect(() => {
    setLastAction(t(locale, "No action yet.", "لا إجراء بعد."));
  }, [locale]);
  return (
    <div className="flex flex-wrap items-center gap-3">
      <AdminRowActions
        entries={[
          { kind: "action", action: { key: "open", label: t(locale, "Open record", "فتح السجل"), onSelect: () => setLastAction(t(locale, "Open record", "فتح السجل")) } },
          { kind: "separator", key: "sep" },
          {
            kind: "action",
            action: { key: "archive", label: t(locale, "Archive", "أرشفة"), destructive: true, onSelect: () => setLastAction(t(locale, "Archive (dialog in production)", "أرشفة (ديالوج في الإنتاج)")) }
          }
        ]}
        label={t(locale, "Row actions", "إجراءات الصف")}
      />
      <p className="text-sm text-muted-foreground" role="status">{lastAction}</p>
    </div>
  );
}

export function PopoverDemo({ locale }: { locale: LabLocale }) {
  return (
    <Popover>
      <PopoverTrigger aria-label={t(locale, "Open info popover", "فتح نافذة معلومات")} className={buttonClasses({ variant: "secondary", size: "sm" })}>
        <MaterialSymbol className="text-[20px]" name="info" />
        {t(locale, "Popover", "نافذة منبثقة")}
      </PopoverTrigger>
      <PopoverPanel align="end" className="w-[min(20rem,calc(100vw-2rem))] border-kmt-border bg-white p-3 text-sm text-kmt-ink">
        <p className="font-semibold text-kmt-ink">{t(locale, "Same panel chrome as the bell.", "نفس النافذة المستخدمة في الجرس.")}</p>
        <p className="mt-1 text-kmt-muted">{t(locale, "Escape closes, focus returns to the trigger.", "Escape يغلق والتركيز يعود للزرار.")}</p>
      </PopoverPanel>
    </Popover>
  );
}

export function TooltipDemo({ locale }: { locale: LabLocale }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="sm" variant="secondary">
            {t(locale, "Hover or focus me", "مرر أو ركّز عليّ")}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{t(locale, "Production tooltip", "تلميح الإنتاج")}</TooltipContent>
      </Tooltip>
    </div>
  );
}

export function AdminPaginationDemo({ locale }: { locale: LabLocale }) {
  return (
    <AdminPagination
      hrefForPage={(page) => `#lab-pagination-${page}`}
      nextLabel={t(locale, "Next", "التالي")}
      page={2}
      pageSize={10}
      previousLabel={t(locale, "Previous", "السابق")}
      resetHref="#lab-pagination"
      resetLabel={t(locale, "Clear filters", "مسح الفلاتر")}
      summary={t(locale, "Showing 11–20 of 37 matters", "عرض 11–20 من 37 قضية")}
      total={37}
    />
  );
}

const sidebarDemoItems: DashboardNavItem[] = [
  { label: "Overview", href: "#lab-sidebar-overview", icon: "dashboard", group: "Workspace", active: true },
  { label: "Cases", href: "#lab-sidebar-cases", icon: "cases", group: "Workspace" },
  { label: "Clients", href: "#lab-sidebar-clients", icon: "group", group: "Workspace" },
  { label: "Settings", href: "#lab-sidebar-settings", icon: "settings", group: "System" }
];

export function SidebarDemo({ locale }: { locale: LabLocale }) {
  return (
    <div>
      <div className="h-[380px] overflow-hidden rounded-lg border border-kmt-border">
        <AdminSidebarNav
          badgeLabel={t(locale, "Admin", "مدير")}
          badgeTone="active"
          modeLabel={t(locale, "Design lab", "مختبر التصميم")}
          navItems={sidebarDemoItems}
        />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {t(
          locale,
          "Desktop-only in production (mobile uses the sheet nav); hover expands, keyboard focus expands too.",
          "للديسكتوب فقط في الإنتاج (الموبايل يستخدم لوحة التنقل)؛ التحويم يوسّع وكذلك تركيز لوحة المفاتيح."
        )}
      </p>
    </div>
  );
}

export function DockDemo({ locale }: { locale: LabLocale }) {
  return <PublicFloatingDock locale={locale} />;
}
