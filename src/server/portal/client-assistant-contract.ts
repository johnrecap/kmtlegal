import { z } from "zod";

export const assistantRecordKind = z.enum(["CONSULTATION", "SERVICE_REQUEST", "CASE", "HEARING", "APPOINTMENT", "DOCUMENT", "PAYMENT", "CONVERSATION", "PROFILE"]);
export const assistantCategory = z.enum(["REQUESTS", "CONSULTATION", "SERVICE_REQUEST", "CASE", "HEARING", "APPOINTMENT", "DOCUMENT", "PAYMENT", "CONVERSATION", "PROFILE"]);
export const assistantRecordRef = z.strictObject({ kind: assistantRecordKind, id: z.string().uuid() });
export const assistantCursor = z.strictObject({ at: z.iso.datetime(), id: z.string().uuid(), kind: assistantRecordKind });
export const assistantFocus = z.strictObject({
  category: assistantCategory, selected: assistantRecordRef.optional(),
  choices: z.array(assistantRecordRef).max(5).optional(), cursor: assistantCursor.optional()
});
export type RecordKind = z.infer<typeof assistantRecordKind>;
export type Category = z.infer<typeof assistantCategory>;
export type RecordRef = z.infer<typeof assistantRecordRef>;
export type RecordCursor = z.infer<typeof assistantCursor>;
export type FollowupFocus = z.infer<typeof assistantFocus>;
export type ClientRecord = RecordRef & {
  reference: string; title: string; status: string; updatedAt: string;
  facts: Array<{ label: string; value: string }>;
};
export type ClientRecordPage = { records: ClientRecord[]; hasMore: boolean; cursor?: RecordCursor };
