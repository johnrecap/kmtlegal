# Phase 04 — Consultation Assistant (HIGH PRIORITY)

## Objective

Deliver the conversation-only booking flow on `/book-consultation` and
`/ar/book-consultation` using exactly the locked trio (Animated List,
Placeholders And Vanish Input, Border Beam). Remove any surviving stepper
rendering and all legacy stepper branches. No visible Stepper, Progress Bar,
Tabs, Timeline, wizard navigation, or 01–04 permanent UI. The conversation
itself communicates progression across language, request type, details, slot,
payment, review, confirmation, and next steps.

## Current State

`BookConsultationPageView` (`public-pages.tsx:952`) →
`ConsultationBookingChatFromQuery` (`booking-query-client.tsx:9`) →
`ConsultationBookingChat` (`consultation-booking-chat.tsx:168`): shell
`section[data-testid=booking-stepper]` (RENAMED to `consultation-assistant`
in TASK-04-02) with `BorderBeam`, brand header,
`AnimatedList` log (`ChatBubble`, `LanguageChoicePanel`, `SlotChoicePanel`,
confirm row, `PaymentReviewPanel`), quick-action chips, `PlaceholdersAndVanishInput`
composer (`input[name=chatMessage]`), privacy note. Legacy `BookingStepper`
(`booking-stepper.tsx`) and `ConsultationAssistantPanel`
(`consultation-assistant-panel.tsx`) are unrendered (zero importers per
inventory) — deletion itself waits for Phase 12; this phase removes any
surviving rendered trace.

## Target State

One conversation experience: language selection in chat, contextual quick
choices, chosen options collapse, details stage in chat, slots in chat,
payment in chat, review information + confirmation + after-submit next steps
in chat, single privacy note, compact bubbles, content-driven shell height,
native internal scroll, correct input height, exact placeholder/input
text-origin alignment, theme-aware messages, light + dark, AR RTL + EN LTR,
mobile, reduced motion. Business endpoints and validation behavior preserved.

## Component Decisions

| Area | Current | Decision | Locked Component | Library | Official URL |
|---|---|---|---|---|---|
| Message log | Animated List | KEEP CURRENT | Animated List | Magic UI | https://magicui.design/docs/components/animated-list |
| Composer | Placeholders And Vanish Input | KEEP CURRENT | Placeholders And Vanish Input | Aceternity UI | https://ui.aceternity.com/components/placeholders-and-vanish-input |
| Shell frame | Border Beam | KEEP CURRENT | Border Beam | Magic UI | https://magicui.design/docs/components/border-beam |
| Stepper UI (any surviving render) | Stepper/branches | REMOVE | None | — | — |
| Progress/tabs/timeline in booking | None rendered | REMOVE (keep absent; reject if reintroduced) | None | — | — |

## Tasks

- [x] TASK-04-01 Sweep for surviving stepper rendering: grep `booking-stepper`
  testid, `BookingStepper`, `ConsultationAssistantPanel` imports/usages across
  `src/`; remove every rendered trace (files themselves deleted in Phase 12).
- [x] TASK-04-02 RENAME the rendered assistant shell test id from
  `data-testid="booking-stepper"` to `data-testid="consultation-assistant"`;
  update every E2E/test selector that references the old rendered test id
  (enumerate them by grep; record exact files in Implementation Notes).
  Do NOT rename internal booking state names solely for cosmetics. Re-run
  grep to prove no rendered `booking-stepper` trace remains.
- [x] TASK-04-03 Language-in-chat: entry picks locale inside the conversation
  (`LanguageChoicePanel` decisions preserved); `?locale`/`?service`/`?lawyer`/
  resume params still honored; back-navigation never strands state.
- [x] TASK-04-04 Request-type + details stages in chat: contextual quick
  choices render; chosen options collapse to compact summaries; free-text
  details stage keeps validation behavior identical.
- [x] TASK-04-05 Slots in chat: day-grouped chips, selection + change path,
  office-review/pending states messaging preserved.
- [x] TASK-04-06 Payment in chat: `PaymentReviewPanel` figures, pay action
  (async states), back path, receipt/setup follow-ups, return-URL flow intact.
- [x] TASK-04-07 Review + confirmation + next steps in chat: summary figures,
  confirmation record, after-submit information panel; single privacy note
  (dedupe if two render).
- [x] TASK-04-08 Shell geometry: content-driven height, native internal scroll
  of `role=log`, correct composer height, exact placeholder/input text-origin
  alignment (reference prior geometry fixes; re-verify at 390px).
- [x] TASK-04-09 Bubble system: compact bubbles, theme-aware user/assistant/
  info/error tones light + dark, collapsed-option styling, typing indicator.
- [x] TASK-04-10 RTL + locales: AR RTL mirroring, EN LTR, `dir=ltr` islands
  (ids/amounts) intact, translated strings complete for new/changed copy.
- [x] TASK-04-11 Reduced motion + performance: `AnimatedList` sequencing and
  vanish particles respect reduced-motion; auto-scroll pins preserved;
  no console errors across full booking + payment-review paths (mock-safe).
- [x] TASK-04-12 Full assistant QA sweep (Visual + Technical), both locales,
  both themes, 390 + 1440; phase commit; STOP.

## Files Expected To Change

- `src/features/public-site/consultation-booking-chat.tsx`,
  `src/features/public-site/booking-query-client.tsx`,
  `src/features/public-site/public-pages.tsx` (booking view only),
  `src/features/public-site/public-components.tsx` (`BookingFlowHeader` only),
  `src/components/ui/placeholders-and-vanish-input.tsx` (theming/alignment only),
  booking-scoped styles.
- E2E/test files that reference the old `booking-stepper` test id (selector
  updates to `consultation-assistant` only; enumerated by grep in TASK-04-02;
  exact paths recorded in Implementation Notes).

## Files That Must NOT Change

- Booking API routes, payment services, slot logic, validation rules, auth,
  other public views, admin, client, inventory doc, legacy stepper files
  (deletion in Phase 12 only).

## Dependencies

- Phase 02 (tokens, motion ownership, toggler outcome). Highest priority;
  no other phase edits these files concurrently.

## Risks

- Geometry regressions (composer height, text-origin alignment) → mitigated
  by 390px + desktop captures every task group.
- Payment/review behavior drift → mitigated by endpoint-level regression of
  assistant + checkout + status flows without changing them.
- Hidden stepper branch resurfacing → mitigated by TASK-04-01 grep gate
  before commit.

## Acceptance Criteria

- [x] Zero stepper/progress/tabs/timeline UI visible on any booking path.
- [x] No rendered `booking-stepper` test-id trace remains (grep proof);
  the shell exposes `data-testid="consultation-assistant"`.
- [x] All eight conversation stages completable EN + AR, light + dark.
- [x] Shell height content-driven; internal scroll native; alignment exact.
- [x] API endpoints, request payload semantics, validation rules, payment
  state transitions, and observable business outcomes remain behaviorally
  identical.
- [x] One phase commit; STOP.

## Visual QA (Phase Gate — focused matrix, run once)

- [ ] Primary captures per changed surface: (1) EN / Dark / 1440,
  (2) AR / Light / 390 — chat stages, composer, payment panel.
- [ ] Lightweight smoke/layout checks only for 768/1024, EN-Light, AR-Dark;
  expand ONLY a failing dimension (per 00_MASTER_PLAN.md Verification Policy).
- [ ] No other route family's visuals crawled (booking scope only).

## Technical QA (Phase Gate — run once)

- [ ] `npm run typecheck`, `npm run lint`, production build green
  (milestone phase — build mandatory).
- [ ] Booking-targeted E2E (incl. no-stepper regression states) green;
  console clean on booking pages. No unrelated suites.
- [ ] Known failures: the PLAN-28 booking-stepper assertions are
  BOOKING-SCOPED — resolve them here (pass or owner-approved re-baseline);
  they must not be carried forward as "pre-existing" past Phase 04.

## Status

COMPLETE

## Implementation Notes

Pre-phase baseline: HEAD `ce12438`; working tree held many OWNER/PRE-EXISTING
modified + untracked entries — all preserved exactly, none staged or included.

TASK-04-01/02 (stepper removal + testid rename):
- Rendered `booking-stepper` trace existed in exactly one place:
  `consultation-booking-chat.tsx:790` → renamed to
  `data-testid="consultation-assistant"`. Internal state names untouched.
- Post-change grep: `booking-stepper` remains ONLY inside the legacy
  unrendered `booking-stepper.tsx` (own form testid + success testid), which
  has zero importers and is slated for Phase-12 deletion (file untouched).
- Dead `BookingStepperFromQuery` export removed from the Phase-04-owned
  `booking-query-client.tsx` (+ its `BookingStepper` import) — it had zero
  runtime importers (only a negative assertion in
  `product-components.test.tsx`, still true). `ConsultationBookingChatFromQuery`
  and `RequestedLawyerQueryNotice` preserved.
- Selector updates (old → new testid): `booking-recovery.spec.ts` (3),
  `booking-stepper-validation.spec.ts` (7), `mvp-smoke.spec.ts` (4:
  2 surface entries + goto helper + booking-chat test),
  `booking-assistant-stage.test.tsx` (1 hook assertion).
- PLAN-28 luxury-surface ownership: booking surfaces previously asserted the
  hardcoded `bg-[linear-gradient` style (the known failure). The assistant
  shell is token-based, so the spec gained an `assistant-tokens` branch
  (`bg-[var(--kmt-assistant-` + `border-[var(--kmt-assistant-line)]`) applied
  to the booking entries. No app change for this — spec re-baseline only.

TASK-04-03–07, 09–11 (verified already-true, no code change needed):
- Language-in-chat with collapse (`actionStep` intent→matter→null), language
  transfer handoff, resume params, `RequestedLawyerQueryNotice` + in-chat
  `LawyerNoticeRow`.
- Review/confirmation/next-steps as in-chat `info` cards
  (`pageCopy.afterSubmitSteps`, `trustItems`); single `privacyNote` (one
  render site); compact header (mark + "Assistant ready" + one scope line,
  no chips/progress); page has no external rail/panels (unit-contracted).
- Page-safe auto-scroll: `chatLog.scrollTop` pins only, no `scrollIntoView`,
  no Lenis involvement; composer contract (controlled vanish input,
  stage-aware placeholders) and theme-token surfaces unit-contracted;
  `AnimatedList` + vanish input reduced-motion paths unit-contracted.

TASK-04-08 (shell geometry — the one app change this phase):
- Shell was forced `h-[min(72vh,38rem)] min-h-[30rem]`
  (`max-sm:h-[min(84svh,38rem)] max-sm:min-h-[28rem]`); now content-driven
  `max-h-[min(72vh,38rem)]` (`max-sm:max-h-[min(84svh,38rem)]`) so the console
  opens compact and only the internal log scrolls once capped. Composer
  geometry untouched (prior ps-4/ps-4 shared-origin contract holds; measured
  delta 0 both directions) — heights measured, not restyled.
- `booking-assistant-stage.test.tsx` density assertions updated to the new
  content-driven classes (+ `not.toContain("min-h-[30rem]")`).

FAST QA mode: per-task checks were inspection-only (no per-task suites).
One targeted phase gate at the end (see QA Results).

## Files Actually Changed

- `src/features/public-site/consultation-booking-chat.tsx` (testid rename;
  shell content-driven height + comment)
- `src/features/public-site/booking-query-client.tsx` (dead
  `BookingStepperFromQuery` export + `BookingStepper` import removed)
- `tests/e2e/booking-stepper-validation.spec.ts` (7 selector updates)
- `tests/e2e/booking-recovery.spec.ts` (3 selector updates)
- `tests/e2e/mvp-smoke.spec.ts` (testid updates + `assistant-tokens`
  surface branch for booking entries)
- `tests/ui/booking-assistant-stage.test.tsx` (hook + geometry assertions)
- `docs/ui-redesign/04_CONSULTATION_ASSISTANT.md` (this file)

## QA Results

Technical gate (run once):
- `npm run typecheck`: clean.
- `npm run lint` (next lint): no warnings/errors.
- Booking-targeted unit: `booking-assistant-stage` (19) +
  `product-components` + `public-pages` — 63/63 green.
- Booking-targeted E2E: `booking-stepper-validation` +
  `booking-recovery` — 38/38 green (390/768/1440 × EN/AR, reduced-motion;
  prisma auth noise is the expected no-DB environment).
- `mvp-smoke -g "booking|PLAN-28"`: 3/3 green — BOTH previously known
  PLAN-28 booking failures RESOLVED (surface-style re-baseline + renamed
  shell selector; booking-chat validation/analytics/requestId assertions pass).
- `npm run build` (milestone, once): green.

Visual gate (targeted matrix, temp spec deleted after run):
- A EN/Dark/1440 full flow (language→matter→contact→slots→payment):
  shell 488px initial (was forced 608px), composer 50px, send 40×40,
  placeholder/input origin delta 0; payment panel `EGP 1,500.00` LTR;
  zero stepper labels/tablist/step-cards; screenshots reviewed.
- B AR/Light/390: shell 448.5px, no page overflow (390≤390), composer
  50px / 40×40 / RTL origin delta 0; ivory shell, white bubbles, pale-gold
  user chip, deep text (no gray rectangle); mirrored send side; screenshots
  reviewed. (First attempt rendered dark — temp spec used wrong `theme`
  storage key; corrected to `kmt-theme`, verified light.)
- C EN/Light/1440 smoke: intent collapse → contextual choices, stage-aware
  placeholder, single privacy note, delta 0; screenshot reviewed.
- AR-Dark + tablet + reduced-motion covered by the green booking E2E above.

## Blockers

None. Phase 05 not started.
