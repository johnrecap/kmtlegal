import { z } from "zod";
import { parseWithSchema } from "@/server/validation/schemas";

const SMTP_FEATURE_AVAILABLE: boolean = false;

export const smtpConfigSchema = z.object({
  host: z.string().min(1),
  port: z.coerce.number().int().min(1).max(65535).default(587),
  user: z.string().optional(),
  password: z.string().optional(),
  from: z.string().email(),
  secure: z
    .union([z.boolean(), z.string()])
    .transform((value) => value === true || value === "true")
    .default(false)
});

export type SmtpConfig = z.infer<typeof smtpConfigSchema>;

export function getEmailMode(): "disabled" | "dev" | "smtp" {
  if (!isSmtpEnabled()) {
    return "disabled";
  }

  return process.env.APP_ENV === "local" || process.env.NODE_ENV !== "production" ? "dev" : "smtp";
}

export function isSmtpEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return SMTP_FEATURE_AVAILABLE && env.SMTP_ENABLED === "true";
}

export function isSmtpFeatureAvailable() {
  return SMTP_FEATURE_AVAILABLE;
}

export function getSmtpConfig() {
  return parseWithSchema(
    smtpConfigSchema,
    {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_USER || undefined,
      password: process.env.SMTP_PASSWORD || undefined,
      from: process.env.SMTP_FROM,
      secure: process.env.SMTP_SECURE ?? false
    },
    "SMTP configuration is invalid."
  );
}
