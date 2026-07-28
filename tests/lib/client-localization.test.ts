import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  clientContent,
  clientErrorMessage,
  normalizeClientLocale
} from "@/content/client-content";
import { getAuthContent } from "@/content/auth-content";
import { formatDate, formatDateTime, formatMoney } from "@/lib/legal-format";

function paths(value: unknown, prefix = ""): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((entry, index) => paths(entry, `${prefix}[${index}]`));
  }
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, entry]) => paths(entry, prefix ? `${prefix}.${key}` : key));
  }
  return [prefix];
}

describe("client localization contract", () => {
  it("normalizes unsupported and existing-account locales to Arabic", () => {
    expect(normalizeClientLocale("en")).toBe("en");
    expect(normalizeClientLocale("ar")).toBe("ar");
    expect(normalizeClientLocale("fr")).toBe("ar");
    expect(normalizeClientLocale(null)).toBe("ar");
  });

  it("keeps Arabic and English catalogs structurally identical", () => {
    expect(paths(clientContent.en).sort()).toEqual(paths(clientContent.ar).sort());
    expect(paths(getAuthContent("en")).sort()).toEqual(paths(getAuthContent("ar")).sort());
  });

  it("formats dates, date-times, and money in the selected language", () => {
    const date = new Date("2026-07-28T10:30:00.000Z");
    expect(formatDate(date, "en")).toMatch(/Jul|2026/);
    expect(formatDate(date, "ar")).not.toBe(formatDate(date, "en"));
    expect(formatDateTime(date, "en")).toMatch(/2026/);
    expect(formatMoney(1250, "EGP", "en")).toMatch(/1,250|1٬250/);
    expect(formatMoney(1250, "EGP", "ar")).not.toBe(formatMoney(1250, "EGP", "en"));
  });

  it("maps stable client error codes without exposing internal messages", () => {
    expect(clientErrorMessage("en", "PERMISSION_DENIED")).toContain("permission");
    expect(clientErrorMessage("ar", "SERVER_ERROR")).toContain("خطأ");
    expect(clientErrorMessage("en", "UNKNOWN_CODE")).toBe(clientContent.en.errors.fallback);
  });

  it("keeps visible client copy out of route and interactive component source", () => {
    const files = [
      "src/components/layout/client-site-shell.tsx",
      "src/features/client/client-assistant-panel.tsx",
      "src/features/client/client-team-chat-panel.tsx",
      "src/features/portal/document-upload-form.tsx",
      "src/features/portal/profile-form.tsx",
      "src/features/auth/login-form.tsx"
    ];
    for (const file of files) {
      const source = readFileSync(join(process.cwd(), file), "utf8");
      expect(source, file).not.toMatch(/[\u0600-\u06ff]/);
    }
  });
});
