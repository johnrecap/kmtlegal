import type { DashboardNavItem } from "@/components/layout";

export const adminNavItems: DashboardNavItem[] = [
  { label: "الرئيسية", href: "/admin", icon: "dashboard" },
  { label: "الاستشارات", href: "/admin/consultations", icon: "rate_review" },
  { label: "العملاء", href: "/admin/clients", icon: "groups" },
  { label: "القضايا", href: "/admin/cases", icon: "gavel" },
  { label: "التقويم", href: "/admin/calendar", icon: "event" },
  { label: "المهام", href: "/admin/tasks", icon: "task_alt" },
  { label: "المستندات", href: "/admin/documents", icon: "folder" },
  { label: "المحتوى", href: "/admin/content", icon: "campaign" },
  { label: "الفواتير", href: "/admin/finance", icon: "receipt_long" },
  { label: "التقارير", href: "/admin/reports", icon: "monitoring" },
  { label: "المستخدمون", href: "/admin/users", icon: "manage_accounts" },
  { label: "الإعدادات", href: "/admin/settings", icon: "settings" },
  { label: "سجل التدقيق", href: "/admin/audit-log", icon: "fact_check" }
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
