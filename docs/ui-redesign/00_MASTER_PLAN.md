# Phase 00 — Master Plan (Execution Index)

> PLANNING ONLY. No application source code is modified by any file in
> `docs/ui-redesign/`. Future implementation runs execute ONE phase at a
> time on explicit `START PHASE XX` command only.

## Source Of Truth

- Current-UI facts: `docs/KMT_COMPLETE_UI_INVENTORY.md` (72 URL patterns /
  60 `page.tsx` files / 50 shared components / 34 page-specific components).
- Locked component decisions: `docs/ui-redesign/COMPONENT_SOURCE_MATRIX.md`.
- Locked owner rulings: `docs/ui-redesign/DECISIONS.md`.
- This directory holds the only files this planning run creates or edits.

## Execution Model

Future workflow for every phase:

1. Receive `START PHASE XX` (one phase only; never start a second phase).
2. Open the matching phase file in `docs/ui-redesign/`.
3. Mark phase `Status` as `IN PROGRESS`.
4. Execute tasks in listed order (`TASK-XX-01`, `TASK-XX-02`, …).
5. Test after each logical task group (Visual QA + Technical QA sections).
6. Update checkboxes as tasks complete.
7. Record files in `Files Actually Changed`.
8. Record evidence in `QA Results` and `Implementation Notes`.
9. Record impediments in `Blockers` (use `BLOCKED — OWNER DECISION REQUIRED`
   format; never select a substitute component).
10. Mark `COMPLETE` only when every Acceptance Criterion passes.
11. STOP. Wait for the next explicit `START PHASE XX` command.

Valid statuses only: `NOT STARTED` / `IN PROGRESS` / `BLOCKED` / `COMPLETE`.
During this planning run every phase remains `NOT STARTED`.

## Commit Strategy (Per Implementation Phase)

A. Record baseline / pre-phase state (commit hash + failing-or-passing QA).
B. Implement the phase tasks in order.
C. Run the phase Visual QA + Technical QA.
D. Create ONE phase commit (phase scope only).
E. STOP. Never combine several redesign phases into one commit.

## Decision Language (Mandatory In Every Phase File)

Every component-selection instruction uses exactly one of:

- `KEEP CURRENT`
- `REPLACE WITH: <exact component>`
- `REMOVE`

## Component Rules (Binding On All Phases)

1. READY-MADE COMPONENT FIRST: when the matrix locks a component, integrate
   the real component. No custom imitation, no simplified clone, no
   "inspired by" rebuild.
2. Custom code is allowed only for composition, layout, wrappers, theme
   tokens, spacing, data mapping, business integration, responsive layout,
   RTL, accessibility, and small non-distinctive utility styles.
3. COMPONENT SELECTION IS OWNER-LOCKED. The model never picks a substitute.
4. BLOCKED RULE: on genuine technical incompatibility, mark the task
   `BLOCKED — OWNER DECISION REQUIRED` with approved component, library,
   exact problem, affected file, dependency/version issue, build/runtime
   error, evidence, and blocked functionality. Then STOP that task.
5. FREE components only, from Aceternity UI, Magic UI, Animate UI, shadcn/ui.

## Phase Map

| Phase | Name | File | Depends On | Exit Gate |
|---|---|---|---|---|
| 01 | Scope + deferred public content | `01_SCOPE_AND_DEFERRED_CONTENT.md` | Inventory | `DECISION REQUIRED` block answered by owner (KEEP PUBLIC / HIDE PUBLIC / DELETE × Articles, Case Studies, Media) |
| 02 | Foundations + public chrome | `02_FOUNDATIONS_AND_PUBLIC_CHROME.md` | 01 | Tokens + motion-ownership table landed; header/dock/footer stable EN+AR, light+dark |
| 03 | Homepage | `03_HOME_PAGE.md` | 01, 02 | All home sections pass QA; Insights handled per Phase 01 ruling |
| 04 | Consultation Assistant | `04_CONSULTATION_ASSISTANT.md` | 02 | Conversation-only booking flow passes QA; no stepper UI visible |
| 05 | Services + Team | `05_SERVICES_AND_TEAM.md` | 01, 02 | Glowing-Effect services, Focus-Cards team, dossier/detail + mobile Accordions pass QA |
| 06 | Remaining public core | `06_REMAINING_PUBLIC_CORE.md` | 02 (01 for exclusions) | Contact/Policy/Setup/Return/Receipt/Login/Install pass QA |
| 07 | Client foundations | `07_CLIENT_FOUNDATIONS.md` | 02 | Client shell/nav/tokens/panels/pagination stable; no page redesigns yet |
| 08 | Client pages | `08_CLIENT_PAGES.md` | 07 | All 8 client pages pass QA on locked components |
| 09 | Admin foundations | `09_ADMIN_FOUNDATIONS.md` | 02 | Shared admin primitives built once, shown in Design Lab; shared DashboardShell chrome wiring included; no admin content-page wiring |
| 10 | Admin list pages | `10_ADMIN_LIST_PAGES.md` | 09 | All admin lists on standard list architecture pass QA |
| 11 | Admin detail/forms | `11_ADMIN_DETAIL_AND_FORM_PAGES.md` | 09, 10 | All admin detail/form groups pass QA on locked shared components |
| 12 | Cleanup + Design Lab | `12_CLEANUP_AND_DESIGN_LAB.md` | 03–11 | Legacy dead code removed per deletion protocol; Design Lab complete |
| 13 | Final QA + release | `13_FINAL_QA_AND_RELEASE.md` | 12 | Full viewport/locale/theme matrix + typecheck/lint/build/tests green |

## Global Non-Goals (All Phases)

- No backend, API, database, auth-logic, or business-rule changes.
- No route additions or removals except exactly what the Phase 01 owner
  ruling directs (hide/delete of deferred public content only).
- No new animation libraries, no marketing effects in admin/client
  productivity surfaces, no third dock action, no stepper/progress-bar UI
  in booking.
- `docs/KMT_COMPLETE_UI_INVENTORY.md` stays frozen as the pre-redesign
  record; redesign evidence lives in each phase file.

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
