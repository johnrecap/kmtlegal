import type { DashboardNavItem } from "@/components/layout";

const clientNavItems: DashboardNavItem[] = [
  { label: "الرئيسية", href: "/client", icon: "home" },
  { label: "القضايا", href: "/client/cases", icon: "cases" },
  { label: "المواعيد", href: "/client/court-dates", icon: "event" },
  { label: "الملفات", href: "/client/files", icon: "folder" },
  { label: "المدفوعات", href: "/client/payments", icon: "payments" },
  { label: "المساعد", href: "/client/assistant", icon: "smart_toy" },
  { label: "الملف الشخصي", href: "/client/profile", icon: "person" }
];

export function clientNavForPath(pathname: string) {
  return clientNavItems.map((item) => ({
    ...item,
    active: pathname === item.href || (item.href !== "/client" && pathname.startsWith(`${item.href}/`))
  }));
}
