import { expect, it } from "vitest";
import { rememberLegalMessage, rememberLegalQuestion } from "@/server/ai/legal-memory";
import { legalContextSchema } from "@/server/ai/legal-assistance-contract";
import { legalContextForMessage } from "@/server/ai/legal-context";
import { legalResearchQuery } from "@/server/ai/providers/legal-research";
const context = legalContextSchema.parse({ topics: ["TRUST_RECEIPT"] });
it("marks a truncated fallback as bounded even when the model proposed an invalid quote", () => {
  const memory = rememberLegalMessage(undefined, { messageId: crypto.randomUUID(), message: "تفاصيل ".repeat(100), context, quotes: ["invented"] });
  expect(memory.bounded).toBe(true);
  expect(memory.statements[0].quote).toHaveLength(400);
});
it("retains attributed opening facts, later corrections and the pending question beyond four exchanges", () => {
  const first = crypto.randomUUID();
  let memory = rememberLegalMessage(undefined, { messageId: first, message: "الإيصال على بياض", context, quotes: ["الإيصال على بياض", "invented fact"] });
  for (let i = 0; i < 8; i++) memory = rememberLegalMessage(memory, { messageId: crypto.randomUUID(), message: `متابعة ${i}`, context });
  const correction = crypto.randomUUID();
  memory = rememberLegalMessage(memory, { messageId: correction, message: "تصحيح: الموقّع لم يستلم مالًا", context });
  memory = rememberLegalQuestion(memory, correction, "هل تم ملء البيانات بعد التوقيع؟");
  expect(memory.statements[0]).toMatchObject({ messageId: first, quote: "الإيصال على بياض" });
  expect(memory.statements.at(-1)).toMatchObject({ messageId: correction, quote: "تصحيح: الموقّع لم يستلم مالًا" });
  expect(JSON.stringify(memory)).not.toContain("invented fact");
  expect(memory.pendingQuestion?.text).toBe("هل تم ملء البيانات بعد التوقيع؟");
});
it("searches specific controlled concepts without customer identifiers", () => {
  const result = legalContextForMessage(undefined, { topics: ["CRIMINAL"] }, "معايا إيصال أمانة على بياض باسم أحمد 01012345678 private@example.com");
  const query = legalResearchQuery({ ...result.context, locale: "ar" });
  expect(query).toContain("إيصال الأمانة"); expect(query).toContain("التوقيع على بياض");
  expect(query).not.toMatch(/أحمد|010123|private/);
});
