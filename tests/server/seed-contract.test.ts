import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const seedPath = path.join(process.cwd(), "prisma", "seed.mjs");

describe("database seed contract", () => {
  it("uses rerunnable write patterns for demo records", () => {
    const source = fs.readFileSync(seedPath, "utf8");

    expect(source).toContain("prisma.role.upsert");
    expect(source).toContain("prisma.permission.upsert");
    expect(source).toContain("prisma.user.upsert");
    expect(source).toContain("findOrCreate(");
    expect(source.match(/\.upsert\(/g)?.length ?? 0).toBeGreaterThanOrEqual(10);
  });

  it("keeps seed data fake and readable in Arabic", () => {
    const source = fs.readFileSync(seedPath, "utf8");

    expect(source).toContain("@kmt.local");
    expect(source).toContain("محكمة القاهرة الاقتصادية");
    expect(source).toContain("صياغة ومراجعة العقود");
    expect(source).not.toContain("ظ…");
    expect(source).not.toContain("ط§ظ");
  });
  it("keeps production bootstrap separate from local demo data", () => {
    const source = fs.readFileSync(seedPath, "utf8");

    expect(source).toContain("Production seed must not receive demo credentials.");
    expect(source).toContain("Production bootstrap completed");
    expect(source).toContain("if (isProduction)");
    expect(source).toContain("ensureSeedDocumentFile");
    expect(source).toContain('path.join(root, "_workspace", "uploads")');
  });
});
