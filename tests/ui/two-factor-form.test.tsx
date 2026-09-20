import React from "react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { TwoFactorForm } from "@/features/auth/two-factor-form";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => ({ get: () => null })
}));

describe("staff two-factor form presentation (TASK 04)", () => {
  it("renders the verification shell without external assets", () => {
    const html = renderToStaticMarkup(<TwoFactorForm locale="ar" next={null} />);
    expect(html).toContain("التحقق الثنائي");
    expect(html).not.toContain("<img");
    expect(html).not.toContain("qrcode");
  });

  it("keeps the code field paste-friendly with leading zeros and kit submission", () => {
    const source = readFileSync(join(process.cwd(), "src/features/auth/two-factor-form.tsx"), "utf8");
    expect(source).toContain('autoComplete="one-time-code"');
    expect(source).toContain('inputMode="numeric"');
    expect(source).toContain('type="text"');
    expect(source).not.toContain('type="number"');
    expect(source).toContain("StatefulButton");
    expect(source).toContain("InlineFeedback");
    expect(source).toContain("/api/auth/2fa/totp/enroll/confirm");
    expect(source).toContain("/api/auth/2fa/totp/verify");
    expect(source).not.toMatch(/console\.(log|info|debug)/);
  });
});
