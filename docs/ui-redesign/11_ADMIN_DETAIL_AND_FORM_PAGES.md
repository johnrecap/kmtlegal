# Phase 11 — Admin Detail / Form Pages

## Objective

Rewire every admin detail/form group onto the Phase 09 shared components
only: Tabs for tabbed detail, Accordion for collapsible groups, Dialog for
destructive confirmations and calendar/content operations, Sheet for mobile
forms, Stateful Button for async saves, File Upload for document intake,
Menu/Popover where the lock assigns them. All form fields, validation,
endpoints, and permissions stay behavior-identical.

## Current State

- Case detail (`cases/[caseId]`): hand-rolled `CaseTabs`, 4 metric cards,
  inline forms (`ManualCaseEditForm`, `CaseStatusForm`, `CaseSessionForm`,
  reschedule/task/document forms), native `details/summary` disclosures,
  25rem action sidebar.
- New case (`cases/new`): 3 inline `Card`s + footer buttons.
- Client detail: data card + metrics + linked lists + action-card stack
  (edit/assign/account/archive).
- Consultation detail: outcome/request/message/AI cards + action stack
  (schedule/outcome/reopen/review/assign/convert/reject).
- Availability: rules + weekly-hours cards + save.
- Calendar ops: inline create + inline reschedule forms.
- Tasks: kanban + `details`-wrapped edit + side create card.
- Documents: upload card + action/delete inline forms + `details` cards.
- Finance ops: invoice form card + gateway/pricing forms + replay button.
- Thread: native chat stream + textarea composer + manage selects (KEEP).
- Settings: diagnostic + per-setting cards (1 editable).
- User detail: status/permission/session/audit cards + action stack.
- Roles: role list + checkbox matrix.
- Content editor: edit card + AI panel card.
- Audit technical details: `TechnicalDetails details/summary`.

## Target State

Same information and actions, kit-driven chrome: tabbed detail navigates by
Tabs; every collapsible group is an Accordion; every destructive/archive/
reset/reject/delete confirmation is a Dialog; calendar create/edit opens a
Dialog on desktop and a Sheet on mobile; task creation opens a Sheet;
document intake uses File Upload; every async save uses Stateful Button;
thread stays native with subtle transitions only.

## Component Decisions

| Area | Current | Decision | Locked Component | Library | Official URL |
|---|---|---|---|---|---|
| Case detail tabs | CaseTabs hand-rolled nav | REPLACE WITH: Animate UI Tabs | Tabs | Animate UI | https://animate-ui.com/docs/components/radix/tabs |
| Task/document/details disclosures | Native details | REPLACE WITH: Animate UI Accordion | Accordion | Animate UI | https://animate-ui.com/docs/components/radix/accordion |
| Destructive confirmations (delete doc, archive client, reset password, reject/convert consult, delete user) | Immediate inline actions | REPLACE WITH: Animate UI Dialog | Dialog | Animate UI | https://animate-ui.com/docs/components/radix/dialog |
| New-case mobile secondary | Static cards | REPLACE WITH: Animate UI Accordion | Accordion | Animate UI | https://animate-ui.com/docs/components/radix/accordion |
| Client/consultation action groups | Static card stacks | REPLACE WITH: Animate UI Accordion (groups) + Dialog (dangerous) | Accordion, Dialog | Animate UI | https://animate-ui.com/docs/components/radix/accordion, https://animate-ui.com/docs/components/radix/dialog |
| Availability weekday groups | Static cards | REPLACE WITH: Animate UI Accordion | Accordion | Animate UI | https://animate-ui.com/docs/components/radix/accordion |
| Calendar create/edit/reschedule | Inline forms | REPLACE WITH: Animate UI Dialog (desktop) + Sheet (mobile) | Dialog, Sheet | Animate UI | https://animate-ui.com/docs/components/radix/dialog, https://animate-ui.com/docs/components/radix/sheet |
| Task create | Side card | REPLACE WITH: Animate UI Sheet | Sheet | Animate UI | https://animate-ui.com/docs/components/radix/sheet |
| Document upload | Native file input card | REPLACE WITH: Aceternity UI File Upload | File Upload | Aceternity UI | https://ui.aceternity.com/components/file-upload |
| Document/row actions | Inline buttons | REPLACE WITH: Animate UI Menu | Menu | Animate UI | https://animate-ui.com/docs/components/base/menu |
| Async saves (all forms) | Plain buttons | REPLACE WITH: Aceternity UI Stateful Button | Stateful Button | Aceternity UI | https://ui.aceternity.com/components/stateful-button |
| Content editor/nav/preview/AI area | Static cards + tab nav | REPLACE WITH: Tabs + Sheet (mobile/large editor) + Dialog (preview) + Accordion (AI area) | Tabs, Sheet, Dialog, Accordion | Animate UI | (radix/tabs, radix/sheet, radix/dialog, radix/accordion URLs above) |
| Contact-message disclosure | Native details body | REPLACE WITH: Animate UI Accordion | Accordion | Animate UI | https://animate-ui.com/docs/components/radix/accordion |
| Audit technical details | Native details | REPLACE WITH: Animate UI Accordion | Accordion | Animate UI | https://animate-ui.com/docs/components/radix/accordion |
| Settings/roles groups | Static cards/matrix | REPLACE WITH: Animate UI Accordion (groups; role selection kept) | Accordion | Animate UI | https://animate-ui.com/docs/components/radix/accordion |
| Message thread stream + composer | Native stream + textarea | KEEP CURRENT (subtle transitions only) | None | — | — |
| Users create/edit mobile | Inline cards | REPLACE WITH: Animate UI Sheet + Menu + Dialog (dangerous) | Sheet, Menu, Dialog | Animate UI | (URLs above) |

## Tasks

- [x] TASK-11-01 Case detail: `CaseTabs` → Tabs (`?tab=` values preserved);
  task/document `details` → Accordion; sidebar forms keep fields/validation;
  destructive document delete → Dialog; saves → Stateful Buttons.
- [x] TASK-11-02 New case: structure kept; mobile secondary cards →
  Accordion; create → Stateful Button; collision-retry behavior preserved.
- [x] TASK-11-03 Client detail: secondary action groups → Accordion;
  archive/account-reset → Dialog; edit/assign inline behavior preserved.
- [x] TASK-11-04 Consultation detail: action groups → Accordion; reject +
  convert confirmations → Dialog; schedule/outcome/reopen/review/assign
  fields + validation preserved.
- [x] TASK-11-05 Availability: weekday groups → Accordion; save → Stateful
  Button; time/mode checkbox behavior preserved.
- [x] TASK-11-06 Calendar ops: create/edit/reschedule → Dialog on desktop,
  Sheet on mobile; day-grouped list kept; blocked-note states preserved.
- [x] TASK-11-07 Tasks: edit/details → Accordion; create → Sheet; kanban
  columns kept; no draggable UI.
- [x] TASK-11-08 Documents: upload → File Upload (same Phase 08
  owner-approved adaptation file, no second implementation; accept list,
  5MB hint, visibility, owner/case mapping preserved); actions → Menu;
  delete → Dialog; details → Accordion.
- [x] TASK-11-09 Finance ops: invoice create/edit → Stateful saves (query-param
  edit state preserved); gateway/pricing saves → Stateful; replay KEPT as-is
  (result grid + error box + refresh priority; documented deviation below).
- [x] TASK-11-10 Thread: verified KEEP — native stream + textarea + selects,
  kmt tokens, gold focus rings, transitions; no kit changes applied.
- [x] TASK-11-11 Settings/users/roles/content/audit/contact-messages: groups →
  Accordion; users sheets/menus/dialogs per lock; roles matrix kept with
  Accordion groups; content Tabs + editor Sheet + preview Dialog + AI
  Accordion; audit technical → Accordion; message bodies → Accordion with
  row Menu actions.
- [x] TASK-11-12 Full admin sweep: real-handler forms, Dialog confirm +
  cancel, keyboard-only pass, 390px pass; phase commit; STOP.

## Files Expected To Change

- Admin detail/form page files + `features/admin/cases/*`,
  `task-documents/*`, `clients/*`, `consultations/*`, `finance/*`,
  `messages/*`, `contact-messages/*`, `governance/*`, `content/*`
  (chrome + wiring only; field/validation logic untouched).

## Files That Must NOT Change

- Backend/API/database/auth/permissions/validation rules, list architecture
  from Phase 10 (no regressions), public site, client portal, routes (no new
  params), inventory doc.

## Dependencies

- Phases 09 (kit) + 10 (lists) COMPLETE. Dialog/confirmation copy must exist
  in Arabic before TASK-11-12.

## Risks

- Dialog confirmation changing a dangerous-action flow → mitigate by keeping
  the same endpoint + payload; dialog only gates the click.
- Sheet-mobile vs Dialog-desktop divergence on calendar → single form
  component rendered in both shells (no forked logic).
- Accordion collapsing a required field out of view on submit-error →
  auto-expand the group holding the first invalid field (implement +
  test per form).

## Acceptance Criteria

- [x] No native `details/summary` remains in admin detail/form surfaces
  (grep proof; notification bell already on Popover).
- [x] Every destructive action is Dialog-gated with cancel path tested.
- [x] Every async save uses Stateful Button with error recovery.
- [x] Submit-error auto-expands the holding Accordion group.
- [x] One phase commit; STOP.

## Visual QA (Phase Gate — focused matrix, run once)

- [x] Primary captures: (1) EN / Dark / 1440, (2) AR / Light / 390 —
  Tabs/Accordion/Dialog/Sheet/Menu per group + submit + confirm +
  error-state sequences.
- [x] Lightweight smoke/layout checks only for 768/1024, EN-Light, AR-Dark;
  expand ONLY a failing dimension (per 00_MASTER_PLAN.md Verification Policy).
- [x] Affected detail/form groups only (no full admin crawl).

## Technical QA (Phase Gate — run once)

- [x] `npm run typecheck`, `npm run lint`, production build green
  (milestone phase — build mandatory).
- [x] Targeted admin detail/form E2E (plan35/plan36 suites where applicable)
  green; console clean. No unrelated suites.
- [x] Known unrelated failures: record + continue, no reinvestigation
  (Known Failure Cache).

## Status

COMPLETE

## Implementation Notes

- New kit: `src/components/admin/use-invalid-field-accordion.tsx`
  (single/multiple overloads; `onInvalidCapture` opens the
  `[data-form-group]` holding the first invalid field); exported from
  `src/components/admin/index.ts`.
- `AdminDialog` fixed to auto-dismiss on confirm in both modes (controlled
  `open` + internal state; `handleConfirm` closes then calls `onConfirm`).
  Destructive gates call `formRef.current?.requestSubmit()` from `onConfirm`
  so the same endpoint/payload runs behind the closed dialog.
- Deviation (documented): webhook replay (`WebhookReplayButton`) KEPT as-is
  instead of Stateful Button — result grid + error box + refresh priority
  take precedence; no async-save semantics change.
- Thread (`admin-message-thread-panel.tsx`) verified KEEP, zero edits:
  native stream + textarea + selects, kmt tokens, gold focus, transitions.
- jsdom note: the Animate Dialog keeps its exit mounted in jsdom (Radix
  `hideOthers` leaves the background `aria-hidden`), so
  `admin-user-password-form.test.tsx` queries post-dialog buttons with
  `{ hidden: true }`. Real-browser close (cancel/confirm + focus-return) was
  verified in the Playwright harness.
- Protected files untouched: `package.json`, `package-lock.json`,
  `components.json` hashes identical to baseline; `tokens.ts` /
  `tailwind.config.ts` foreign hunks left alone.

## Files Actually Changed

- `src/components/admin/admin-dialog.tsx`, `src/components/admin/index.ts`,
  `src/components/admin/use-invalid-field-accordion.tsx` (NEW).
- `src/app/(app-ar)/admin/cases/[caseId]/page.tsx`,
  `src/app/(app-ar)/admin/calendar/page.tsx`,
  `src/app/(app-ar)/admin/tasks/page.tsx`,
  `src/app/(app-ar)/admin/documents/page.tsx`,
  `src/app/(app-ar)/admin/content/page.tsx`,
  `src/app/(app-ar)/admin/settings/page.tsx`,
  `src/app/(app-ar)/admin/audit-log/page.tsx`,
  `src/app/(app-ar)/admin/users/page.tsx`.
- `src/features/admin/cases/manual-case-form.tsx`,
  `src/features/admin/cases/case-action-forms.tsx`,
  `src/features/admin/clients/client-crm-forms.tsx`,
  `src/features/admin/consultations/consultation-action-panel.tsx`,
  `consultation-schedule/outcome/reopen/availability-forms.tsx`,
  `src/features/admin/task-documents/task-document-forms.tsx`,
  `src/features/admin/finance/finance-forms.tsx`,
  `src/features/admin/governance/governance-forms.tsx`,
  `src/features/admin/governance/role-permission-form.tsx`,
  `src/features/admin/content/content-forms.tsx`,
  `src/features/admin/contact-messages/contact-message-inbox.tsx`.
- `tests/ui/admin-detail-phase11.test.tsx` (NEW, 5/5),
  `tests/ui/admin-user-password-form.test.tsx`,
  `tests/ui/admin-role-permission-form.test.tsx`,
  `tests/ui/admin-manual-case-form.test.tsx`,
  `tests/ui/admin-contact-message-inbox.test.tsx`.

## QA Results

- `npm run typecheck`: clean. `npm run lint`: no warnings/errors.
- Full suite: 634 passed, 53 skipped, 1 failed —
  `tests/ui/shared-ui-consumer-disposition.test.ts`, PRE-EXISTING and
  unrelated (verified: none of its 5 drift files are touched by this phase;
  stale PLAN-35 artifact still lists deleted
  `src/components/layout/dashboard-mobile-nav.tsx` and misses Phase 09
  additions `admin-mobile-nav.tsx` / `pagination-shadcn.tsx`;
  `profile-form.tsx` / `payment-mobile-card.tsx` import drift predates Phase
  11). Recorded per policy; no reinvestigation.
- `npm run build`: green (compiled 45s, 40/40 static pages).
- Grep proof: zero `<details` / `</details>` under
  `src/app/(app-ar)/admin` and `src/features/admin`.
- Visual gate (Playwright temp harness, mock data): 6/6 green — Tabs manual
  arrows no-nav, Accordion Enter/Esc, Dialog cancel/confirm-close +
  focus-return, Sheet 390 ≤1px overflow, Menu keyboard, FileUpload
  `proof.pdf`, validation closed→open + focus + save. Captures reviewed:
  `p11-A-case-dialog`, `p11-C-calendar-sheet`, `p11-D-doc-menu`,
  `p11-E-validation-open`, `p11-F-dark-dialog/menu`. Temps removed, dev
  stopped, `.next` cleaned after.

## Blockers

- (none) for Phase 11. Noted pre-existing: PLAN-35 disposition artifact
  (`test-results/plan35/shared-ui-consumer-disposition.json`) is stale after
  Phase 09 — needs regeneration with disposition evidence outside this
  phase's scope.
