import { z } from "zod";
import type { LegalSource } from "@/lib/legal-assistant";

// Controlled concepts make the search boundary independent of private customer prose.
export const legalTopics = {
  GENERAL: ["القواعد والإجراءات القانونية", "legal principles and procedures"],
  TRUST_RECEIPT: ["إيصال الأمانة وتسليم المال وخيانة الأمانة", "trust receipt actual delivery of money breach of trust"],
  BLANK_SIGNATURE: ["التوقيع على بياض وملء البيانات وخيانة الائتمان على التوقيع", "blank signature completion of signed document abuse of entrusted signature"],
  POWER_OF_ATTORNEY: ["التوكيل وحدود الوكالة وإلغاؤها", "power of attorney scope and revocation of agency"],
  DIVORCE: ["الطلاق والخلع", "divorce and dissolution of marriage"],
  CUSTODY: ["حضانة الأطفال والرؤية", "child custody and access"],
  ALIMONY: ["النفقة", "maintenance and alimony"],
  INHERITANCE: ["الميراث والوصايا", "inheritance and wills"],
  MARRIAGE: ["الزواج والأحوال الشخصية", "marriage and family law"],
  EMPLOYMENT: ["عقود العمل وحقوق العمال", "employment contracts and workers rights"],
  DISMISSAL: ["الفصل من العمل والتعويض", "employment dismissal and compensation"],
  WAGES: ["الأجور والإجازات", "wages and leave"],
  RENT: ["الإيجارات والإخلاء", "tenancy and eviction"],
  PROPERTY_SALE: ["البيع العقاري", "property sale"],
  PROPERTY_REGISTRATION: ["التسجيل العقاري والشهر العقاري والتوكيلات", "property registration and powers of attorney"],
  CONTRACTS: ["العقود والالتزامات", "contracts and obligations"],
  CONTRACT_TERMINATION: ["فسخ العقود والتعويض", "contract termination and damages"],
  CONSUMER: ["حماية المستهلك", "consumer protection"],
  CRIMINAL: ["الجرائم والعقوبات", "criminal offences and penalties"],
  CRIMINAL_PROCEDURE: ["الإجراءات الجنائية", "criminal procedure"],
  CIVIL_PROCEDURE: ["المرافعات وشروط قبول الدعوى", "civil procedure and admissibility"],
  APPEALS: ["الطعن والاستئناف والنقض", "appeals and cassation"],
  LIMITATION: ["التقادم والمواعيد القانونية", "limitation periods and legal deadlines"],
  ENFORCEMENT: ["تنفيذ الأحكام والحجز", "judgment enforcement and attachment"],
  EVIDENCE: ["الإثبات والشهادة", "evidence and witnesses"],
  COMPANIES: ["قانون الشركات", "company law"],
  COMPANY_FORMATION: ["تأسيس الشركات والاستثمار", "company formation and investment"],
  COMMERCIAL: ["التجارة والشيكات", "commercial law and cheques"],
  TAX: ["الضرائب", "tax law"], VAT: ["ضريبة القيمة المضافة", "value added tax"],
  ADMINISTRATIVE: ["القانون الإداري والقرارات الإدارية", "administrative law and decisions"],
  CONSTITUTIONAL: ["الدستور والحقوق الدستورية", "constitutional law and rights"],
  IP: ["الملكية الفكرية والعلامات التجارية", "intellectual property and trademarks"],
  CYBERCRIME: ["جرائم تقنية المعلومات", "cybercrime"], PRIVACY: ["حماية البيانات الشخصية", "personal data protection"],
  IMMIGRATION: ["الإقامة والهجرة والجنسية", "immigration residence and nationality"],
  INSURANCE: ["التأمين", "insurance law"], BANKING: ["البنوك والتمويل", "banking and finance law"],
  BANKRUPTCY: ["الإفلاس وإعادة الهيكلة", "bankruptcy and restructuring"], ARBITRATION: ["التحكيم والوساطة", "arbitration and mediation"],
  SOCIAL_INSURANCE: ["التأمينات الاجتماعية والمعاشات", "social insurance and pensions"],
  HEALTHCARE: ["المسؤولية الطبية", "medical liability"], TRAFFIC: ["المرور وحوادث الطرق", "traffic and road accidents"]
} as const;
export const legalTopicSchema = z.enum(Object.keys(legalTopics) as [keyof typeof legalTopics, ...(keyof typeof legalTopics)[]]);
export const legalModeSchema = z.enum(["EXPLANATION", "ANALYSIS", "DRAFT"]);
const country = z.string().regex(/^[A-Z]{2}$/);
export const legalContextSchema = z.strictObject({
  jurisdiction: country.default("EG"), explicit: z.boolean().default(false),
  topics: z.array(legalTopicSchema).min(1).max(3).default(["GENERAL"]), mode: legalModeSchema.default("EXPLANATION"), useSelectedRecord: z.boolean().default(false)
});
export const legalAssessmentSchema = z.strictObject({
  jurisdiction: country.optional(), jurisdictionEvidence: z.string().max(120).optional(),
  conflict: z.boolean().optional(), topics: z.array(legalTopicSchema).min(1).max(3).optional(), mode: legalModeSchema.optional()
});
export type LegalContext = z.infer<typeof legalContextSchema>;
export type LegalAssessment = z.infer<typeof legalAssessmentSchema>;
export type LegalResearchInput = { jurisdiction: string; topics: LegalContext["topics"]; locale: "ar" | "en"; requestId: string; signal?: AbortSignal };
export type ResearchedLegalSource = LegalSource & { excerpt: string };
export type LegalResearchResult = { status: "AVAILABLE" | "UNAVAILABLE" | "INSUFFICIENT"; sources: ResearchedLegalSource[] };

export const legalReplySchema = z.strictObject({
  answer: z.string().trim().min(1).max(10_000), sourceIds: z.array(z.string().regex(/^S[1-5]$/)).max(5)
});
export const legalReviewSchema = z.strictObject({
  inScope: z.boolean(), grounded: z.boolean(), noFalseCurrentLaw: z.boolean(), factsAccurate: z.boolean(),
  noExternalReferrals: z.boolean(), noGuarantees: z.boolean(), draftMarked: z.boolean(), noFalseActionClaim: z.boolean(),
  corrections: z.array(z.string().trim().min(1).max(240)).max(3).optional()
});
