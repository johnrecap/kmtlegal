# Phase 08 — Client Pages

## Objective

Redesign the 8 client pages on the Phase 07 foundation using only the locked
client components: Sidebar/Sheet/Tooltip shell, kept DataTable +
DataRecordCard, shadcn Pagination, Accordion for mobile detail groups,
Animated List + Vanish Input for the AI assistant (only), native textarea
for team chat, File Upload for files, Stateful Button for async actions.

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
visible. Uploads go through File Upload; async saves/payments through
Stateful Button; lists paginate through shadcn Pagination.

## Component Decisions

| Area | Current | Decision | Locked Component | Library | Official URL |
|---|---|---|---|---|---|
| Dashboard/cases/court-dates/payments tables | DataTable + DataRecordCard | KEEP CURRENT | None (local, kept) | — | — |
| List pagination | shadcn Pagination helper (Phase 07) | KEEP CURRENT | Pagination | shadcn/ui | https://ui.shadcn.com/docs/components/pagination |
| Case detail mobile groups | Static stacked panels | REPLACE WITH: Animate UI Accordion | Accordion | Animate UI | https://animate-ui.com/docs/components/radix/accordion |
| AI assistant log | Plain log | REPLACE WITH: Magic UI Animated List | Animated List | Magic UI | https://magicui.design/docs/components/animated-list |
| AI assistant composer | Plain Textarea + send | REPLACE WITH: Aceternity Placeholders And Vanish Input | Placeholders And Vanish Input | Aceternity UI | https://ui.aceternity.com/components/placeholders-and-vanish-input |
| Team chat composer + styling | Textarea composer, distinct surface | KEEP CURRENT (no Vanish Input, no AI-chat styling) | None | — | — |
| Files upload | Native file input | REPLACE WITH: Aceternity UI File Upload | File Upload | Aceternity UI | https://ui.aceternity.com/components/file-upload |
| Payments async actions | Plain buttons/links | REPLACE WITH: Aceternity UI Stateful Button | Stateful Button | Aceternity UI | https://ui.aceternity.com/components/stateful-button |
| Payments mobile details | Static stacked cards | REPLACE WITH: Animate UI Accordion | Accordion | Animate UI | https://animate-ui.com/docs/components/radix/accordion |
| Profile save | Plain save button | REPLACE WITH: Aceternity UI Stateful Button | Stateful Button | Aceternity UI | https://ui.aceternity.com/components/stateful-button |
| Profile mobile account info | Static panel | REPLACE WITH: Animate UI Accordion | Accordion | Animate UI | https://animate-ui.com/docs/components/radix/accordion |

## Tasks

- [ ] TASK-08-01 Dashboard: renew panels/metrics on Phase 07 pieces; figures,
  links, badges, empty states behavior-identical; tooltips on icon metrics.
- [ ] TASK-08-02 Cases + court-dates: kept tables re-verified; pagination via
  shared helper; mobile cards intact; status badges themed.
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
- [ ] TASK-08-07 Payments: continue/follow actions → Stateful Buttons;
  mobile payment details → Accordion; amounts/invoices/receipt links intact.
- [ ] TASK-08-08 Profile: save → Stateful Button (validation + status +
  refresh preserved); mobile account information → Accordion.
- [ ] TASK-08-09 Full portal sweep: 8 pages EN+AR × light+dark × 390/1024/1440;
  chat distinction captures; upload + payment + profile submit-state
  captures; phase commit; STOP.

## Files Expected To Change

- `src/app/(client)/client/*.tsx` pages, `src/features/client/*`,
  `src/features/portal/*`, vendor files (File Upload if not added earlier).

## Files That Must NOT Change

- Foundation files beyond token fixes, backend/API/database/auth logic,
  upload/payment/profile endpoints and validation, public site, admin,
  routes, inventory doc.

## Dependencies

- Phase 07 (foundation must be COMPLETE). Accordion/Stateful/File Upload
  vendor patterns from Phases 05/06/09 as applicable.

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
- [ ] All async saves/payments use Stateful Button with correct states.
- [ ] EN+AR × light+dark × viewports pass; one phase commit; STOP.

## Visual QA

- [ ] Per-page captures + chat-distinction + submit-state captures.
- [ ] Mobile Accordion open/closed captures.

## Technical QA

- [ ] `npm run typecheck`, `npm run lint`, production build green.
- [ ] Portal E2E (assistant, upload, payments, profile) green; console clean.

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
