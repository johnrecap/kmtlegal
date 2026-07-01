import type { DashboardNavItem } from "@/components/layout";

export const portalNavItems: DashboardNavItem[] = [
  { label: "الرئيسية", href: "/portal", icon: "home" },
  { label: "القضايا", href: "/portal/cases", icon: "gavel" },
  { label: "المستندات", href: "/portal/documents", icon: "folder_open" },
  { label: "المواعيد", href: "/portal/appointments", icon: "event" },
  { label: "المدفوعات", href: "/portal/payments", icon: "payments" },
  { label: "الملف الشخصي", href: "/portal/profile", icon: "person" }
];

export function portalNavForPath(pathname: string) {
  return portalNavItems.map((item) => ({
    ...item,
    active: item.href === "/portal" ? pathname === "/portal" : pathname === item.href || pathname.startsWith(`${item.href}/`)
  }));
}

export function portalSectionLabel(section: string[] = []) {
  const path = `/portal/${section.join("/")}`;
  return portalNavItems.find((item) => path === item.href || path.startsWith(`${item.href}/`))?.label ?? "بوابة العميل";
}
