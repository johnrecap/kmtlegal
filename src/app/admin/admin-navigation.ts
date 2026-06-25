import type { DashboardNavItem } from "@/components/layout";

export const adminNavItems: DashboardNavItem[] = [
  { label: "الرئيسية", href: "/admin", icon: "dashboard", group: "تشغيل المكتب" },
  { label: "الاستشارات", href: "/admin/consultations", icon: "rate_review", group: "تشغيل المكتب" },
  { label: "العملاء", href: "/admin/clients", icon: "groups", group: "تشغيل المكتب" },
  { label: "القضايا", href: "/admin/cases", icon: "gavel", group: "تشغيل المكتب" },
  { label: "التقويم", href: "/admin/calendar", icon: "event", group: "تشغيل المكتب" },
  { label: "المهام", href: "/admin/tasks", icon: "task_alt", group: "تشغيل المكتب" },
  { label: "المستندات", href: "/admin/documents", icon: "folder", group: "الملفات والمال" },
  { label: "الفواتير", href: "/admin/finance", icon: "receipt_long", group: "الملفات والمال" },
  { label: "التقارير", href: "/admin/reports", icon: "monitoring", group: "الملفات والمال" },
  { label: "المحتوى", href: "/admin/content", icon: "campaign", group: "الإدارة" },
  { label: "المستخدمون", href: "/admin/users", icon: "manage_accounts", group: "الإدارة" },
  { label: "الإعدادات", href: "/admin/settings", icon: "settings", group: "الإدارة" },
  { label: "سجل التدقيق", href: "/admin/audit-log", icon: "fact_check", group: "الإدارة" }
];

export function adminNavForPath(pathname: string) {
  return adminNavItems.map((item) => ({
    ...item,
    active: item.href === "/admin" ? pathname === "/admin" : pathname === item.href || pathname.startsWith(`${item.href}/`)
  }));
}

export function adminSectionLabel(section: string[] = []) {
  const path = `/admin/${section.join("/")}`;
  return adminNavItems.find((item) => path === item.href || path.startsWith(`${item.href}/`))?.label ?? "شاشة إدارية";
}
