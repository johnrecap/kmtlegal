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
5. After each task or small task group: Level 1 fast task check (changed
   surface only — see Verification Policy).
6. Update checkboxes as tasks complete.
7. Record files in `Files Actually Changed`.
8. Record evidence in `QA Results` and `Implementation Notes`.
9. Record impediments in `Blockers` (use `BLOCKED — OWNER DECISION REQUIRED`
   format; never select a substitute component).
10. Run the Phase Gate ONCE (Level 2); mark `COMPLETE` only when every
    Acceptance Criterion passes.
11. STOP. Wait for the next explicit `START PHASE XX` command.

Valid statuses only: `NOT STARTED` / `IN PROGRESS` / `BLOCKED` / `COMPLETE`.
During this planning run every phase remains `NOT STARTED`.

## Verification Policy (Binding On All Phases)

Goal: fast iteration during implementation + targeted phase verification +
full exhaustive QA only at final release. Exactly THREE levels exist.

### Level 1 — Fast Task Check (during implementation)

After a task or small logical task group, verify ONLY what changed:
TypeScript/editor errors in touched files, the directly affected
page/component in the browser, the directly affected interaction, that
page's console, no obvious visual regression, and a targeted test only if
one already exists for that feature. DO NOT run after every task: full
typecheck, full lint, production build, full unit/E2E/smoke suites, all
locales/themes/viewports, or exhaustive screenshots. No repeats of
expensive checks unless later code could affect the result.

### Level 2 — Phase Gate (run ONCE per phase, after all tasks)

1. `npm run typecheck`. 2. `npm run lint`. 3. Targeted tests for the
features/routes changed in THIS phase only (Home→Home tests,
Booking→Booking tests, etc. — never unrelated suites). 4. Browser smoke of
the affected route family only (e.g. Phase 03 = Home; Phase 10 =
representative admin lists — full route census stays in Phase 13).
5. Focused visual QA: TWO primary captures per major changed surface —
(A) EN / Dark / 1440 and (B) AR / Light / 390 — which together cover
desktop/mobile × LTR/RTL × dark/light. 768px, 1024px, EN-Light, and
AR-Dark get lightweight smoke/layout checks only. If a failure appears in
one dimension, expand QA ONLY around that dimension (RTL fail → expand
Arabic; tablet fail → expand 768/1024; light fail → expand light).
Additional screenshots only for changed breakpoints, RTL-specific
behavior, theme-specific bugs, or interactions the primaries cannot show.

### Level 3 — Full Release QA (Phase 13 only)

The exhaustive matrix (390/768/1024/1440 × EN/AR × Light/Dark, keyboard,
focus, RTL, reduced motion, hydration, console, CLS, performance, full
unit, full E2E, production build) belongs to Phase 13. Do NOT duplicate
Phase 13-level QA in earlier phases.

### Production Build Policy

Full `npm run build` is mandatory ONLY at milestones: Phase 02
(foundations), 04 (booking), 06 (public complete), 08 (client complete),
11 (admin complete), 12 (deletion safety), 13 (release). Non-milestones
(03, 05, 07, 09, 10) run it ONLY if module/import architecture,
dependencies, or route/build behavior changed significantly — record why
if run.

### Known Failure Cache

A failure proven pre-existing, unrelated to the current phase, and owned
by a future phase is recorded once in phase notes and NEVER reinvestigated
(no clean-HEAD reproduction, no git archaeology, no root-cause work, no
large reruns) unless the current phase touches that code or the failure
changes. Later phases may note it still exists and continue. Example: the
PLAN-28 booking-stepper assertions belong to Phase 04.

### Investigation Budget

On any failure FIRST classify: (A) caused by current phase → fix; (B)
known pre-existing → record + continue; (C) unrelated/new external →
record, expand scope only if it blocks the phase; (D) uncertain → minimum
investigation to classify. No open-ended investigation, no proving
unrelated defects at length.

### Phase Completion

COMPLETE requires: scoped implementation works, no new attributable
blocker, Phase Gate passes, known unrelated failures documented. It does
NOT require unrelated suites to be green.

## Commit Strategy (Per Implementation Phase)

A. Record baseline / pre-phase state (commit hash + failing-or-passing QA).
B. Implement the phase tasks in order (Level 1 fast checks during work).
C. Run the Phase Gate ONCE (phase Visual QA + Technical QA sections).
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
| 02 | Foundations + public chrome | `02_FOUNDATIONS_AND_PUBLIC_CHROME.md` | 01 | Tokens + motion-ownership table landed; header/dock/footer stable EN+AR, light+dark; public navigation reflects final Phase 01 rulings (no Articles/Case Studies/Media entries, EN+AR) |
| 03 | Homepage | `03_HOME_PAGE.md` | 01, 02 | Homepage InsightsLedger removed with section rhythm preserved; Representative Matters kept; all home sections pass QA |
| 04 | Consultation Assistant | `04_CONSULTATION_ASSISTANT.md` | 02 | Conversation-only booking flow passes QA; no stepper UI visible |
| 05 | Services + Team | `05_SERVICES_AND_TEAM.md` | 01, 02 | Glowing-Effect services, Focus-Cards team, dossier/detail + mobile Accordions pass QA |
| 06 | Remaining public core | `06_REMAINING_PUBLIC_CORE.md` | 02, 03, 05 (01 final rulings) | Contact/Policy/Setup/Return/Receipt/Login/Install pass QA; Articles + Case Studies hidden from public routing/SEO (backend/admin preserved); Media public feature removed |
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
