import { z } from "zod";
import { ApiError } from "@/server/http/errors";

export class ConversationRateLimitError extends ApiError {
  constructor(public readonly retryAfterMs: number | null, public readonly retryable: boolean) {
    super(429, "RATE_LIMITED", "AI provider rate limit reached.");
  }
}

const quotaViolationSchema = z.object({
  quotaId: z.string().optional(),
  quotaValue: z.union([z.string(), z.number()]).optional()
});
const rateLimitEnvelopeSchema = z.object({ error: z.object({ details: z.array(z.object({
  "@type": z.string(), retryDelay: z.string().optional(),
  violations: z.array(quotaViolationSchema).optional()
})).optional() }) });

function headerRetryDelay(header: string | null, now: number): number | null {
  if (header === null || !header.trim()) return null;
  const trimmed = header.trim();
  if (/^\d+$/.test(trimmed)) {
    const milliseconds = Number(trimmed) * 1000;
    return Number.isFinite(milliseconds) ? milliseconds : null;
  }
  // Numeric negatives/decimals are not HTTP dates.
  if (/^[+-]?\d+(?:\.\d+)?$/.test(trimmed)) return null;
  const timestamp = Date.parse(trimmed);
  return Number.isFinite(timestamp) ? Math.max(0, timestamp - now) : null;
}

function googleRetryDelay(duration: string | undefined): number | null {
  if (!duration || !/^\d+(?:\.\d{1,9})?s$/.test(duration)) return null;
  const milliseconds = Number(duration.slice(0, -1)) * 1000;
  return Number.isFinite(milliseconds) ? Math.ceil(milliseconds) : null;
}

export function conversationRateLimitError(headers: Headers, rawBody: string): ConversationRateLimitError {
  let envelope: unknown;
  try { envelope = JSON.parse(rawBody); } catch { envelope = null; }
  const parsed = rateLimitEnvelopeSchema.safeParse(Array.isArray(envelope) ? envelope[0] : envelope);
  const details = parsed.success ? parsed.data.error.details ?? [] : [];
  const delays = [headerRetryDelay(headers.get("Retry-After"), Date.now()), ...details
    .filter(detail => detail["@type"] === "type.googleapis.com/google.rpc.RetryInfo")
    .map(detail => googleRetryDelay(detail.retryDelay))].filter((delay): delay is number => delay !== null);
  const terminalQuota = details.filter(detail => detail["@type"] === "type.googleapis.com/google.rpc.QuotaFailure")
    .some(detail => detail.violations?.some(violation =>
      /PerDay|Daily/i.test(violation.quotaId ?? "") ||
      (violation.quotaValue !== undefined && String(violation.quotaValue).trim() !== "" && Number(violation.quotaValue) === 0)));
  return new ConversationRateLimitError(delays.length ? Math.max(...delays) : null, !terminalQuota);
}
