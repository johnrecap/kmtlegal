# PLAN-20 Content & Social Hub

Last updated: 2026-06-24

Status: Done

## Scope Delivered

- Added `/admin/content` as the office content and social hub:
  - Tabs for Articles, Case Studies, Social Posts, and Pending Approval.
  - Search, status/category/platform filters, sorting, pagination, and edit links.
  - Summary cards for articles, case studies, social drafts, pending approval, and media/social count.
- Added create/edit forms for:
  - Articles.
  - Anonymous case studies.
  - Social post drafts.
  - AI-assisted social drafts through the existing AI Provider Gateway.
- Added redirect routes for PRD-compatible entry points:
  - `/admin/content/articles`
  - `/admin/content/case-studies`
  - `/admin/content/social`
- Added admin sidebar navigation entry for content.
- Changed public article and case-study list/detail pages and public APIs to read published DB content instead of only static arrays.

## Server Contracts

- `GET /api/admin/content`
- `POST /api/admin/content/articles`
- `GET /api/admin/content/articles/{articleId}`
- `PATCH /api/admin/content/articles/{articleId}`
- `POST /api/admin/content/case-studies`
- `GET /api/admin/content/case-studies/{caseStudyId}`
- `PATCH /api/admin/content/case-studies/{caseStudyId}`
- `POST /api/admin/content/social-drafts`
- `GET /api/admin/content/social-drafts/{draftId}`
- `PATCH /api/admin/content/social-drafts/{draftId}`
- `POST /api/admin/content/social-drafts/ai`
- `GET /api/public/articles`
- `GET /api/public/articles/{slug}`
- `GET /api/public/case-studies`
- `GET /api/public/case-studies/{slug}`

All admin contracts reuse the existing session lookup, RBAC helpers, Zod validation, request id/error shape, no-store responses, and audit logging.

## Data Model

No Prisma migration was required. PLAN-20 reuses the existing PLAN-04 models:

- `Article`
- `CaseStudy`
- `SocialPostDraft`
- `AiProviderRun` through the AI gateway
- `AuditLog`

The current schema does not include a standalone `MediaEntry` model. For MVP, the content hub exposes media/social as a read-only operational count based on social drafts. A real media library remains deferred until a media model and storage ownership contract are added.

## Permissions

- Content hub access requires at least one of:
  - `content.create.any`
  - `content.approve.any`
  - `caseStudy.create.any`
  - `caseStudy.approve.any`
  - `socialDraft.create.any`
  - `socialDraft.approve.any`
- Article create/update requires `content.create.any`.
- Article publish/archive requires `content.approve.any`.
- Case-study create/update requires `caseStudy.create.any`.
- Case-study approve/publish/reject/archive requires `caseStudy.approve.any`.
- Social-draft create/update requires `socialDraft.create.any`.
- Social-draft approve/schedule/publish/reject/archive requires `socialDraft.approve.any`.
- The UI hides unavailable approval states, but the server remains the enforcement boundary.

## AI Guardrails

- AI draft generation uses `generateStructured` with task `social_post_draft`.
- Provider calls stay server-side through the provider-agnostic AI gateway.
- AI drafts are saved as `LEGAL_REVIEW`, never auto-published.
- The selected platform from the user request is authoritative; provider output cannot switch the platform.
- Stored draft content includes the review disclaimer.
- Audit metadata stores provider/model/request id/review requirement only, not raw prompts, private summaries, document content, API keys, or raw provider responses.

## Public Content Rules

- Public article pages and APIs expose only `PUBLISHED` articles with `publishedAt`.
- Public case-study pages and APIs expose only `PUBLISHED` case studies with `publishedAt` and `isAnonymized = true`.
- Case-study output includes the anonymous-content disclaimer.
- Public pages remain dynamic so published DB content can appear without rebuilding static routes.

## Legal And Privacy Guardrails

- Case studies cannot be approved or published unless `isAnonymized` is true.
- Case studies are rejected before approval/publish when obvious private identifiers are found:
  - Internal case-like identifiers such as `KMT-2026-0001`.
  - Email addresses.
  - Phone-like numbers.
- Social drafts have no external publishing integration in MVP.
- Scheduled social drafts require `scheduledAt`.
- `scheduledAt` can be saved only for `SCHEDULED` or `PUBLISHED` social drafts.
- Article and case-study slugs must be lowercase kebab-case.

## Audit Events

- `content.article_create`
- `content.article_update`
- `content.case_study_create`
- `content.case_study_update`
- `content.social_draft_create`
- `content.social_draft_update`
- `content.social_draft_ai_create`

Audit metadata includes status, slug/platform/category/source information, and previous status where useful. It does not include sensitive raw content.

## Deferred From MVP

- External social publishing.
- Social account OAuth.
- Social publishing analytics from platform APIs.
- Dedicated media library and `MediaEntry` CRUD.
- Rich text editor, image embedding, and asset management.
- Content translation workflow.
- SEO management beyond slug/title/excerpt.
- Homepage featured-content DB wiring.

## Verification

- `cmd /c npx vitest run tests/server/admin-content-social.test.ts`
- `cmd /c npm run typecheck`
- `cmd /c npm run test`
- `cmd /c npm run lint`
- `cmd /c npm run build`
- `cmd /c npm run db:validate`

Focused tests:

- `tests/server/admin-content-social.test.ts`

## Remaining Runtime Gate

DB-backed authenticated browser smoke waits for a running PostgreSQL database from PLAN-04. The pages and APIs are implemented, but live create/edit/publish flows should be smoke-tested after `DATABASE_URL` points to a migrated database.
