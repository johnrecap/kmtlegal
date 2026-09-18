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
`section[data-testid=booking-stepper]` with `BorderBeam`, brand header,
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

- [ ] TASK-04-01 Sweep for surviving stepper rendering: grep `booking-stepper`
  testid, `BookingStepper`, `ConsultationAssistantPanel` imports/usages across
  `src/`; remove every rendered trace (files themselves deleted in Phase 12).
  Re-run grep to prove zero.
- [ ] TASK-04-02 Language-in-chat: entry picks locale inside the conversation
  (`LanguageChoicePanel` decisions preserved); `?locale`/`?service`/`?lawyer`/
  resume params still honored; back-navigation never strands state.
- [ ] TASK-04-03 Request-type + details stages in chat: contextual quick
  choices render; chosen options collapse to compact summaries; free-text
  details stage keeps validation behavior identical.
- [ ] TASK-04-04 Slots in chat: day-grouped chips, selection + change path,
  office-review/pending states messaging preserved.
- [ ] TASK-04-05 Payment in chat: `PaymentReviewPanel` figures, pay action
  (async states), back path, receipt/setup follow-ups, return-URL flow intact.
- [ ] TASK-04-06 Review + confirmation + next steps in chat: summary figures,
  confirmation record, after-submit information panel; single privacy note
  (dedupe if two render).
- [ ] TASK-04-07 Shell geometry: content-driven height, native internal scroll
  of `role=log`, correct composer height, exact placeholder/input text-origin
  alignment (reference prior geometry fixes; re-verify at 390px).
- [ ] TASK-04-08 Bubble system: compact bubbles, theme-aware user/assistant/
  info/error tones light + dark, collapsed-option styling, typing indicator.
- [ ] TASK-04-09 RTL + locales: AR RTL mirroring, EN LTR, `dir=ltr` islands
  (ids/amounts) intact, translated strings complete for new/changed copy.
- [ ] TASK-04-10 Reduced motion + performance: `AnimatedList` sequencing and
  vanish particles respect reduced-motion; auto-scroll pins preserved;
  no console errors across full booking + payment-review paths (mock-safe).
- [ ] TASK-04-11 Full assistant QA sweep (Visual + Technical), both locales,
  both themes, 390 + 1440; phase commit; STOP.

## Files Expected To Change

- `src/features/public-site/consultation-booking-chat.tsx`,
  `src/features/public-site/booking-query-client.tsx`,
  `src/features/public-site/public-pages.tsx` (booking view only),
  `src/features/public-site/public-components.tsx` (`BookingFlowHeader` only),
  `src/components/ui/placeholders-and-vanish-input.tsx` (theming/alignment only),
  booking-scoped styles.

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

- [ ] Zero stepper/progress/tabs/timeline UI visible on any booking path.
- [ ] All eight conversation stages completable EN + AR, light + dark.
- [ ] Shell height content-driven; internal scroll native; alignment exact.
- [ ] Business behavior (endpoints, validation, payment flow) byte-identical.
- [ ] One phase commit; STOP.

## Visual QA

- [ ] Stage-by-stage captures (language → confirmation) × locale × theme.
- [ ] 390px composer + bubbles + payment panel captures.

## Technical QA

- [ ] `npm run typecheck`, `npm run lint`, production build green.
- [ ] Booking E2E (incl. no-stepper regression states) green; console clean.

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
