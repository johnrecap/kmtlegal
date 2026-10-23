import { z } from "zod";
import type { LegalContext } from "./legal-assistance-contract";

export const legalMemorySchema = z.object({
  version: z.literal(1),
  statements: z.array(z.object({
    messageId: z.string().uuid(), quote: z.string().min(1).max(400),
    jurisdiction: z.string().length(2), topics: z.array(z.string()).max(3)
  })).max(60),
  pendingQuestion: z.object({ messageId: z.string().uuid(), text: z.string().max(500) }).optional(),
  bounded: z.boolean().default(false)
});
export type LegalMemory = z.infer<typeof legalMemorySchema>;

/** Quotes are customer statements, never verified legal/account facts. Keep corrections
 * chronologically alongside their originals; a model cannot silently rewrite evidence. */
export function rememberLegalMessage(previous: LegalMemory | undefined, input: {
  messageId: string; message: string; context: LegalContext; quotes?: string[];
}): LegalMemory {
  const memory = legalMemorySchema.parse(previous ?? { version: 1, statements: [] });
  const quotes = [...new Set(input.quotes ?? [])].filter(q => q.trim() && q.length <= 400 && input.message.includes(q));
  const truncatedFallback = !quotes.length && input.message.length > 400;
  if (!quotes.length) quotes.push(input.message.slice(0, 400));
  const statements = [...memory.statements.filter(s => s.messageId !== input.messageId), ...quotes.slice(0, 3).map(quote => ({
    messageId: input.messageId, quote, jurisdiction: input.context.jurisdiction, topics: input.context.topics
  }))];
  // Pin the opening facts, preserve recent corrections; full originals remain in AssistantTurn.
  return { version: 1, pendingQuestion: memory.pendingQuestion, statements: statements.length > 60 ? [...statements.slice(0, 15), ...statements.slice(-45)] : statements,
    bounded: memory.bounded || statements.length > 60 || truncatedFallback };
}

export function rememberLegalQuestion(memory: LegalMemory, messageId: string, answer: string): LegalMemory {
  const question = answer.match(/[^\n.!؟?]*[؟?]/g)?.at(-1)?.trim();
  return { ...memory, pendingQuestion: question ? { messageId, text: question.slice(0, 500) } : undefined };
}
