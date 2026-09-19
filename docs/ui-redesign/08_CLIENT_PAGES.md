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

- [ ] TASK-08-01 Dashboard: renew panels/metrics on Phase 07 pieces; figures,
  links, badges, empty states behavior-identical; tooltips on icon metrics.
- [ ] TASK-08-02 Cases + court-dates: kept tables re-verified; full-list
  rendering preserved (no pagination per Phase 07 owner ruling); mobile
  cards intact; status badges themed.
- [ ] TASK-08-03 Case detail: desktop panels kept fully visible; mobile
  sessions/appointments/documents/payments groups → Accordion; download
  links + invoice figures untouched.
- [ ] TASK-08-04 AI assistant: log → Animated List; composer → Vanish Input;
  quick chips + `AssistantData` cards + disclaimer + typing indicator kept;
  existing AI request/API behavior preserved exactly; no polling is added to
  the AI chat.
- [ ] TASK-08-05 Team chat: keep native textarea composer + current surface;
  prove visual distinction from the AI assistant (side-by-side captures);
  existing 5-second polling behavior of the team chat preserved exactly.
- [ ] TASK-08-06 Files: upload → File Upload wired to the existing upload
  handler. Preserve every currently verified `DocumentUploadForm` field and
  upload constraint exactly. Do NOT introduce visibility, owner,
  access-level, or any new field unless it is proven to exist in the actual
  current client form source. List table + mobile cards kept.
- [ ] TASK-08-07 Payments: KEEP `continuePayment` checkout link,
  `followStatus` return link, case links, and receipt view links as semantic
  navigation links — do NOT convert them to Stateful Buttons. Stateful Button
  applies ONLY to a genuine asynchronous mutation/action that waits for an
  async operation; no such action is verified on `/client/payments`, so none
  is introduced. Mobile payment details → Accordion; amounts/invoices intact.
- [ ] TASK-08-08 Profile: save → Stateful Button (validation + status +
  refresh preserved); mobile account information → Accordion.
- [ ] TASK-08-09 Full portal sweep: 8 pages EN+AR × light+dark × 390/1024/1440;
  chat distinction captures; upload + profile submit-state captures (payment
  navigation links verified as links); phase commit; STOP.

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

- [ ] AI vs team chat distinction visible and documented in captures.
- [ ] No native file input remains on files page (grep proof); handler intact.
- [ ] Profile save (genuine async mutation) uses Stateful Button with correct
  states; payment navigation links remain semantic links (no button
  treatment anywhere on `/client/payments`).
- [ ] EN+AR focused matrix (EN/Dark/1440 + AR/Light/390 primaries;
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

NOT STARTED

## Implementation Notes

Leave blank.

## Files Actually Changed

Leave blank.

## QA Results

Leave blank.

## Blockers

Leave blank.
