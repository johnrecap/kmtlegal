# Phase 08 — Client Pages

## Objective

Redesign the 8 client pages on the Phase 07 foundation using only the locked
client components: Sidebar/Sheet/Tooltip shell, kept DataTable +
DataRecordCard (full-list rendering — no pagination per Phase 07 owner
ruling), Accordion for mobile detail groups,
Animated List + Vanish Input for the AI assistant (only), native textarea
for team chat, File Upload for files, Stateful Button for genuine async
mutations only (profile save; never for semantic navigation links).

## Current State

- `/client`: metrics grid, next-step panel, cases/appointments/payments panels.
- `/client/cases`: `DataTable` + mobile card. `/client/cases/[caseId]`:
  overview panel + sessions/appointments/documents/payments grids.
- `/client/assistant`: `ClientAssistantPanel` (quick chips, `role=log`,
  `ClientChatBubble`, `AssistantData` cards, `TypingIndicator`, `Textarea`
  composer) + `ClientTeamChatPanel` (brand header, `TeamBubble` log,
  `Textarea` maxLength 2000 composer, 5s poll on team thread).
- `/client/files`: `DataTable` + `DocumentUploadForm` (`ClientPortalSelect`s
  + native file input). `/client/court-dates`: `DataTable`.
- `/client/payments`: metrics + `GatewayAttemptCards` + `DataTable`.
- `/client/profile`: `ProfileForm` + account `ClientPortalPanel`.

## Target State

Every page keeps its data, actions, and business behavior; presentation uses
the locked set. AI assistant and human team chat look deliberately different.
Mobile detail groups collapse via Accordion while desktop panels stay fully
visible. Uploads go through File Upload; the profile save (a genuine async
mutation) uses Stateful Button; payment continue/follow/status/receipt
actions stay semantic navigation links (never buttons); lists keep their current
full-list rendering (no pagination — see owner ruling below).

## Component Decisions

| Area | Current | Decision | Locked Component | Library | Official URL |
|---|---|---|---|---|---|
| Dashboard/cases/court-dates/payments tables | DataTable + DataRecordCard | KEEP CURRENT | None (local, kept) | — | — |
| List pagination | None (full lists; NOT APPLICABLE per Phase 07 owner ruling — no pagination behavior exists to replace; shadcn Pagination stays locked stand-by) | KEEP CURRENT (no pagination introduced) | Pagination | shadcn/ui | https://ui.shadcn.com/docs/components/pagination |
| Case detail mobile groups | Static stacked panels | REPLACE WITH: Animate UI Accordion | Accordion | Animate UI | https://animate-ui.com/docs/components/radix/accordion |
| AI assistant log | Plain log | REPLACE WITH: Magic UI Animated List | Animated List | Magic UI | https://magicui.design/docs/components/animated-list |
| AI assistant composer | Plain Textarea + send | REPLACE WITH: Aceternity Placeholders And Vanish Input | Placeholders And Vanish Input | Aceternity UI | https://ui.aceternity.com/components/placeholders-and-vanish-input |
| Team chat composer + styling | Textarea composer, distinct surface | KEEP CURRENT (no Vanish Input, no AI-chat styling) | None | — | — |
| Files upload | Native file input | REPLACE WITH: Aceternity UI File Upload | File Upload | Aceternity UI | https://ui.aceternity.com/components/file-upload |
| Payments navigation actions | Semantic links (`continuePayment` checkout link, `followStatus` return link, case links, receipt view links) | KEEP CURRENT as semantic links — NEVER replace with Stateful Button | None | — | — |
| Payments mobile details | Static stacked cards | REPLACE WITH: Animate UI Accordion | Accordion | Animate UI | https://animate-ui.com/docs/components/radix/accordion |
| Profile save | Plain save button | REPLACE WITH: Aceternity UI Stateful Button | Stateful Button | Aceternity UI | https://ui.aceternity.com/components/stateful-button |
| Profile mobile account info | Static panel | REPLACE WITH: Animate UI Accordion | Accordion | Animate UI | https://animate-ui.com/docs/components/radix/accordion |

## Tasks

- [x] TASK-08-01 Dashboard: panels/metrics renewed on Phase 07 pieces;
  figures, links, badges, empty states behavior-identical; next-step panel
  keeps visual priority (gold icon chip + first position). Icon-metric
  tooltips evaluated and declined: the icons are `aria-hidden` decorative
  duplicates of adjacent visible labels — no icon-only control exists, and
  the foundation is frozen beyond token fixes.
- [x] TASK-08-02 Cases + court-dates: tables/cards/badges kept, full-list
  preserved, no pagination, no filters; only `text-kmt-*`/foundation classes
  (bridge-covered in dark, paper-readable in light) — zero hard-dark
  classes existed, no edits needed.
- [x] TASK-08-03 Case detail: desktop panels fully visible; mobile
  sessions/appointments/documents/payments groups → shared
  `ClientMobileAccordion` (one Animate UI Accordion, panel-styled trigger);
  identity/status/priority/lawyer/summary stay outside; download links +
  invoice figures untouched; page text retokenized.
- [x] TASK-08-04 AI assistant: log → `AnimatedList` (`delay={160}`, booking
  precedent; index state persists so old messages never replay; typing
  indicator stays outside the list; auto-scroll effect unchanged;
  reduced-motion handled by the vendor); composer → `PlaceholdersAndVanishInput`
  (controlled value, `trailing` send button with identical disabled/loading
  semantics; Enter now sends — single-line composer by official design);
  quick chips + `AssistantData` cards + disclaimer + typing indicator kept;
  API behavior identical except the draft now clears only on success, so a
  failed send keeps text + error visible (explicit risk cover, proven in QA).
  No polling added. AI console stays deliberately dark in both themes (AI
  surface identity; full chat light/dark belongs to a chat-focused phase).
- [x] TASK-08-05 Team chat: zero code changes — native textarea + maxLength
  2000 + 5s polling + privacy note + thread state preserved exactly;
  distinction proven side-by-side (different radius/header/badge/back-row/
  composer/privacy copy; no Vanish/AnimatedList/AI chips in team).
- [x] TASK-08-06 Files: native input → `FileUpload` wired to the existing
  handler. Provenance: official source fetched; `react-dropzone` install
  ATTEMPTED then fully REVERTED (churned the lockfile over pre-existing
  hunks — `package.json` restored byte-identical, dropzone stanzas
  surgically removed from the lockfile, zero remnants; see notes). Vendor =
  official port with native dnd + `accept` prop. Every verified field kept
  (case select, category default OTHER, accept list byte-identical, 5MB/size
  guidance copy, `visibility=CLIENT_VISIBLE`, same endpoint + payload shape
  + `file` field name); no visibility/owner/tags/new fields. `required`
  replaced by submit-disabled-until-file (same guarantee, no new copy);
  success clears via remount key + `form.reset()` + refresh as before.
  Table + mobile cards kept.
- [x] TASK-08-07 Payments: `continuePayment`/`followStatus`/case/receipt
  links remain semantic Links (grep proof: zero StatefulButton in client
  pages); no async action exists so none introduced. Mobile card rebuilt:
  invoice + status + amount + action links always visible; case/issued/due
  collapse into one Accordion (trigger = receipt/invoice identity).
  GatewayAttemptCards text retokenized only.
- [x] TASK-08-08 Profile: save → Stateful Button (validation + status +
  refresh preserved; `disabled={isSaving}` + `aria-busy` replace the old
  `loading` spinner); account panel desktop-visible + mobile
  `ClientMobileAccordion`; primary fields directly visible.
- [x] TASK-08-09 Full portal sweep: harness (deleted after) EN+AR ×
  light+dark × 390/1440 + 1024 accordion behavior; chat distinction;
  upload + profile submit-state captures; payment links verified as links;
  phase commit; STOP.

## Files Expected To Change

- `src/app/(client)/client/*.tsx` pages, `src/features/client/*`,
  `src/features/portal/*`, vendor files (File Upload if not added earlier).

## Files That Must NOT Change

- Foundation files beyond token fixes, backend/API/database/auth logic,
  upload/payment/profile endpoints and validation, public site, admin,
  routes, inventory doc.

## Dependencies

- Phase 07 (foundation must be COMPLETE). Accordion source/pattern →
  Phase 05; Stateful Button → Phase 06; File Upload → Phase 08 installs it
  if not already installed. Phase 08 does NOT depend on Phase 09.

## Risks

- Vanish Input swallowing message text on error → keep draft + error text
  visible; test failed-send path explicitly.
- File Upload accept/preview UX vs current input → preserve accept list +
  size guidance + error strings.
- Accordion hiding critical payment/case facts on mobile → keep amounts,
  statuses, and primary actions outside collapsed groups.

## Acceptance Criteria

- [x] AI vs team chat distinction visible and documented in captures.
- [x] No native file input remains on files page (grep proof); handler intact.
- [x] Profile save (genuine async mutation) uses Stateful Button with correct
  states; payment navigation links remain semantic links (no button
  treatment anywhere on `/client/payments`).
- [x] EN+AR focused matrix (EN/Dark/1440 + AR/Light/390 primaries;
  lightweight smoke for the rest); one phase commit; STOP.

## Visual QA (Phase Gate — focused matrix, run once)

- [ ] Primary captures: (1) EN / Dark / 1440, (2) AR / Light / 390 —
  per-page captures + chat-distinction + submit-state + mobile Accordion
  open/closed states.
- [ ] Lightweight smoke/layout checks only for 768/1024, EN-Light, AR-Dark;
  expand ONLY a failing dimension (per 00_MASTER_PLAN.md Verification Policy).
- [ ] Affected client pages only (no public/admin crawl).

## Technical QA (Phase Gate — run once)

- [ ] `npm run typecheck`, `npm run lint`, production build green
  (milestone phase — build mandatory).
- [ ] Targeted portal E2E (assistant, upload, payments, profile) green;
  console clean on client pages. No unrelated suites.
- [ ] Known unrelated failures: record + continue, no reinvestigation
  (Known Failure Cache).

## Status

COMPLETE

## Implementation Notes

Pre-phase baseline: HEAD `62cf4aa`. All pre-existing working-tree entries
preserved exactly; `package.json` restored byte-identical after the reverted
dropzone experiment (below). Staged only Phase 08 files/hunks.

Provenance:
- Animated List + Vanish Input: reused CURRENT vendors from Phase 04
  (`ui/animated-list.tsx`, `ui/placeholders-and-vanish-input.tsx` — KMT
  adaptations with reduced-motion contracts, in production on the booking
  chat). No new vendor files.
- Accordion: Phase 05 verbatim primitive, via one new shared
  `features/client/client-mobile-accordion.tsx` (case detail 4× + profile
  1×; payments mobile card keeps a bespoke inline accordion because its
  trigger carries receipt/invoice identity + always-visible amount/status/
  actions — same primitive, different trigger semantics).
- Stateful Button: Phase 06 verbatim vendor, profile save only.
- File Upload: official registry source fetched 2026-09-19
  (`ui.aceternity.com/registry/file-upload.json`, deps `react-dropzone` +
  `motion` + tabler). `npm install react-dropzone` was attempted, then
  FULLY REVERTED: it rewrote the lockfile (3803+/33−) over pre-existing
  uncommitted hunks with no safe per-hunk separation, so per the binding
  BLOCKED rule the dep path was abandoned — `package.json` restored
  byte-identical to pre-install, all dropzone/attr-accept/file-selector
  stanzas surgically removed from the lockfile (verified zero remnants;
  remaining lockfile diff = pre-existing hunks + npm re-resolution churn,
  left uncommitted and untouched by the Phase 08 commit). Shipped vendor =
  official visual/behavioral port: GridPattern, motion variants, file cards,
  single-shot click-to-browse preserved; `IconUpload`→lucide alias (Phase 07
  precedent); `useDropzone` surface (`multiple:false`, `noClick`, `onDrop`,
  `isDragActive`, reject→`console.log`) re-implemented with native HTML5
  drag-and-drop; added `accept` prop enforcing the verified accept list on
  picker + drops; one responsive fix (file-name `max-w-xs` overflows 390px
  → `max-w-[12rem] sm:max-w-xs`, proven before/after). If the owner later
  approves a proper install, `react-dropzone` can replace the native dnd
  shim with no call-site changes.

Build correction (found by the milestone build, fixed same phase):
production build rejects non-route exports from `page.tsx` modules, so the
case-detail group components moved to
`features/client/case-detail-groups.tsx` and the payments `MobileCard` to
`features/client/payment-mobile-card.tsx` (code identical, imports only).
Pages import them back; no behavior delta.

Behavior deltas (all explicit, no inventions):
- Assistant draft clears on success only (was: cleared pre-send). Failure
  keeps text + error bubble — the Phase 08 risk cover.
- Upload `required` → submit disabled until a valid file is selected (same
  guarantee, no new copy); success remounts the dropzone (clears cards).
- Chat composer Enter now sends (single-line Vanish Input by official
  design; was: newline in Textarea).
- AI console stays dark in both themes (deliberate AI-surface identity;
  vanish input pill renders white-chip in light via the Phase 07 panel
  input bridge — observed, readable, accepted, no new CSS).

FAST QA: inspection-only per group; one targeted gate at end. Temp harness
route + spec + team island deleted before commit; only the two intended
shared-module moves remain as new files.

## Files Actually Changed

- `src/app/(client)/client/page.tsx` (dashboard text tokens + gold
  next-step chip; structure/data/links identical)
- `src/app/(client)/client/cases/[caseId]/page.tsx` (text tokens; 4 groups
  → shared accordion on mobile, desktop panels intact; groups moved out —
  imports only)
- `src/app/(client)/client/cases/page.tsx`,
  `src/app/(client)/client/court-dates/page.tsx`,
  `src/app/(client)/client/files/page.tsx`: NO CHANGES (verified: zero
  hard-dark classes; kept tables/cards/badges already themed)
- `src/app/(client)/client/payments/page.tsx` (attempts text tokens;
  MobileCard moved out — imports only; links untouched)
- `src/app/(client)/client/profile/page.tsx` (account accordion)
- `src/features/client/client-assistant-panel.tsx` (AnimatedList +
  VanishInput + draft-on-success)
- `src/features/client/client-team-chat-panel.tsx`: NO CHANGES (verified
  only)
- `src/features/portal/document-upload-form.tsx` (FileUpload wiring,
  state-info message box)
- `src/features/portal/profile-form.tsx` (Stateful save, state-info
  message box)
- `src/components/ui/file-upload.tsx` (NEW vendor port, documented above)
- `src/features/client/client-mobile-accordion.tsx` (NEW shared wrapper)
- `src/features/client/case-detail-groups.tsx` (NEW home of moved groups)
- `src/features/client/payment-mobile-card.tsx` (NEW home of moved card)
- `docs/ui-redesign/08_CLIENT_PAGES.md` (this file)
- `docs/ui-redesign/COMPONENT_SOURCE_MATRIX.md` (row 31 → CURRENT)

## QA Results

Technical gate (run once):
- `npm run typecheck`: clean (plus once more after the build-driven moves).
- `npm run lint`: no warnings/errors.
- Targeted unit: `portal-access` 7/7 + `arabic-route-preservation` 2/2 green.
- Targeted E2E: authenticated suites need the disposable-DB gate
  (unavailable) — covered by a temp no-auth harness rendering the REAL
  touched units (case groups, shared accordion, payment card, upload form,
  profile form, assistant, team) with 2 passing specs, zero console/page
  errors; harness deleted after. Explicit failed-send test: 401 → error
  bubble (`role=alert`) + draft preserved in composer + user bubble in log.
  Explicit upload test: file select → selected-state line + submit enables
  → submit → server-rejection message, form intact.
- `npm run build`: GREEN (milestone, once) — all 8 client routes compiled;
  first attempt caught the page-export violation (fixed via the moves
  above), second attempt clean.

Visual gate (temp harness captures, reviewed, then deleted):
- A EN/Dark/1440 per-section: case groups, payment card (invoice + status
  + amount + links visible, receipt accordion collapsed), upload dropzone,
  profile form + Stateful save, assistant (chips + animated intro + vanish
  composer), team (distinct console).
- B AR/Light/390: shared accordion keyboard open/close with content;
  payment accordion opens with case data; upload selected-state + enabled
  submit; assistant failed-send; no overflow (390≤390).
- Chat distinction: side-by-side structure (radius/header/badge/back-row/
  composer/privacy) documented in captures.
- File-name 390px overflow found and fixed (`max-w` tweak), re-captured.

Acceptance grep proofs:
- No `type="file"` in `(client)` pages or portal features (page-level
  native input gone; only the vendor-internal hidden input remains).
- Zero `StatefulButton` in `(client)` pages (only `profile-form.tsx`, the
  genuine async mutation).
- Zero `Pagination`/`hrefForPage` in client scope (NOT APPLICABLE stands).

Recorded (Known Failure Cache, no reinvestigation):
- Stale `.next` type cache referencing the deleted Phase 07 temp route
  broke the first typecheck — cleared (gitignored artifact), green after.
- Dev-server first background start never listened (orphan nodes, Phase 07
  pattern); restarted with log file.
- `next-themes` re-applies stored theme after manual class removal → light
  E2E presets `kmt-theme=light` via `addInitScript` (Phase 07 pattern).

## Blockers

None. Phase 09 not started.
