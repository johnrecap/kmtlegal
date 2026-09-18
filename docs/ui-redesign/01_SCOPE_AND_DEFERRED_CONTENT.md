# Phase 01 — Scope + Deferred Public Content

## Objective

Audit every dependency of the three deferred public-content areas
(Articles/Insights, Case Studies, Media) across routes, navigation,
content pipelines, admin, backend, and SEO, so the owner issues a final
KEEP PUBLIC / HIDE PUBLIC / DELETE ruling per area. No visibility change
and no component work happens in this phase.

## Current State

Deferred candidates and their current renderers (from
`docs/KMT_COMPLETE_UI_INVENTORY.md`):

- Articles: `ArticlesPageView` (`public-pages.tsx:633`) + `ArticleDetailPageView`
  (`public-pages.tsx:660`) + `ArticleBody` (`:1194`) + `ReadingProgress` + `DetailCta`;
  routes `/articles`, `/articles/[slug]`, `/ar/articles`, `/ar/articles/[slug]`
  (EN files + AR catch-all `ar/[[...path]]/page.tsx`).
- Case studies: `CaseStudiesPageView` (`:756`) + `CaseStudyDetailPageView` (`:783`)
  + `CaseStudyBlock` (`:1171`) + `Reveal`; routes `/case-studies`,
  `/case-studies/[slug]` + AR equivalents.
- Media: `MediaPageView` (`:855`); routes `/media`, `/ar/media`.
- Shared listing engine: `DirectoryFilter` (`directory-filter.tsx`) with
  `MagicCard` + `BlurFade` — also serves Services + Team (must keep working).
- Homepage tie-ins: `InsightsLedger` (`public-components.tsx:487`) on `/` + `/ar`;
  `MatterRows` (`:443`, representative matters — NOT automatically case studies).
- Admin: `ArticleForm` / `CaseStudyForm` / `SocialDraftForm` / `AiSocialDraftForm`
  (`content-forms.tsx`), hub `src/app/(app-ar)/admin/content/page.tsx` (+ 3
  redirect-only sub-pages), `ContentMobileCard`, content tab nav.
- Header/footer links: `PublicHeader` nav items prop, `PublicShell` practice/footer
  links, `localizedPublicHref` (`src/lib/public-locale`); sitemap: `src/app/sitemap.ts`;
  metadata: `metadataForPublicPath` + `bookingMetadata` neighborhood in
  `src/app/(public-ar)/ar/[[...path]]/page.tsx` and EN page files.

## Target State

A completed decision matrix (table below, every cell filled with file-level
evidence) plus a `DECISION REQUIRED` block. Owner replies with one ruling per
area. Backend + admin content systems stay intact under every ruling except an
explicit owner-ordered DELETE, which is itself executed only in a later phase.

## Component Decisions

| Area | Current | Decision | Locked Component | Library | Official URL |
|---|---|---|---|---|---|
| Articles public pages | `ArticlesPageView`, `ArticleDetailPageView` | KEEP CURRENT | None (audit only) | — | — |
| Case-study public pages | `CaseStudiesPageView`, `CaseStudyDetailPageView` | KEEP CURRENT | None (audit only) | — | — |
| Media public page | `MediaPageView` | KEEP CURRENT | None (audit only) | — | — |
| Home `InsightsLedger` | `InsightsLedger` | KEEP CURRENT | None (audit only) | — | — |
| Home `MatterRows` | `MatterRows` + `HoverEffect` | KEEP CURRENT | None (audit only) | — | — |
| Admin content system | `ArticleForm`, `CaseStudyForm`, hub page | KEEP CURRENT | None (audit only) | — | — |

No component is replaced, removed, or introduced in Phase 01.

## Tasks

- [ ] TASK-01-01 Map public article routes: list EN files
  (`articles/page.tsx`, `articles/[slug]/page.tsx`), AR catch-all branches,
  `generateStaticParams` entries, and `renderPublicPath` article arms. Record
  exact files + line spans.
- [ ] TASK-01-02 Map public case-study routes the same way
  (`case-studies/page.tsx`, `case-studies/[slug]/page.tsx`, AR arms).
- [ ] TASK-01-03 Map public media routes (`media/page.tsx`, AR arm) and the
  `mediaItems` content source feeding `MediaPageView`.
- [ ] TASK-01-04 Grep all internal links pointing at `/articles`, `/case-studies`,
  `/media` (and `/ar/*` equivalents): header nav items, `PublicShell` footer,
  related-section links (`ArticleDetailPageView`, `CaseStudyDetailPageView`),
  home `InsightsLedger`, booking/contact cross-links. Record each file + line.
- [ ] TASK-01-05 Audit `src/app/sitemap.ts` + per-page metadata functions for
  article/case-study/media URL + metadata emission. Record entries.
- [ ] TASK-01-06 Audit the admin content pipeline: hub page tabs, `ArticleForm`,
  `CaseStudyForm`, `SocialDraftForm`, `AiSocialDraftForm`, query-param edit
  state (`?tab=&editType&editId`), and which forms write article vs case-study
  records. Record files + API endpoints called.
- [ ] TASK-01-07 Audit backend dependencies: content API routes under
  `src/app/api/public` + `src/app/api/admin/content`, database models/tables
  holding articles/case-studies/media, and the publishing flow
  (draft → status → `publishedAt` → public render). Record routes + models.
- [ ] TASK-01-08 Prove or disprove dependence of home `MatterRows`
  (representative matters) on public case-study content: trace its data source
  end to end. Record verdict with file + line evidence.
- [ ] TASK-01-09 Prove or disprove dependence of home `InsightsLedger` on the
  article pipeline the same way. Record verdict with evidence.
- [ ] TASK-01-10 Assess `DirectoryFilter` sharing risk: confirm Services + Team
  listings keep working untouched if article/case-study arms are hidden.
  Record the shared code paths.
- [ ] TASK-01-11 Fill the Phase 01 Decision Matrix below with the evidence from
  TASK-01-01–01-10 (every cell, no blanks).
- [ ] TASK-01-12 Write the `DECISION REQUIRED` block and STOP for owner
  confirmation. No hiding, no deletion, no redirect in this phase.

## Files Expected To Change

- `docs/ui-redesign/01_SCOPE_AND_DEFERRED_CONTENT.md` (matrix + decision block
  + notes sections only).

## Files That Must NOT Change

- `src/` (all application source), `tests/`, `package.json`, `components.json`,
  `tailwind.config.ts`, `src/app/sitemap.ts`, database, API routes,
  `docs/KMT_COMPLETE_UI_INVENTORY.md`, all other phase files.

## Dependencies

- Inventory Steps 1–2 (routes, page structures) as input. Blocks Phases 03
  (Insights handling), 05 (`DirectoryFilter` sharing), 06 (exclusion list),
  10–11 (content admin wiring stays regardless).

## Risks

- Hidden cross-links (related sections, footer practice links, sitemap) missed
  by a shallow grep → mitigate with repo-wide grep for `articles`,
  `case-studies`, `caseStudies`, `media` across `src/` in TASK-01-04/05/07.
- Confusing `MatterRows` with case studies → mitigated by TASK-01-08 proof task.
- Breaking Services/Team filters while hiding article arms → mitigated by
  TASK-01-10.

## Acceptance Criteria

- [ ] Every matrix cell cites at least one file path + line/section.
- [ ] TASK-01-08 and TASK-01-09 verdicts each cite data-source evidence.
- [ ] `DECISION REQUIRED` block lists all three areas with the three rulings.
- [ ] Zero `src/` diffs at phase end (`git status` clean apart from this file).
- [ ] Owner ruling recorded before any later phase hides public links.

## Visual QA

- [ ] No visual change exists to QA (audit-only phase; confirm via `git diff --stat`).

## Technical QA

- [ ] `git status` shows only `docs/ui-redesign/01_SCOPE_AND_DEFERRED_CONTENT.md` modified.
- [ ] Grep logs for `articles|case-studies|media` across `src/` are pasted into Implementation Notes.

## Status

NOT STARTED

## Phase 01 Decision Matrix

| Area | Public Dependency | Admin Dependency | Backend Dependency | SEO Dependency | Safe To Hide? | Safe To Delete? |
|---|---|---|---|---|---|---|
| Articles / Insights | (fill: routes, nav, footer, related links, home InsightsLedger) | (fill: ArticleForm, hub tab, edit flow) | (fill: API routes, models, publishing flow) | (fill: sitemap, metadata) | (fill) | (fill) |
| Case Studies | (fill: routes, nav, related links; MatterRows verdict) | (fill: CaseStudyForm, hub tab, edit flow) | (fill: API routes, models, publishing flow) | (fill: sitemap, metadata) | (fill) | (fill) |
| Media | (fill: routes, nav, content source) | (fill: any admin writer, if none state NONE) | (fill: API routes/models or NONE) | (fill: sitemap, metadata) | (fill) | (fill) |

## DECISION REQUIRED

Articles:
[ KEEP PUBLIC / HIDE PUBLIC / DELETE ]

Case Studies:
[ KEEP PUBLIC / HIDE PUBLIC / DELETE ]

Media:
[ KEEP PUBLIC / HIDE PUBLIC / DELETE ]

Owner direction on record: Articles HIDE PUBLIC / PRESERVE BACKEND + ADMIN;
Case Studies HIDE PUBLIC / PRESERVE BACKEND + ADMIN; Media HIDE PUBLIC with
deletion safety verified later. This block is answered explicitly before
Phase 03/05/06 act on it. STOP.

## Implementation Notes

Leave blank.

## Files Actually Changed

Leave blank.

## QA Results

Leave blank.

## Blockers

Leave blank.
