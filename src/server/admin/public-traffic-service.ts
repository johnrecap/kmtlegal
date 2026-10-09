import { prisma } from "@/server/db/prisma";
import { hasPermission, type Principal } from "@/server/auth/policy";
import { ApiError } from "@/server/http/errors";
import { financeReportDateRange } from "./finance-report-service";
import { analyticsEnabled, analyticsEnvironment, sanitizeAnalyticsProperties } from "@/server/observability/analytics-service";
import type { AnalyticsEventName } from "@/lib/analytics-events";

export async function getPublicTrafficReport(actor: Principal, filters: { dateFrom?: string; dateTo?: string }) {
  if (!hasPermission(actor, "report.read.any")) throw new ApiError(403, "PERMISSION_DENIED", "Report read permission is required.");
  const { from, to } = financeReportDateRange(filters);
  const createdAt = { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) };
  const [groups, contactRequests, consultationRequests] = await Promise.all([
    prisma.analyticsEvent.groupBy({
      by: ["name", "properties"],
      where: { name: { in: ["public.page_viewed", "public.contact_clicked", "public.booking_clicked"] }, source: "PUBLIC", environment: analyticsEnvironment(), createdAt },
      _count: { _all: true }
    }),
    prisma.contactMessage.count({ where: { createdAt } }),
    prisma.consultationRequest.count({ where: { createdAt } })
  ]);
  const pages = new Map<string, { page: string; locale: string; service: string | null; count: number }>();
  const contacts = { phone: 0, email: 0, whatsapp: 0 };
  let pageViews = 0, bookingClicks = 0;
  for (const group of groups) {
    let properties: Record<string, unknown>;
    try { properties = sanitizeAnalyticsProperties(group.name as AnalyticsEventName, group.properties) as Record<string, unknown>; } catch { continue; }
    const count = group._count._all;
    if (group.name === "public.page_viewed") {
      pageViews += count;
      const page = String(properties.page), locale = String(properties.locale);
      const service = typeof properties.service === "string" ? properties.service : null;
      const key = `${page}:${locale}:${service ?? ""}`;
      pages.set(key, { page, locale, service, count: (pages.get(key)?.count ?? 0) + count });
    } else if (group.name === "public.contact_clicked") contacts[properties.channel as keyof typeof contacts] += count;
    else bookingClicks += count;
  }
  return { enabled: analyticsEnabled(), pageViews, bookingClicks, contacts, contactRequests, consultationRequests, pages: [...pages.values()].sort((a, b) => b.count - a.count) };
}
