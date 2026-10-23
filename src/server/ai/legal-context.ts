import { legalContextSchema, type LegalAssessment, type LegalContext } from "./legal-assistance-contract";

export function normalizedLegalText(text: string) { return text.toLowerCase().replace(/[\u064B-\u065F\u0670]/g, "").replace(/[أإآ]/g, "ا").replace(/ى/g, "ي"); }
const countryAliases: Record<string, string[]> = {
  EG: ["مصر", "المصري", "المصرية", "egypt", "egyptian"], SA: ["السعودية", "السعودي", "saudi arabia", "saudi"],
  AE: ["الامارات", "الاماراتي", "uae", "united arab emirates"], GB: ["بريطانيا", "انجلترا", "england", "united kingdom", "british"],
  US: ["امريكا", "الامريكي", "united states", "usa"], FR: ["فرنسا", "الفرنسي", "france", "french"],
  DE: ["المانيا", "الالماني", "germany", "german"], CA: ["كندا", "الكندي", "canada", "canadian"],
  AU: ["استراليا", "الاسترالي", "australia", "australian"], IN: ["الهند", "الهندي", "india", "indian"]
};
export function legalContextForMessage(previous: LegalContext | undefined, assessment: LegalAssessment | undefined, message: string) {
  const context = legalContextSchema.parse(previous ?? {});
  const text = normalizedLegalText(message.replace(/https?:\/\/\S+|\S+@\S+/g, ""));
  const countries = Object.entries(countryAliases).filter(([, aliases]) => aliases.some(alias => new RegExp(`(?<![\\p{L}\\p{N}])${alias}(?![\\p{L}\\p{N}])`, "u").test(text))).map(([code]) => code);
  if (assessment?.conflict || countries.length > 1) return { context, conflict: true, changed: false };
  const evidence = assessment?.jurisdictionEvidence;
  const claimed = evidence && message.includes(evidence) ? assessment?.jurisdiction : undefined;
  const jurisdiction = countries[0] ?? claimed;
  const changed = !previous || (!!jurisdiction && jurisdiction !== context.jurisdiction);
  const specific: LegalContext["topics"] = [];
  if (/ايصال.*امان[هة]|\btrust receipt\b/.test(text)) specific.push("TRUST_RECEIPT");
  if (/علي بياض|على بياض|\bblank (?:signature|signed|receipt)\b/.test(text)) specific.push("BLANK_SIGNATURE");
  if (/توكيل|\bpower of attorney\b/.test(text)) specific.push("POWER_OF_ATTORNEY");
  return { conflict: false, changed, context: legalContextSchema.parse({
    ...context, ...(jurisdiction ? { jurisdiction, explicit: true } : {}),
    ...(specific.length ? { topics: [...new Set([...specific, ...(assessment?.topics ?? [])])].slice(0, 3) } : assessment?.topics ? { topics: assessment.topics } : {}), ...(assessment?.mode ? { mode: assessment.mode } : {})
  }) };
}

/** Legal conditions/procedures and analysis requests must not be mistaken for account status. */
export function legalSubjectQuestion(text: string) {
  const value = normalizedLegalText(text);
  if (/ايصال.*امان[هة]|ارفع قضي[هة]|رفع قضي[هة]|\b(?:trust receipt|file a (?:claim|case|lawsuit))\b/.test(value)) return true;
  if (/حلل|تحليل|صياغ[هة]|اكتب.*(?:عقد|مذكر[هة]|صحيف[هة])|\b(?:draft|legal analysis)\b/.test(value)) return true;
  if (explicitAccountQuestion(value) && /حالة|اتقبل|وصل لفين|مستندات|ناقص|\b(?:status|accepted|missing)\b/.test(value)) return false;
  return /شروط.*الدعوي|قبول الدعوي|رفع دعوي|عمل توكيل|اعمل توكيل|هل.*قانوني|هل يجوز|هل يحق|ما حكم|حقوقي|الطلاق|الخلع|النفقة|الحضانة|الميراث|فسخ العقد|\b(?:admissibility|power of attorney|is .* legal|divorce|custody|alimony|inheritance|can (?:a landlord|an employer))\b/.test(value);
}
export function explicitAccountQuestion(text: string) {
  return /طلبي|طلباتي|طلب (?:بتاعي|الخاص بي|للمكتب)|فاتورتي|فواتيري|ميعادي|موعدي|مواعيدي|ملفي|ملفاتي|مستنداتي|قضيتي|قضايايا|جلساتي|مدفوعاتي|بياناتي|رصيدي|عليا كام|علي كام|\b(?:owe|my (?:request|filing|booking|invoice|appointment|case|profile|balance|documents?|files?))\b|\b(?:CONS|CONTRACT|HEALTH|CASE|INV|SRV|REQ|SR|KMT)[-_][a-z0-9-]+/i.test(normalizedLegalText(text));
}

/** Correcting reported dialogue facts is not a command to edit an account record. */
export function legalFactCorrection(text: string) {
  return !explicitAccountQuestion(text) && /^(?:تصحيح(?:\s|:)|اصحح\s|تصحيحا\s|correction\b|to correct\b|let me correct\b)/i.test(normalizedLegalText(text).trim());
}
