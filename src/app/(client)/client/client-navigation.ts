import type { DashboardNavItem } from "@/components/layout";
import { getClientContent, type ClientLocale } from "@/content/client-content";

export function clientNavForPath(pathname: string, locale: ClientLocale): DashboardNavItem[] {
  const copy = getClientContent(locale).nav;
  const clientNavItems: DashboardNavItem[] = [
    { label: copy.home, href: "/client", icon: "home" },
    { label: copy.cases, href: "/client/cases", icon: "cases" },
    { label: copy.appointments, href: "/client/court-dates", icon: "event" },
    { label: copy.files, href: "/client/files", icon: "folder" },
    { label: copy.payments, href: "/client/payments", icon: "payments" },
    { label: copy.assistant, href: "/client/assistant", icon: "smart_toy" },
    { label: copy.profile, href: "/client/profile", icon: "person" }
  ];
  return clientNavItems.map((item) => ({
    ...item,
    active: pathname === item.href || (item.href !== "/client" && pathname.startsWith(`${item.href}/`))
  }));
}
