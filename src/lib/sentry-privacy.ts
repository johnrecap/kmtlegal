const sensitiveKeys = /authorization|cookie|password|secret|token|email|phone|address|prompt|message|content|document|file|body|payload/i;
const urlKeys = /url|href|callback|checkout|receipt/i;
const emailValue = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const phoneValue = /(?<!\w)\+?\d(?:[\s().-]*\d){8,14}(?!\w)/g;

export function scrubSentryEvent<T extends object>(event: T): T {
  const scrubbed = redactValue(event, 0) as T & Record<string, unknown>;
  delete scrubbed.user;

  const request = scrubbed.request;
  if (request && typeof request === "object" && !Array.isArray(request)) {
    const safeRequest = request as Record<string, unknown>;
    delete safeRequest.data;
    delete safeRequest.cookies;
    delete safeRequest.headers;
    if (typeof safeRequest.url === "string") {
      safeRequest.url = safeRequest.url.split("?", 1)[0];
    }
  }

  return scrubbed;
}

function redactValue(value: unknown, depth: number): unknown {
  if (depth > 8) return "[TRUNCATED]";
  if (typeof value === "string") return redactString(value);
  if (Array.isArray(value)) return value.slice(0, 50).map((entry) => redactValue(entry, depth + 1));
  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
      key,
      sensitiveKeys.test(key)
        ? "[REDACTED]"
        : urlKeys.test(key) && typeof entry === "string"
          ? stripUrlQuery(entry)
          : redactValue(entry, depth + 1)
    ])
  );
}

function redactString(value: string) {
  return value.replace(emailValue, "[REDACTED_EMAIL]").replace(phoneValue, "[REDACTED_PHONE]");
}

function stripUrlQuery(value: string) {
  const queryIndex = value.search(/[?#]/);
  return redactString(queryIndex === -1 ? value : value.slice(0, queryIndex));
}
