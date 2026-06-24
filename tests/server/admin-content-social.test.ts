import { describe, expect, it } from "vitest";
import {
  adminArticleWriteSchema,
  adminCaseStudyWriteSchema,
  adminSocialAiDraftSchema,
  adminSocialDraftWriteSchema,
  assertArticleStatusAllowed,
  assertCaseStudyIsPublicSafe,
  assertCaseStudyStatusAllowed,
  assertSocialDraftStatusAllowed,
  canAccessContentHub,
  canApproveArticles,
  canApproveCaseStudies,
  canApproveSocialDrafts,
  canCreateArticles,
  canCreateCaseStudies,
  canCreateSocialDrafts,
  normalizeSocialDraftScheduledAt
} from "@/server/admin/content-social-service";
import { ROLES, type Principal } from "@/server/auth/policy";
import { ApiError } from "@/server/http/errors";

const marketing: Principal = {
  id: "11111111-1111-4111-8111-111111111111",
  roleName: ROLES.marketingStaff,
  permissions: ["content.create.any", "caseStudy.create.any", "socialDraft.create.any"]
};

const superAdmin: Principal = {
  id: "22222222-2222-4222-8222-222222222222",
  roleName: ROLES.superAdmin,
  permissions: ["*"]
};

const officeAdmin: Principal = {
  id: "33333333-3333-4333-8333-333333333333",
  roleName: ROLES.officeAdmin,
  permissions: ["client.read.any", "case.read.any"]
};

const safeCaseStudy = {
  title: "Anonymous contract negotiation pattern",
  slug: "anonymous-contract-negotiation-pattern",
  category: "Contracts",
  challenge: "A commercial team needed a safer negotiation path without exposing names or private facts.",
  approach: "The legal team mapped risks, reviewed clauses, and documented neutral steps for the client team.",
  generalOutcome: "The matter reached a general operational improvement without promising a legal result.",
  lessons: "Early document review and scoped communication reduced uncertainty for future negotiations.",
  status: "PUBLISHED",
  isAnonymized: true,
  publishedAt: "2026-06-24"
};

describe("admin content and social hub contract", () => {
  it("separates content creation permissions from approval permissions", () => {
    expect(canAccessContentHub(marketing)).toBe(true);
    expect(canCreateArticles(marketing)).toBe(true);
    expect(canCreateCaseStudies(marketing)).toBe(true);
    expect(canCreateSocialDrafts(marketing)).toBe(true);
    expect(canApproveArticles(marketing)).toBe(false);
    expect(canApproveCaseStudies(marketing)).toBe(false);
    expect(canApproveSocialDrafts(marketing)).toBe(false);

    expect(canApproveArticles(superAdmin)).toBe(true);
    expect(canApproveCaseStudies(superAdmin)).toBe(true);
    expect(canApproveSocialDrafts(superAdmin)).toBe(true);
    expect(canAccessContentHub(officeAdmin)).toBe(false);
  });

  it("blocks marketing users from publishing or approving content directly", () => {
    expect(() => assertArticleStatusAllowed(marketing, "REVIEW")).not.toThrow();
    expect(() => assertCaseStudyStatusAllowed(marketing, "LEGAL_REVIEW")).not.toThrow();
    expect(() => assertSocialDraftStatusAllowed(marketing, "LEGAL_REVIEW")).not.toThrow();

    for (const check of [
      () => assertArticleStatusAllowed(marketing, "PUBLISHED"),
      () => assertCaseStudyStatusAllowed(marketing, "APPROVED"),
      () => assertSocialDraftStatusAllowed(marketing, "SCHEDULED")
    ]) {
      try {
        check();
        throw new Error("expected permission failure");
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(403);
      }
    }
  });

  it("validates article payloads and rejects non-contract fields", () => {
    const article = adminArticleWriteSchema.parse({
      title: "Contract risk basics",
      slug: "contract-risk-basics",
      excerpt: "A practical public explainer for common contract review risks.",
      content: "This public article is educational content and does not provide legal advice.",
      category: "Contracts",
      status: "REVIEW",
      publishedAt: ""
    });

    expect(article.status).toBe("REVIEW");
    expect(() => adminArticleWriteSchema.parse({ ...article, slug: "Bad Slug" })).toThrow();
    expect(() => adminArticleWriteSchema.parse({ ...article, seoSecret: "not allowed" })).toThrow();
  });

  it("requires case study anonymization before approval or publishing", () => {
    const parsed = adminCaseStudyWriteSchema.parse(safeCaseStudy);
    expect(parsed.isAnonymized).toBe(true);
    expect(() => assertCaseStudyIsPublicSafe(parsed)).not.toThrow();

    for (const unsafe of [
      { ...parsed, isAnonymized: false },
      { ...parsed, challenge: "Internal case KMT-2026-0001 should not be public." },
      { ...parsed, approach: "Contact client@example.com for the private record." },
      { ...parsed, generalOutcome: "The private phone +20 100 123 4567 must stay hidden." }
    ]) {
      try {
        assertCaseStudyIsPublicSafe(unsafe);
        throw new Error("expected anonymization failure");
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(400);
      }
    }
  });

  it("validates social drafts, scheduling, and AI draft inputs", () => {
    const draft = adminSocialDraftWriteSchema.parse({
      title: "LinkedIn awareness post",
      platform: "linkedin",
      content: "Educational legal awareness content for internal review.",
      sourceType: "article",
      sourceId: "contract-risk-basics",
      status: "DRAFT",
      scheduledAt: ""
    });

    expect(draft.platform).toBe("linkedin");
    expect(() => adminSocialDraftWriteSchema.parse({ ...draft, platform: "tiktok" })).toThrow();
    expect(normalizeSocialDraftScheduledAt("SCHEDULED", "2026-06-24T10:00:00.000Z")).toBeInstanceOf(Date);

    for (const check of [
      () => normalizeSocialDraftScheduledAt("SCHEDULED", ""),
      () => normalizeSocialDraftScheduledAt("DRAFT", "2026-06-24T10:00:00.000Z")
    ]) {
      try {
        check();
        throw new Error("expected schedule validation failure");
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(400);
      }
    }

    const aiDraft = adminSocialAiDraftSchema.parse({
      title: "AI reviewed draft",
      platform: "newsletter",
      sourceText: "A long enough source paragraph for a safe public legal awareness draft.",
      locale: "ar"
    });

    expect(aiDraft.platform).toBe("newsletter");
    expect(aiDraft.locale).toBe("ar");
    expect(() => adminSocialAiDraftSchema.parse({ ...aiDraft, rawPrompt: "do not store" })).toThrow();
  });
});
