import crypto from "node:crypto";
import nodemailer from "nodemailer";
import { ApiError } from "@/server/http/errors";
import { getEmailMode, getSmtpConfig } from "./config";
import { emailRecipientSchema, renderEmailTemplate, type EmailTemplateKey } from "./templates";
import { parseWithSchema } from "@/server/validation/schemas";

export type SendEmailInput = {
  to: unknown;
  templateKey: EmailTemplateKey;
  data: unknown;
};

export type SendEmailResult = {
  mode: "disabled" | "dev" | "smtp";
  providerMessageId?: string;
  templateKey: EmailTemplateKey;
  toEmailHash: string;
};

export async function sendTemplatedEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const recipient = parseWithSchema(emailRecipientSchema, input.to, "Email recipient is invalid.");
  const rendered = renderEmailTemplate(input.templateKey, input.data);
  const toEmailHash = hashEmailAddress(recipient.email);
  const mode = getEmailMode();

  if (mode === "disabled") {
    return {
      mode,
      templateKey: input.templateKey,
      toEmailHash
    };
  }

  if (mode === "dev") {
    return {
      mode,
      templateKey: input.templateKey,
      toEmailHash
    };
  }

  const config = getSmtpConfig();
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.user && config.password ? { user: config.user, pass: config.password } : undefined
  });

  try {
    const info = await transporter.sendMail({
      from: config.from,
      to: recipient.email,
      subject: rendered.subject,
      text: rendered.text
    });

    return {
      mode,
      providerMessageId: info.messageId,
      templateKey: input.templateKey,
      toEmailHash
    };
  } catch {
    throw new ApiError(502, "EMAIL_DELIVERY_FAILED", "Email delivery failed.");
  }
}

export function hashEmailAddress(email: string) {
  return crypto
    .createHash("sha256")
    .update(email.trim().toLowerCase())
    .digest("hex");
}
