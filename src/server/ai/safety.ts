import type { AISafetyPolicy, AITask } from "./types";

export const DEFAULT_AI_SAFETY_POLICY: AISafetyPolicy = {
  requireHumanReview: true,
  prohibitLegalAdvice: true,
  redactBeforeLogging: true
};

export function mergeSafetyPolicy(policy?: Partial<AISafetyPolicy>): AISafetyPolicy {
  return {
    ...DEFAULT_AI_SAFETY_POLICY,
    ...policy,
    requireHumanReview: true,
    prohibitLegalAdvice: true,
    redactBeforeLogging: true
  };
}

export function assertNoFinalLegalAdviceText(task: AITask, output: unknown) {
  return generatedTextForTask(task, output).every((text) => !containsProhibitedLegalClaim(text));
}

function containsProhibitedLegalClaim(text: string) {
  const clauses = text.toLowerCase().split(/[.!?;\n،؛]+/u);
  return clauses.some((clause) => {
    const claimsOnly = removeExplicitSafetyDisclaimers(clause);
    return PROHIBITED_LEGAL_CLAIMS.some((pattern) => pattern.test(claimsOnly));
  });
}

function removeExplicitSafetyDisclaimers(clause: string) {
  return clause
    .replace(/\b(?:this\s+)?(?:is\s+)?not(?:\s+intended\s+as)?\s+(?:final\s+)?legal advice\b/giu, "")
    .replace(/\b(?:not|isn't|is not)\s+(?:a\s+)?guaranteed outcome\b/giu, "")
    .replace(/(?:ليست|ليس)\s+(?:هذه\s+)?استشارة قانونية نهائية/gu, "")
    .replace(/لا\s+(?:تعد|تُعد|تمثل|تُمثل)\s+(?:هذه\s+)?استشارة قانونية نهائية/gu, "")
    .replace(/لا\s+أ?ضمن/gu, "");
}

const PROHIBITED_LEGAL_CLAIMS = [
  /\bthis is (?:final )?legal advice\b/iu,
  /\bfinal legal advice\b/iu,
  /\bguaranteed outcome\b/iu,
  /\b(?:i guarantee|guaranteed to win|you will definitely win)\b/iu,
  /\b(?:you should|i advise you to|my legal advice is to)\s+(?:sue|file|appeal|sign|refuse|pay|settle|terminate|accept|reject|plead|admit|deny)\b/iu,
  /استشارة قانونية نهائية/iu,
  /(?:أضمن|اضمن|نتيجة مضمونة|مضمون أنك)/iu,
  /(?:أنصحك|يجب عليك)\s+(?:رفع|تقديم|التوقيع|رفض|دفع|التسوية|إنهاء|قبول|الطعن)/iu
];

function generatedTextForTask(task: AITask, output: unknown) {
  const record = objectRecord(output);
  if (!record) return [];

  switch (task) {
    case "booking_intake_extraction":
      return stringsFrom(record.clarifyingQuestion, record.reviewNote);
    case "consultation_classification":
      return stringsFrom(record.reasons, record.reviewNote);
    case "consultation_assistant":
      return stringsFrom(record.message, record.reviewNote);
    case "intake_summary":
      return stringsFrom(record.summary, record.keyFacts, record.missingInfo, record.reviewNote);
    case "document_checklist_suggestion":
      return stringsFrom(record.items, record.reviewNote);
    case "anonymous_case_study_draft":
      return stringsFrom(record.title, record.draft, record.anonymizationChecklist, record.reviewNote);
    case "social_post_draft":
      return stringsFrom(record.content, record.reviewNote);
  }
}

function stringsFrom(...values: unknown[]): string[] {
  return values.flatMap((value) => {
    if (typeof value === "string") return [value];
    if (Array.isArray(value)) return stringsFrom(...value);
    const record = objectRecord(value);
    return record ? stringsFrom(...Object.values(record)) : [];
  });
}

function objectRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}
