import Link from "next/link";
import { serviceRequestCopy } from "@/content/service-request-copy";
import { serviceRequestQueueCounts } from "@/server/services/service-request-service";
import { hasPermission, type Principal } from "@/server/auth/policy";
import { canReadAdminConversations } from "@/server/conversations/conversation-service";
import { prisma } from "@/server/db/prisma";

export async function ServiceRequestQueues({ actor }: { actor: Principal }) {
  const copy = serviceRequestCopy.ar;
  const services = hasPermission(actor, "case.read.any") || hasPermission(actor, "case.read.assigned");
  const conversations = canReadAdminConversations(actor);
  const [counts, waiting] = await Promise.allSettled([
    services ? serviceRequestQueueCounts(actor) : Promise.resolve(null),
    conversations ? prisma.conversationThread.count({ where: { status: "WAITING_STAFF" } }) : Promise.resolve(null)
  ]);
  const cards = [
    ...(services ? [
      { label: copy.awaitingOffice, href: "/admin/service-requests?status=RECEIVED", count: counts.status === "fulfilled" ? counts.value?.office : null },
      { label: copy.awaitingClient, href: "/admin/service-requests?status=AWAITING_ACCEPTANCE", count: counts.status === "fulfilled" ? counts.value?.client : null }
    ] : []),
    ...(conversations ? [{ label: copy.handoffs, href: "/admin/messages?status=WAITING_STAFF", count: waiting.status === "fulfilled" ? waiting.value : null }] : [])
  ];
  if (!cards.length) return null;
  return <section className="mb-6 grid min-w-0 gap-4 sm:grid-cols-3" aria-label={copy.title}>{cards.map(card => <Link key={card.label} href={card.href} className="min-h-11 rounded-xl border border-border bg-surface p-5 text-foreground"><h2 className="font-semibold">{card.label}</h2>{card.count == null ? <p className="mt-2 text-sm">{copy.unavailable}</p> : <p className="mt-2 text-2xl font-semibold">{card.count}</p>}</Link>)}</section>;
}
