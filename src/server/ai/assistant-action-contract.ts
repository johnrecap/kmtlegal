import { z } from "zod";
import { portalProfileUpdateSchema } from "@/server/portal/client-portal-service";
import { intakeSchema } from "@/server/services/service-request-service";
import { phoneSchema } from "@/server/phone/phone-schema";

// Deliberately excludes identity, permissions, revisions, payment settlement and administrative actions.
export const assistantActionDraftSchema = z.discriminatedUnion("kind", [
  z.strictObject({ kind: z.literal("PROFILE"), changes: portalProfileUpdateSchema.partial().strict() }),
  z.strictObject({ kind: z.literal("PREFERENCE"), locale: z.enum(["ar", "en"]) }),
  z.strictObject({ kind: z.literal("SERVICE_CREATE"), service: z.enum(["CONTRACT_DRAFT", "CONTRACT_REVIEW", "HEALTH_CHECK"]) }),
  z.strictObject({ kind: z.literal("OFFICE_MESSAGE"), targetId: z.string().uuid().optional(), message: z.string().trim().min(1).max(2000) }),
  z.strictObject({ kind: z.literal("ALTERNATIVE_TIME"), targetId: z.string().uuid().optional(), startsAt: z.iso.datetime(), mode: z.enum(["PHONE", "ONLINE", "OFFICE"]) }),
  z.strictObject({ kind: z.literal("BOOKING"), operation: z.enum(["confirm_booking", "reschedule_booking", "cancel_booking", "request_callback"]), fullName: z.string().trim().min(2).max(160).optional(), phone: phoneSchema.optional(), contactChannel: z.enum(["PHONE", "WHATSAPP"]).optional(), startsAt: z.iso.datetime().optional() }),
  z.strictObject({ kind: z.literal("SERVICE"), targetId: z.string().uuid().optional(), operation: z.enum(["save", "submit", "accept", "changes", "cancel", "message"]), intake: intakeSchema.omit({ formation: true }).optional(), message: z.string().trim().min(1).max(2000).optional() })
]);
export type AssistantActionDraft = z.infer<typeof assistantActionDraftSchema>;
export function actionRequest(text: string) {
  return /(?:عدل|عدّل|غير|غيّر|حدث|حدّث|ارسل|أرسل|ابعت|جهز|جهّز|احفظ|وافق|اقبل|ألغي|الغي|الغاء|انشئ|أنشئ|افتح طلب|\b(?:update|change|save|send|prepare|reschedule|submit|accept|cancel|create)\b)/i.test(text);
}
