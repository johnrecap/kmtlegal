import { describe, expect, it } from "vitest";
import { normalizeText } from "@/lib/normalize-text";

describe("normalizeText", () => {
  it("folds Arabic letter variants so casual typing still matches content", () => {
    expect(normalizeText("قانونية")).toBe(normalizeText("قانونيه"));
    expect(normalizeText("إعداد العقد")).toBe(normalizeText("اعداد العقد"));
    expect(normalizeText("الأحكام")).toBe(normalizeText("الاحكام"));
    expect(normalizeText("مؤسسة")).toBe(normalizeText("موسسه"));
  });

  it("strips Arabic diacritics and Latin accents", () => {
    expect(normalizeText("مُحَامُون")).toBe(normalizeText("محامون"));
    expect(normalizeText("café")).toBe("cafe");
  });

  it("strips tatweel and zero-width direction marks", () => {
    expect(normalizeText("عــقد")).toBe(normalizeText("عقد"));
    expect(normalizeText("عقد\u200f")).toBe(normalizeText("عقد"));
  });

  it("lowercases Latin text and collapses whitespace", () => {
    expect(normalizeText("  Corporate   LAW ")).toBe("corporate law");
    expect(normalizeText("Real Estate")).toBe("real estate");
  });
});
