const SENSITIVE_KEY_PATTERN =
  /(password|pass|secret|token|cookie|authorization|api[-_]?key|otp|totp|smtp|prompt|document|content|summary|caseSummary|legalSummary|rawResponse|rawPrompt|email|phone|mobile|address|message|fullName|clientName|first[-_]?name|last[-_]?name|billing[-_]?data|customer|contact|url|uri|href|location|redirect|callback|checkout|receipt)/i;

const MAX_SAFE_STRING_LENGTH = 240;
const EMAIL_VALUE_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PHONE_VALUE_PATTERN = /\+?\d[\d\s().-]{8,}\d/g;
const SAFE_OPAQUE_IDENTIFIER_PATTERN = /^[A-Z0-9._:-]{1,160}$/i;

export type RedactableJson =
  | null
  | string
  | number
  | boolean
  | RedactableJson[]
  | { [key: string]: RedactableJson | undefined };

export function redactMetadata(value: unknown): RedactableJson {
  return redactValue(value, 0);
}

function redactValue(value: unknown, depth: number): RedactableJson {
  if (depth > 8) {
    return "[REDACTED_DEPTH]";
  }

  if (value === null || typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return redactString(value);
  }

  if (Array.isArray(value)) {
    return value.map((entry) => redactValue(entry, depth + 1));
  }

  if (typeof value === "object") {
    const output: Record<string, RedactableJson> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      const safeProviderCheckoutId =
        key === "providerCheckoutId" &&
        typeof entry === "string" &&
        SAFE_OPAQUE_IDENTIFIER_PATTERN.test(entry);
      output[key] = SENSITIVE_KEY_PATTERN.test(key) && !safeProviderCheckoutId
        ? "[REDACTED]"
        : redactValue(entry, depth + 1);
    }
    return output;
  }

  return String(value);
}

function redactString(value: string) {
  const redacted = value
    .replace(EMAIL_VALUE_PATTERN, "[REDACTED_EMAIL]")
    .replace(PHONE_VALUE_PATTERN, (match) => {
      const digits = match.replace(/\D/g, "");
      return digits.length >= 10 && digits.length <= 15 ? "[REDACTED_PHONE]" : match;
    });

  return redacted.length > MAX_SAFE_STRING_LENGTH ? `${redacted.slice(0, MAX_SAFE_STRING_LENGTH)}...` : redacted;
}
