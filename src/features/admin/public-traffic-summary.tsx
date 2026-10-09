import { Card, MetricCard } from "@/components/ui";
import { getPublicTrafficReport } from "@/server/admin/public-traffic-service";
import type { Principal } from "@/server/auth/policy";
import { publicTrafficCopy as copy } from "@/content/public-traffic-copy";
import { getPublicContent } from "@/content/public-content";

export async function PublicTrafficSummary({ actor, filters }: { actor: Principal; filters: { dateFrom?: string; dateTo?: string } }) {
  const report = await getPublicTrafficReport(actor, filters).catch(() => null);
  return <Card className="space-y-5 p-5 sm:p-6" data-testid="public-traffic-report">
    <h2 className="text-xl font-semibold">{copy.title}</h2>
    <p className="text-sm leading-7 text-muted-foreground">{copy.description}</p>
    {!report ? <p role="status">{copy.unavailable}</p> : <>
      {!report.enabled ? <p role="status" className="text-sm">{copy.disabled}</p> : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[[copy.views, report.pageViews], [copy.booking, report.bookingClicks], [copy.phone, report.contacts.phone], [copy.email, report.contacts.email], [copy.whatsapp, report.contacts.whatsapp], [copy.messages, report.contactRequests], [copy.requests, report.consultationRequests]].map(([label, value]) => <MetricCard key={label} label={String(label)} value={Number(value).toLocaleString("ar-EG")} />)}
      </div>
      <p className="text-sm leading-7 text-muted-foreground">{copy.recordsNote}</p>
      {report.pages.length ? <div className="overflow-x-auto"><table className="w-full text-start text-sm">
        <caption className="sr-only">{copy.title}</caption>
        <thead><tr>{[copy.page, copy.locale, copy.count].map(label => <th key={label} scope="col" className="p-3 text-start">{label}</th>)}</tr></thead>
        <tbody>{report.pages.map(row => <tr key={`${row.page}:${row.locale}:${row.service}`} className="border-t border-border">
          <td className="p-3">{row.service ? getPublicContent("ar").legalServices.find(service => service.slug === row.service)?.title : copy.pages[row.page as keyof typeof copy.pages]}</td>
          <td className="p-3">{row.locale === "ar" ? copy.ar : copy.en}</td><td className="p-3 tabular-nums">{row.count.toLocaleString("ar-EG")}</td>
        </tr>)}</tbody>
      </table></div> : <p>{copy.empty}</p>}
    </>}
  </Card>;
}
