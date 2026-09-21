# 12 — Content / CMS Audit

System live in admin; public display hidden. Overall: ADMIN ONLY (MEDIUM).

## Articles — ADMIN ONLY

- Create/edit: `POST|PATCH /api/admin/content/articles(+/[articleId])` via
  `ArticleForm` (title, kebab slug, `ar|en`, excerpt 20..500, content
  30..20000, category, status `DRAFT|REVIEW|PUBLISHED|ARCHIVED`,
  `publishedAt` auto-now on publish). Unique `[locale,slug]`.
- Publish gate: `content.approve.any`; non-approvers cannot touch PUBLISHED.
- Public: hidden (`notFound`); JSON API serves PUBLISHED (leak, file 20 P1).
- Status: fully operational admin-side; zero public visibility.

## Case studies — ADMIN ONLY

- CRUD + `challenge|approach|generalOutcome|lessons` (20..5000 each),
  status `DRAFT|LEGAL_REVIEW|APPROVED|PUBLISHED|REJECTED|ARCHIVED`,
  `isAnonymized`, `approvedBy`. `APPROVED|PUBLISHED` requires anonymization
  proof (`assertCaseStudyIsPublicSafe`). Same public-hidden/API-live split.

## Social drafts (+AI) — ADMIN ONLY

- Manual: platform enum, 10..5000 chars, source ref, status incl.
  `SCHEDULED` (requires `scheduledAt`) / `PUBLISHED`.
- AI: `POST …/social-drafts/ai` (title/platform/sourceText/locale) →
  `generateStructured(social_post_draft)` → `LEGAL_REVIEW` draft + run row
  + audit. Human must advance states.
- `PUBLISHED` = "internal"; NO external poster integration (NOT WIRED).

## Operational answers

- Fully operational: article/study/social CRUD, state machines, publish
  gates, AI draft, hub tabs + pending queue, cache revalidation tags, audit.
- Admin-only: everything above (marketing role = create only).
- Hidden from public: articles + case studies (views exist, unreachable).
- Orphaned: article/case-study metadata helpers (uncalled), sitemap DB
  hook (returns `[]`), media (deleted).

## Gaps

No delete endpoints (P2); no scheduled publishing + no cron publisher
(P3); no SEO fields (meta/OG/tags/canonical) (P3); no version history
(P3); no media library for content images (P3); social scheduling without
a poster is a dead-end state (P2 — either integrate or remove SCHEDULED).
