import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("auth audit contract", () => {
  it("keeps staff 2FA reset behind permission and audit logging", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "src", "server", "auth", "auth-service.ts"), "utf8");

    expect(source).toContain("twoFactor.reset.staff");
    expect(source).toContain("auth.2fa_reset");
    expect(source).toContain("resourceType: \"User\"");
  });
});
