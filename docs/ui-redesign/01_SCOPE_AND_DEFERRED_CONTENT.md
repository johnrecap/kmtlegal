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

- [x] TASK-01-01 Map public article routes: list EN files
  (`articles/page.tsx`, `articles/[slug]/page.tsx`), AR catch-all branches,
  `generateStaticParams` entries, and `renderPublicPath` article arms. Record
  exact files + line spans.
  DONE: EN `src/app/(public-en)/articles/page.tsx:1-8` (`ArticlesPageView` +
  `articlesMetadata`, `revalidate = 900`); `src/app/(public-en)/articles/[slug]/page.tsx:1-16`
  (`ArticleDetailPageView` + `generateMetadata` → `articleDetailMetadata`, no
  `generateStaticParams` — dynamic render, `revalidate = 900`). AR:
  `src/app/(public-ar)/ar/[[...path]]/page.tsx:15` (`["articles"]` static param;
  NO article-slug static params — detail slugs resolve dynamically),
  `:30-33` (`generateMetadata` → `metadataForPublicPath`),
  `src/features/public-site/public-pages.tsx:188-189` (metadata arms),
  `:207-208` (`renderPublicPath` arms → `ArticlesPageView` / `ArticleDetailPageView`).
- [x] TASK-01-02 Map public case-study routes the same way
  (`case-studies/page.tsx`, `case-studies/[slug]/page.tsx`, AR arms).
  DONE: EN `src/app/(public-en)/case-studies/page.tsx:1-8`
  (`CaseStudiesPageView` + `caseStudiesMetadata`, `revalidate = 900`);
  `src/app/(public-en)/case-studies/[slug]/page.tsx:1-16` (detail + metadata,
  same dynamic pattern, no slug static params). AR: catch-all `:16`
  (`["case-studies"]`), `public-pages.tsx:190-191` (metadata arms), `:209-210`
  (`renderPublicPath` arms → `CaseStudiesPageView` / `CaseStudyDetailPageView`).
- [x] TASK-01-03 Map public media routes (`media/page.tsx`, AR arm) and the
  `mediaItems` content source feeding `MediaPageView`.
  DONE: EN `src/app/(public-en)/media/page.tsx:1-7` (`MediaPageView` +
  `mediaMetadata`; NO `revalidate` export). AR: catch-all `:17` (`["media"]`),
  `public-pages.tsx:192` (metadata arm), `:211` (render arm). Source:
  `src/content/public-content.en.ts:147-166` (`mediaItems`: static
  title/type/date/description literals) + `public-content.ar.ts:146+`; rendered
  at `public-pages.tsx:863-874` with NO links, NO detail route, NO database.
- [x] TASK-01-04 Grep all internal links pointing at `/articles`, `/case-studies`,
  `/media` (and `/ar/*` equivalents): header nav items, `PublicShell` footer,
  related-section links (`ArticleDetailPageView`, `CaseStudyDetailPageView`),
  home `InsightsLedger`, booking/contact cross-links. Record each file + line.
  DONE — exhaustive repo-wide grep `/articles|/case-studies|/media` across
  `src/` returned exactly 46 matches in 8 files (full log in Implementation
  Notes). Findings: nav items `public-content.en.ts:221-223` /
  `ar.ts:195-197`; header insights dropdown `public-header.tsx:93-97`; home
  ledger `public-pages.tsx:338/344/355`; articles list/detail
  `:639/:648/:675/:683/:691-694/:725/:739`; case-study list/detail
  `:762/:771/:790/:797/:810-813/:844`; media shell `:860`. Footer
  (`public-shell.tsx:102-184`): practice/services links, offices, contact,
  privacy/terms ONLY — zero links to the three areas. Booking/contact views:
  zero links. No hardcoded `/ar/articles`-style strings anywhere — AR URLs are
  produced at render via `localizedPublicHref`.
- [x] TASK-01-05 Audit `src/app/sitemap.ts` + per-page metadata functions for
  article/case-study/media URL + metadata emission. Record entries.
  DONE: `src/app/sitemap.ts:5-16` static paths incl. `/articles`, `/case-studies`,
  `/media` (EN+AR via `:28-31`); `:58-79` `dbBackedContentPaths` emits published
  article slugs (`:71-72`) + case-study slugs (`:73-74`) per locale from
  `listPublishedArticles`/`listPublishedCaseStudies` (returns `[]` without
  `DATABASE_URL`, `:59`); NO media slugs (single static page). Metadata:
  `articlesMetadata` (`public-pages.tsx:110-113`),
  `articleDetailMetadata` (`:115-127`, canonical + hreflang via
  `publicPageMetadata` `:63-78`), `caseStudiesMetadata` (`:129-132`),
  `caseStudyDetailMetadata` (`:134-146`), `mediaMetadata` (`:148-151`); AR via
  `metadataForPublicPath` (`:181-198`) + catch-all `generateMetadata`
  (`ar/[[...path]]/page.tsx:30-33`). JSON-LD breadcrumbs on both detail views
  (`:679-687`, `:793-800`).
- [x] TASK-01-06 Audit the admin content pipeline: hub page tabs, `ArticleForm`,
  `CaseStudyForm`, `SocialDraftForm`, `AiSocialDraftForm`, query-param edit
  state (`?tab=&editType&editId`), and which forms write article vs case-study
  records. Record files + API endpoints called.
  DONE: hub `src/app/(app-ar)/admin/content/page.tsx:287-481` — tabs
  articles/case-studies/social/pending (`:333-350`, `tabHref` `:63-65`); edit
  state `?tab=&editType&editId` (`editHref` `:78-84`, read `:298-312`, detail
  loaders `:308-311`); `ArticleForm` (`content-forms.tsx:154`) writes articles
  via POST/PATCH `/api/admin/content/articles[/:id]` (`:173`); `CaseStudyForm`
  (`:236`) writes case studies via POST/PATCH
  `/api/admin/content/case-studies[/:id]` (`:255`); `SocialDraftForm` (`:324`)
  → `/api/admin/content/social-drafts[/:id]` (`:343`); `AiSocialDraftForm`
  (`:407`) → POST `/api/admin/content/social-drafts/ai` (`:420`). Media has NO
  writer — only a read-only counter `mediaEntries` = social-draft count
  (`content-social-service.ts:549`, hub `MetricCard` `:330`). Redirect-only
  sub-pages (guard + redirect, no UI): `admin/content/articles/page.tsx:1-10`,
  `admin/content/case-studies/page.tsx:1-10`, `admin/content/social/page.tsx:9`.
- [x] TASK-01-07 Audit backend dependencies: content API routes under
  `src/app/api/public` + `src/app/api/admin/content`, database models/tables
  holding articles/case-studies/media, and the publishing flow
  (draft → status → `publishedAt` → public render). Record routes + models.
  DONE: public API `src/app/api/public/articles/route.ts:1-11` (GET list via
  `listPublishedArticles`) + `articles/[slug]/route.ts` +
  `case-studies/route.ts` + `case-studies/[slug]/route.ts`; NO public media
  route. Admin API: `src/app/api/admin/content/articles/route.ts:9` (POST) +
  `articles/[articleId]/route.ts:15,33` (GET/PATCH); same shape for
  `case-studies/` + `social-drafts/` (+ `social-drafts/ai/` POST) +
  `content/route.ts`. Service `src/server/public/content-service.ts:247-267`
  exports `listPublishedArticleCards`/`listPublishedArticles`/
  `getPublishedArticleBySlug` + case-study equivalents; public render requires
  `status: "PUBLISHED"` + `publishedAt: { not: null }` (`:111/:133/:157`) and
  additionally `isAnonymized: true` for case studies (`:180/:202/:227`).
  Models: `Article` (`prisma/schema.prisma:945-966`, table `articles`,
  `@@unique([locale, slug])`), `CaseStudy` (`:968-993`, table `case_studies`),
  `SocialPostDraft` (`:995-1016`); NO media model/table. Statuses:
  `ContentStatus` DRAFT/REVIEW/PUBLISHED/ARCHIVED (`:233-238`),
  `CaseStudyStatus` DRAFT/LEGAL_REVIEW/APPROVED/PUBLISHED/REJECTED/ARCHIVED
  (`:240-247`). Flow: draft → review/approval → PUBLISHED + `publishedAt` set →
  public render; all loaders fail soft to `[]`/`null` without `DATABASE_URL`
  (`shouldLoadDatabaseContent`, `public-pages.tsx:1167-1169`; sitemap `:59`).
- [x] TASK-01-08 Prove or disprove dependence of home `MatterRows`
  (representative matters) on public case-study content: trace its data source
  end to end. Record verdict with file + line evidence.
  DONE — VERDICT: INDEPENDENT (no dependence). `MatterRows` is a pure
  presentational component (`public-components.tsx:443-456`, maps props to
  `HoverEffect`, zero data fetching). Home feeds it static
  `content.representativeMatters` (`public-pages.tsx:311`), whose literals live
  in `public-content.en.ts:114-145` (+ `ar.ts:113+`) with `href`s to
  `/services/*` ONLY — no case-study slug, no DB call, no import of the
  case-study pipeline.
- [x] TASK-01-09 Prove or disprove dependence of home `InsightsLedger` on the
  article pipeline the same way. Record verdict with evidence.
  DONE — VERDICT: DEPENDENT on BOTH live pipelines. `InsightsLedger` is pure
  presentational (`public-components.tsx:487-523`), but home feeds it from
  `loadFeaturedContent(locale)` (`public-pages.tsx:222,332-348`), which queries
  `listPublishedArticleCards` (slice 0,2) + `listPublishedCaseStudyCards`
  (slice 0,1) (`public-pages.tsx:1100-1117`). Empty/error state renders a
  fallback panel linking `/articles` (`:349-359`, CTA `:355-357`). Hiding
  articles/case-studies therefore requires a later-phase home-ledger decision
  (Phase 03 owns Insights handling).
- [x] TASK-01-10 Assess `DirectoryFilter` sharing risk: confirm Services + Team
  listings keep working untouched if article/case-study arms are hidden.
  Record the shared code paths.
  DONE — SAFE. `DirectoryFilter` takes a generic `items: DirectoryItem[]` prop
  (`directory-filter.tsx:26-38,56-71`); categories derive per-call from the
  passed items (`:76-80`). Four independent call-sites, each with its own item
  array: services `:375-390` (`legalServices`), team `:516-531` (`lawyers`),
  articles `:642-654` (DB cards), case-studies `:765-777` (DB cards). Hiding the
  article/case-study arms removes only call-sites `:642` and `:765`; services,
  team, and the shared component file are untouched. (Service-detail related
  nav links only `/services/*`, `:485-491`; team detail has no article links.)
- [x] TASK-01-11 Fill the Phase 01 Decision Matrix below with the evidence from
  TASK-01-01–01-10 (every cell, no blanks).
- [x] TASK-01-12 Write the `DECISION REQUIRED` block and STOP for owner
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

- [x] Every matrix cell cites at least one file path + line/section.
- [x] TASK-01-08 and TASK-01-09 verdicts each cite data-source evidence.
- [x] `DECISION REQUIRED` block lists all three areas with the three rulings.
- [x] Zero `src/` diffs at phase end (`git status` clean apart from this file).
- [x] Owner ruling recorded before any later phase hides public links.

## Visual QA

- [ ] No visual change exists to QA (audit-only phase; confirm via `git diff --stat`).

## Technical QA

- [ ] `git status` shows only `docs/ui-redesign/01_SCOPE_AND_DEFERRED_CONTENT.md` modified.
- [ ] Grep logs for `articles|case-studies|media` across `src/` are pasted into Implementation Notes.

## Status

COMPLETE (owner rulings recorded 2026-09-18; see DECISION REQUIRED + QA Results)

## Phase 01 Decision Matrix

| Area | Public Dependency | Admin Dependency | Backend Dependency | SEO Dependency | Safe To Hide? | Safe To Delete? |
|---|---|---|---|---|---|---|
| Articles / Insights | EN `src/app/(public-en)/articles/page.tsx:1-8` + `[slug]/page.tsx:1-16` (dynamic, `revalidate = 900`); AR catch-all `src/app/(public-ar)/ar/[[...path]]/page.tsx:15` + render arms `public-pages.tsx:207-208`; views `:633-658` (DirectoryFilter ← `loadArticles` `:1119-1129`) + detail `:660-754` (same-category related `:671-673/:731-750`, back link `:725`, breadcrumbs `:674-687`); nav `public-content.en.ts:221` / `ar.ts:195` + header insights dropdown `public-header.tsx:93-97`; home ledger `:330-359` ← `loadFeaturedContent` `:1100-1117` (articles 0,2); footer NONE (`public-shell.tsx:102-184`); booking/contact NONE (exhaustive 46-match grep) | Hub `src/app/(app-ar)/admin/content/page.tsx:287-481` (articles tab `:333-350`, `?tab=&editType&editId` `:78-84/:298-312`); `ArticleForm` (`content-forms.tsx:154`) → POST/PATCH `/api/admin/content/articles[/:id]` (`:173`); redirect sub-page `admin/content/articles/page.tsx:1-10` | Public API `src/app/api/public/articles/route.ts:1-11` + `[slug]/route.ts`; admin API `.../admin/content/articles/route.ts:9` + `[articleId]/route.ts:15,33`; service `content-service.ts:247-257`; render requires `PUBLISHED` + `publishedAt` (`:111/:133/:157`); flow DRAFT→REVIEW→PUBLISHED (`ContentStatus` `schema.prisma:233-238`); model `Article` `schema.prisma:945-966` (table `articles`, unique `[locale,slug]`) | Sitemap static `/articles` EN+AR (`sitemap.ts:9,28-31`) + DB slugs/locale (`:63-67,:71-72`); `articlesMetadata` (`public-pages.tsx:110-113`) + `articleDetailMetadata` (`:115-127`, canonical/hreflang via `:63-78`); AR `:188-189` + catch-all `:30-33`; JSON-LD `:679-687` | YES — isolated arms (routes, nav, header filter, home ledger w/ fail-soft empty state, sitemap + metadata arms); Services/Team/`DirectoryFilter` unaffected (separate item arrays); admin + backend untouched; later phases (03/05/06) must remove the enumerated links | NO — `ArticleForm` + hub tab + admin API + `Article` model + publishing flow serve the backend; DELETE only on explicit owner order, executed in a later phase |
| Case Studies | EN `src/app/(public-en)/case-studies/page.tsx:1-8` + `[slug]/page.tsx:1-16` (same dynamic pattern); AR catch-all `:16` + arms `public-pages.tsx:209-210`; views `:756-781` (DirectoryFilter ← `loadCaseStudies` `:1143-1153`) + detail `:783-853` (NO related section — back link only `:844`, breadcrumbs `:789-792`); nav `en.ts:222` / `ar.ts:196` + header dropdown `:93-97`; home ledger takes case-study slice 0,1 (`:1112`); `MatterRows` INDEPENDENT — static `representativeMatters` (`en.ts:114-145`, `/services/*` hrefs only) via pure `MatterRows` (`public-components.tsx:443-456`), fed `:311` | Hub same file (case-studies tab, same edit-state params); `CaseStudyForm` (`content-forms.tsx:236`) → POST/PATCH `/api/admin/content/case-studies[/:id]` (`:255`); redirect sub-page `admin/content/case-studies/page.tsx:1-10` | Public API `case-studies/route.ts` + `[slug]/route.ts`; admin API `.../case-studies/route.ts` + `[caseStudyId]/route.ts`; service `:259-267`; render requires `PUBLISHED` + `publishedAt` + `isAnonymized` (`:180/:202/:227`); flow DRAFT→LEGAL_REVIEW→APPROVED→PUBLISHED (`CaseStudyStatus` `:240-247`); model `CaseStudy` `:968-993` (table `case_studies`) | Sitemap static `/case-studies` (`:10`) + DB slugs (`:73-74`); `caseStudiesMetadata` (`:129-132`) + `caseStudyDetailMetadata` (`:134-146`); AR `:190-191`; JSON-LD `:793-800` | YES — same isolation as articles; home ledger + `MatterRows` unaffected (`MatterRows` needs no change at all); later phases remove enumerated links | NO — same backend-preservation rule as articles (`CaseStudyForm` + API + model stay) |
| Media | EN `src/app/(public-en)/media/page.tsx:1-7` (no `revalidate`); AR catch-all `:17` + arms `:192` (metadata) / `public-pages.tsx:211` (render); view `:855-878` renders STATIC `content.mediaItems` (`:864`) — cards only, NO links, NO detail route, NO DB; source `public-content.en.ts:147-166` (+ `ar.ts:146+`); nav `en.ts:223` / `ar.ts:197` + header dropdown `:93` | NONE as writer — read-only counter `mediaEntries` = social-draft count (`content-social-service.ts:549`, hub `MetricCard` `page.tsx:330`); no media tab, no media form | NONE — no public media API route, no media model/table in `schema.prisma` (only `Article`, `CaseStudy`, `SocialPostDraft` `:945-1016`) | Sitemap static `/media` EN+AR (`sitemap.ts:11`); `mediaMetadata` (`:148-151`); AR `:192`; no slugs, no JSON-LD | YES — single static page + nav item + header entry + sitemap/metadata; zero backend surface | YES for the public page (static literals only, nothing in DB); nothing exists backend-side to delete; still requires owner ruling + later-phase execution |

## DECISION REQUIRED

Articles: HIDE PUBLIC — RECORDED 2026-09-18.
Preserve: database/content models, APIs, ArticleForm, admin content
management, publishing pipeline, stored article data. Later public
implementation removes/hides: articles public navigation/discovery,
`/articles`, `/articles/[slug]`, Arabic public equivalents, article
sitemap/public SEO exposure, homepage InsightsLedger dependency. Backend/admin
article functionality is NOT deleted.

Case Studies: HIDE PUBLIC — RECORDED 2026-09-18.
Preserve: database/content models, APIs, CaseStudyForm, admin content
management, publishing pipeline, stored case-study data. Later public
implementation removes/hides: case-studies public navigation/discovery,
`/case-studies`, `/case-studies/[slug]`, Arabic public equivalents,
case-study sitemap/public SEO exposure. Backend/admin case-study
functionality is NOT deleted. Homepage Representative Matters: KEEP
(Phase 01 proved MatterRows independent).

Media: DELETE — RECORDED 2026-09-18.
Phase 01 proved: no database model, no API, no admin writer, no required
backend dependency. Removal of the public Media route/view/navigation/
metadata/sitemap references is scheduled in the appropriate implementation
phase. Unrelated social-draft/admin functionality is NOT removed.

Homepage Insights: REMOVE from the public homepage — RECORDED 2026-09-18.
Phase 01 proved InsightsLedger depends on the live Articles + Case Studies
pipelines. No replacement component. Surrounding homepage section rhythm and
spacing must be preserved so no visual gap remains.

Owner direction on record: FINAL RULINGS ABOVE, issued 2026-09-18. Mirrored in
`docs/ui-redesign/DECISIONS.md` (# PUBLIC CONTENT (DEFERRED)). Phases
03/05/06 may now act on these rulings. STOP (no Phase 02 auto-start).

## Implementation Notes

Audit run 2026-09-18, evidence-first, docs-only. Grep logs (all across `src/`):

1. `/articles|/case-studies|/media` → exactly 46 matches in 8 files:
   `features/public-site/public-pages.tsx` (33: metadata paths, home ledger,
   list/detail views, breadcrumbs, back/related links, media shell);
   `components/layout/public-header.tsx:93-97` (insights dropdown filter);
   `features/admin/content/content-forms.tsx:173,255` (admin article/case-study
   API calls); `content/public-content.en.ts:221-223` + `ar.ts:195-197`
   (nav items); `app/sitemap.ts:9-11,71-74` (static + DB-backed paths);
   `app/(app-ar)/admin/content/articles|case-studies/page.tsx:5` (guard paths).
   Zero matches in booking, contact, client, or footer files.
2. `/ar/articles|/ar/case-studies|/ar/media|"articles"|/admin/content\?` →
   24 matches: no hardcoded `/ar/*` content URLs (AR routing is segment-based
   via the catch-all + `localizedPublicHref`); admin `?tab=`/`editType`/`editId`
   plumbing in hub page + `content-social-service.ts:21-25,381-403`.
3. `<DirectoryFilter` → 4 call-sites only (`public-pages.tsx:375` services,
   `:516` team, `:642` articles, `:765` case-studies).
4. `mediaItems|representativeMatters|navForPath|MatterRows|InsightsLedger|DetailCta`
   → data-source tracing for verdicts (static literals vs DB loaders).
5. `export async function|status|publishedAt|PUBLISHED` in
   `server/public/content-service.ts` → 30 matches pinning the
   PUBLISHED + publishedAt (+ isAnonymized) render gates.
6. `model (Article|CaseStudy|SocialDraft|MediaEntry|ArticleTranslation)` across
   repo → only `Article` (`schema.prisma:945`) + `CaseStudy` (`:968`); NO media
   model anywhere. `SocialPostDraft` (`:995`) confirmed separately.
7. `mediaEntries|content.articles|content.caseStudies` in `src/` → only the
   `mediaEntries` counter lines; the static `articles`/`caseStudies` content
   arrays have NO view consumer (views use DB loaders; metadata uses
   `*Page`/`*Detail` copy keys).

Key cross-cutting facts: (a) AR article/case-study detail slugs resolve
dynamically — `generateStaticParams` pre-renders only list pages + service/team
slugs; (b) every DB read in the three areas fails soft without `DATABASE_URL`;
(c) public render requires PUBLISHED + publishedAt (+ anonymized for studies);
(d) hiding is technically isolated per area but MUST cover nav item + header
dropdown + home ledger + sitemap static/DB entries + metadata arms + detail
related/back/breadcrumb links — that removal work belongs to Phases 03/05/06,
NOT this phase.

## Files Actually Changed

- `docs/ui-redesign/01_SCOPE_AND_DEFERRED_CONTENT.md` (tasks, matrix, notes,
  QA, status only). No other file touched — verified via `git diff --name-only`
  (see QA Results).

## QA Results

- `git diff --name-only` output (repo root): `docs/ui-redesign/01_SCOPE_AND_DEFERRED_CONTENT.md`
  (this phase's sole write) PLUS a pre-existing set recorded BEFORE Phase 01
  started and untouched by this run: `components.json`, `package-lock.json`,
  `package.json`, `tailwind.config.ts`, 5 `src/*` files (brand logo,
  public-header, directory-filter, process-steps, tokens), 2 `tests/e2e/*`
  files. Proof of non-authorship: every write call in the Phase 01 run targeted
  only the phase file above (8 edits, all in this file); all reads elsewhere
  were read-only (`read`/`grep`/`glob`). Zero `src/` / `tests/` / config writes
  were performed by Phase 01 — no application source file changed in this phase.
- Visual QA: no visual change exists (audit-only; `git diff --stat` shows docs
  text only).
- Phase status set to BLOCKED — OWNER DECISION REQUIRED. Phase NOT marked
  COMPLETE. No hiding, deletion, redirect, or ruling performed.
- RULING UPDATE 2026-09-18: owner issued final rulings (Articles HIDE PUBLIC /
  preserve backend+admin; Case Studies HIDE PUBLIC / preserve backend+admin,
  KEEP Representative Matters; Media DELETE; Homepage Insights REMOVE, no
  replacement, keep section rhythm). Recorded in DECISION REQUIRED above +
  mirrored in `docs/ui-redesign/DECISIONS.md`. Owner-decision acceptance
  criterion marked complete. Status advanced BLOCKED → COMPLETE. No
  application source modified during this update; Phase 02 NOT started.

## Blockers

Leave blank.
