import { clientAssistantCopy } from "@/content/client-assistant-copy";
import { formatDateTime } from "@/lib/legal-format";
import type { Principal } from "@/server/auth/policy";
import { ApiError } from "@/server/http/errors";
import { clientAssistantDueBalances, findClientAssistantReference, getClientAssistantRecord, listClientAssistantRecords } from "./client-assistant-data";
import type { Category, ClientRecord, FollowupFocus, RecordRef } from "./client-assistant-contract";
import { legalSubjectQuestion } from "@/server/ai/legal-context";

export function normalizeFollowup(text: string) {
  return text.toLowerCase().replace(/[\u064B-\u065F\u0670]/g, "").replace(/[أإآ]/g, "ا").replace(/ى/g, "ي").replace(/[٠-٩]/g, d => String("٠١٢٣٤٥٦٧٨٩".indexOf(d))).trim();
}
export function explicitNewBooking(text: string) {
  return /(?:حجز|احجز|استشاره|موعد).*(?:جديد|جديدة)|(?:جديد|جديدة).*(?:حجز|استشاره|موعد)|\b(?:new|another)\s+(?:booking|appointment|consultation)\b/i.test(normalizeFollowup(text));
}
export function followupCategory(text: string, focus?: FollowupFocus): Category | null {
  const t = normalizeFollowup(text);
  if (legalSubjectQuestion(text)) return null;
  if (explicitNewBooking(t)) return null;
  if (/طلباتي|كل الطلبات|\bmy requests\b/.test(t)) return "REQUESTS";
  if (focus?.selected && /ناقص|missing|عرض المكتب|proposal|quote/.test(t)) return focus.category;
  if (/عليا كام|علي كام|علي[اّ]* فلوس|فواتيري|فاتورتي|مدفوعاتي|رصيدي|\b(?:owe|my balance|my invoices?|my payments?)\b/.test(t) || (focus && /فواتير|فاتور|مدفوع|متبقي|رصيد|\b(?:balance|invoice|payments?|paid|fees)\b/.test(t))) return "PAYMENT";
  if (/مستنداتي|ملفاتي|ورقي|\bmy (?:documents?|files?)\b/.test(t) || (focus && /مستند|ملفات|ورق|\b(?:documents?|files?)\b/.test(t))) return "DOCUMENT";
  if (/جلساتي|الجلس[هة].*امتي|\bmy hearings?\b/.test(t)) return "HEARING";
  if (/قضيتي|قضايايا|\bmy (?:cases?|court)\b/.test(t) || (focus && /قضي|قضايا|جلس[هة]|محكم|\b(?:cases?|hearings?|court)\b/.test(t))) return "CASE";
  if (/ميعادي|موعدي|مواعيدي|\b(?:my appointments?|when.*my meeting)\b/.test(t) || (focus && /ميعاد|موعد|مواعيد|\bappointments?\b/.test(t))) return "APPOINTMENT";
  if (/بيانات[يى]|ملفي الشخصي|\b(?:my profile|my phone|my email)\b/.test(t)) return "PROFILE";
  if (/مراسلات|ردود المكتب|رسايل المكتب|\b(?:office messages|conversations)\b/.test(t)) return "CONVERSATION";
  if (/مفيش رد|لم يتم الرد|ما.*رد|رد المكتب|\b(?:no (?:reply|response)|office repl)\b/.test(t)) return focus?.category ?? "REQUESTS";
  if (/اتابع|متابع|طلبي|طلباتي|طلب بتاعي|طلب للمكتب|اتقبل|اترفض|ناقصني|ناقص ايه|حال[هة] الطلب|\b(?:follow.?up|my requests?|my booking|accepted|approved|missing|request status)\b/.test(t)) return focus?.category ?? "REQUESTS";
  if (focus && (/^(?:الحجز|الطلب|الخدم[هة]|تمام|التالي|المزيد|next|more|booking|request)[؟?!.\s]*$/.test(t) || /^(?:هل |طيب |و)?(?:اتقبل|قبول|امتي|ليه|ناقص|حالت|what|when|why|is it|has it)/.test(t) || /^\d+[؟?.\s]*$/.test(t))) return focus.category;
  if (focus && /^(?:لسه|اخباره ايه|وصل لفين|وبعدين|and now|what now)/.test(t)) return focus.category;
  // References and UUIDs identify a candidate only; the data service still enforces ownership.
  if (/\b(?:cons|contract|health|case|inv|srv|req|sr|kmt)[-_][a-z0-9-]+\b|\b[0-9a-f]{8}-[0-9a-f-]{27,}\b/i.test(t)) return focus?.category ?? "REQUESTS";
  return null;
}

export function renderClientRecord(record: ClientRecord, locale: "ar" | "en", question = "") {
  const c = clientAssistantCopy[locale], t = normalizeFollowup(question);
  const facts = record.facts;
  const reply = facts.find(f => f.label === c.officeReply);
  const missing = facts.find(f => f.label === c.missing);
  return [`${record.title} — ${record.reference}`, `${c.status}: ${record.status}`, `${c.updated}: ${formatDateTime(record.updatedAt, locale)}`,
    ...facts.map(f => `${f.label}: ${f.value}`),
    ...(/رد|reply|response/.test(t) && !reply ? [c.noReply] : []),
    ...(/ناقص|missing/.test(t) && !missing ? [c.noMissing] : [])].join("\n");
}

export async function resolveClientFollowup(input: { actor: Principal; message: string; locale: "ar" | "en"; category: Category; focus?: FollowupFocus; reference?: RecordRef }) {
  const { actor, message, locale } = input, c = clientAssistantCopy[locale];
  let category = input.category;
  const t = normalizeFollowup(message);
  if (input.focus?.category === "REQUESTS" && /^(?:الحجز|booking)[؟?.\s]*$/.test(t)) category = "CONSULTATION";
  const focus = input.focus?.category === category ? input.focus : undefined;
  let selected = input.reference;
  const reference = t.match(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b|\b(?:cons|contract|health|case|inv|srv|req|sr|kmt)[-_][a-z0-9-]+\b/i)?.[0];
  if (reference) {
    selected = await findClientAssistantReference(actor, reference) ?? undefined;
    if (!selected) return { text: c.notFound, focus: { category } satisfies FollowupFocus };
    category = selected.kind;
  }
  const index = /^(?:رقم\s*)?([1-5])[؟?.\s]*$/.exec(t)?.[1] ?? ({ الاول: "1", التاني: "2", الثاني: "2", الثالث: "3", الرابع: "4", الخامس: "5" } as Record<string, string>)[t];
  if (index && focus?.choices) selected = focus.choices[Number(index) - 1];
  const next = /^(?:التالي|المزيد|next|more)[؟?.\s]*$/.test(t);
  const all = /طلباتي|كل الطلبات|فواتيري|ملفاتي|مستنداتي|قضايايا|جلساتي|مواعيدي|\bmy (?:requests|invoices|documents|files|cases|hearings|appointments)\b/.test(t);
  if (!selected && !next && !all && focus?.selected) selected = focus.selected;
  if (selected) {
    try {
      const record = await getClientAssistantRecord(actor, selected, locale);
      return { text: renderClientRecord(record, locale, message) + (category === "PAYMENT" ? `\n${await clientAssistantDueBalances(actor, locale)}` : ""), focus: { category, selected } satisfies FollowupFocus, record };
    } catch (error) {
      if (!(error instanceof ApiError) || error.code !== "NOT_FOUND") throw error;
      return { text: c.notFound, focus: { category } satisfies FollowupFocus };
    }
  }
  const result = await listClientAssistantRecords(actor, category, locale, next ? focus?.cursor : undefined);
  if (!result.records.length) {
    if (category === "REQUESTS" && /رد|reply|response/.test(t)) return resolveClientFollowup({ ...input, category: "CONVERSATION", focus: undefined });
    return { text: c.empty, focus: { category } satisfies FollowupFocus };
  }
  if (result.records.length === 1 && !result.hasMore) {
    const record = await getClientAssistantRecord(actor, result.records[0], locale);
    return { text: renderClientRecord(record, locale, message) + (category === "PAYMENT" ? `\n${await clientAssistantDueBalances(actor, locale)}` : ""), focus: { category, selected: { kind: record.kind, id: record.id } } satisfies FollowupFocus, record };
  }
  return { text: [...result.records.map((r, i) => `${i + 1}. ${r.title} — ${r.reference} — ${formatDateTime(r.updatedAt, locale)} — ${r.status}`), ...(category === "PAYMENT" ? [await clientAssistantDueBalances(actor, locale)] : []), c.choose, ...(result.hasMore ? [c.more] : [])].join("\n"),
    focus: { category, choices: result.records.map(({ kind, id }) => ({ kind, id })), ...(result.cursor ? { cursor: result.cursor } : {}) } satisfies FollowupFocus };
}
