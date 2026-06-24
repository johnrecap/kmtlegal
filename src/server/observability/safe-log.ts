import { redactMetadata } from "@/server/audit/redaction";

export type SafeLogLevel = "info" | "warn" | "error";

export function safeLog(level: SafeLogLevel, event: string, metadata: unknown = {}) {
  const payload = {
    event,
    metadata: redactMetadata(metadata),
    environment: process.env.APP_ENV || process.env.NODE_ENV || "local",
    release: process.env.APP_RELEASE || null
  };

  const line = JSON.stringify(payload);
  if (level === "error") {
    console.error(line);
    return;
  }
  if (level === "warn") {
    console.warn(line);
    return;
  }
  console.info(line);
}
