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

- [ ] TASK-11-01 Case detail: `CaseTabs` → Tabs (`?tab=` values preserved);
  task/document `details` → Accordion; sidebar forms keep fields/validation;
  destructive document delete → Dialog; saves → Stateful Buttons.
- [ ] TASK-11-02 New case: structure kept; mobile secondary cards →
  Accordion; create → Stateful Button; collision-retry behavior preserved.
- [ ] TASK-11-03 Client detail: secondary action groups → Accordion;
  archive/account-reset → Dialog; edit/assign inline behavior preserved.
- [ ] TASK-11-04 Consultation detail: action groups → Accordion; reject +
  convert confirmations → Dialog; schedule/outcome/reopen/review/assign
  fields + validation preserved.
- [ ] TASK-11-05 Availability: weekday groups → Accordion; save → Stateful
  Button; time/mode checkbox behavior preserved.
- [ ] TASK-11-06 Calendar ops: create/edit/reschedule → Dialog on desktop,
  Sheet on mobile; day-grouped list kept; blocked-note states preserved.
- [ ] TASK-11-07 Tasks: edit/details → Accordion; create → Sheet; kanban
  columns kept; no draggable UI.
- [ ] TASK-11-08 Documents: upload → File Upload (same Phase 08
  owner-approved adaptation file, no second implementation; accept list,
  5MB hint, visibility, owner/case mapping preserved); actions → Menu;
  delete → Dialog; details → Accordion.
- [ ] TASK-11-09 Finance ops: invoice create/edit → Stateful saves (query-param
  edit state preserved); gateway/pricing saves → Stateful; replay → Stateful
  Button (result grid + error box preserved).
- [ ] TASK-11-10 Thread: keep native stream + textarea; theme/focus polish
  only; 5s poll + assignee/status behavior preserved; no AnimatedList.
- [ ] TASK-11-11 Settings/users/roles/content/audit/contact-messages: groups →
  Accordion; users sheets/menus/dialogs per lock; roles matrix kept with
  Accordion groups; content Tabs + editor Sheet + preview Dialog + AI
  Accordion; audit technical → Accordion; message bodies → Accordion with
  row Menu actions.
- [ ] TASK-11-12 Full admin sweep: every form submits against real handlers
  (safe test records), every Dialog confirmed + cancelled, keyboard-only
  pass, 390px pass; phase commit; STOP.

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

- [ ] No native `details/summary` remains in admin detail/form surfaces
  (grep proof; notification bell already on Popover).
- [ ] Every destructive action is Dialog-gated with cancel path tested.
- [ ] Every async save uses Stateful Button with error recovery.
- [ ] Submit-error auto-expands the holding Accordion group.
- [ ] One phase commit; STOP.

## Visual QA (Phase Gate — focused matrix, run once)

- [ ] Primary captures: (1) EN / Dark / 1440, (2) AR / Light / 390 —
  Tabs/Accordion/Dialog/Sheet/Menu per group + submit + confirm +
  error-state sequences.
- [ ] Lightweight smoke/layout checks only for 768/1024, EN-Light, AR-Dark;
  expand ONLY a failing dimension (per 00_MASTER_PLAN.md Verification Policy).
- [ ] Affected detail/form groups only (no full admin crawl).

## Technical QA (Phase Gate — run once)

- [ ] `npm run typecheck`, `npm run lint`, production build green
  (milestone phase — build mandatory).
- [ ] Targeted admin detail/form E2E (plan35/plan36 suites where applicable)
  green; console clean. No unrelated suites.
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
