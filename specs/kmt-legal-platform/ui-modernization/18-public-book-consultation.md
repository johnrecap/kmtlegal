# 18 — Public Book Consultation (booking chat, EN + AR)

> Phase 2 · Depends on `00`, `01`, `10`. Highest-value public flow — preserve all existing behavior/a11y while modernizing.

## Routes

| Locale | URL | Source |
|---|---|---|
| EN | `/book-consultation` | `book-consultation/page.tsx` → `BookConsultationPageView` + `consultation-booking-chat.tsx` |
| AR | `/ar/book-consultation` | `ar/book-consultation/page.tsx` → same, `force-dynamic` |

## Components

ConsultationBookingChat (language gate, quick-action chips, BookingProgress 4-step, slot picker, payment review panel, typing indicator, error recovery), trust sidebar, `booking-query-client.tsx` wrappers, payment-status-poller (shared).

## Issues (audit)

- [P1] **`consent: true` hardcoded into checkout payload with no consent UI** (`consultation-booking-chat.tsx:628`; copy exists at `public-content.en.ts:472`).
- [P1] `font-serif` leaks Georgia into chat title + payment review (`consultation-booking-chat.tsx:696,983`).
- [P1] `rounded-full` = 12px squares on avatars/send/chips (config bug; verify post-fix).
- [P2] `tracking-[0.14em]/[0.12em]` on Arabic labels (`consultation-booking-chat.tsx:933,1011`).
- [P2] Booking Suspense fallback is an empty panel — no skeleton (`public-pages.tsx:688`).
- [P2] Chat locale vs page locale direction split (line 688) — by design, jarring.
- [P3] Progress grid doesn't collapse on mobile; labels truncate (`:837,849`); sub-12px text (`:813,842,846-847`); placeholder AA (`:133`); dead quick-chip styling (portal twin, `:138`).
- [P3] Legacy dead code: `booking-stepper.tsx` (366 lines), `consultation-assistant-panel.tsx`, `BookingStepperFromQuery`.

## Tasks

- [ ] T18.1 **Consent gate**: render consent copy + checkbox before payment review step; `consent` reflects actual state; block submit until checked; localized AR copy. (Behavior change — flagged in commit message.)
- [ ] T18.2 Rebuild chat surface on tokens: bubbles (user gold / assistant surface), real circular avatars (`rounded-full` post-fix), typing indicator with label, modern composer with focus ring; delete all `!important` patches; both themes verified.
- [ ] T18.3 Typography: replace `font-serif` with display-weight Plex; `text-[1.9rem]` → token; strip `tracking-*`/`uppercase` for `locale === "ar"` (lines 933, 1011); min text size 12px.
- [ ] T18.4 BookingProgress: responsive collapse (labels hide on mobile, dots + current label remain); no truncation of active step.
- [ ] T18.5 Skeleton Suspense fallback matching chat layout (T1.9).
- [ ] T18.6 Shared `normalizeText` helper moved to `src/lib/` and used in directory search (fixes Arabic search: "قانونيه" matches "قانونية").
- [ ] T18.7 Slot picker: day groups with token motion (selected state 150ms), keyboard nav kept; payment review `dl` kept, money via locale-aware `formatMoney`.
- [ ] T18.8 Error recovery: two-failure WhatsApp/contact fallback kept; error bubbles use danger state tokens (visible in both themes).
- [ ] T18.9 Dead code deletion: `booking-stepper.tsx`, `consultation-assistant-panel.tsx`, `BookingStepperFromQuery` re-export.
- [ ] T18.10 Mobile composer: 44px send button, sticky above keyboard viewport, `enterkeyhint="send"`.

## Verify

- [ ] Full booking e2e both locales: language gate → quick action → slot → consent → payment review (mock); resume-from-query flow.
- [ ] Draft transfer across language switch intact.
- [ ] Screenshots 375/768/1440 × EN/AR × themes; reduced-motion: no indicator animation, content complete.
