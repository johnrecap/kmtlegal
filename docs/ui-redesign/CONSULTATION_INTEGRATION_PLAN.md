# Integration of selected direction 02

Status: implementation subsequently authorized by the owner and present locally. The original sequence below is retained as the acceptance contract; current verification/Git/server state is in the implementation register. Follow [CONSULTATION_DESIGN.md](CONSULTATION_DESIGN.md) and [DECISIONS.md](DECISIONS.md). No Spec Kit, subagents, dependency or AI/provider change. The later spacious-reading request overrides the small prototype log: bounded remaining-height message scroll, anchored composer and preserved history position.

## Scope and journeys

Only existing consultation/chat surfaces and the booking dialog; no new routes, navigation system, admin redesign or database migration. A visitor asks about office services, explicitly starts booking, selects a published day/time, enters contacts/channel, reviews and consents, then confirms. Staff takeover remains visibly distinct and stops automatic assistant responses. Existing guest/account follow-up, error/retry, edit and cancellation paths remain.

Conversation order: compact KMT introduction; header; chronological customer/assistant/staff bubbles; expandable one-to-four-line composer with wait/status; explicit booking/account actions and concise help. Dialog order: title/close; short note; collapsed consultation schedule; nearest available action; seven-day navigation/direct date; selected-day reason and clocks; contacts/channel; review/consent; footer confirmation. No permanent stepper. Responsive layout follows the selected contract.

## Implementation sequence and dependencies

1. Inspect the current conversation panel, intake form, picker, native dialog/Button primitives, catalogs and shared tokens. Map prototype classes to current components; do not ship the prototype runtime or synthetic data. Preserve unrelated chrome and owner-locked component families.
2. Build the selected conversation treatment first using existing production state and copy: bubbles, log/composer geometry, loading/retry/staff states. Verify representative Arabic light desktop plus dark mobile against supplied visual authority before scaling.
3. Apply the rounded/stacked booking appearance to the existing picker/form/dialog. Preserve live weekly/day/slot DTOs, contact retention, selection/consent reset, date-search race protection and global-empty fallback. Footer participates in layout and never covers the final input/review.
4. Reconcile localized presentation copy with the current catalogs. No duplicated translation framework; preserve actual business text, no sample dates/hours/fees. Reuse approved mark/fonts and inline icons. Any genuinely new component/library choice needs separate authorization under existing component rulings.
5. Run affected browser/server regressions, TypeScript, lint, build and diff review; update guide/register/runbook. After a separately authorized production slice passes, commit/push and hand off the actual aaPanel/PM2 update command. Local visual selection alone is not deployment authorization.

## QA and completion criteria for that slice

- AR/EN, light/dark, 360/390/1440px; current production routes and real component state. Compare geometry/type/colors/spacing with selected screenshot and local tokens; account for real copy lengths.
- Normal, sending, failed/retry, unavailable/closed/full day, globally empty/unpublished schedule, review/validation, success, edit/cancel and staff ownership. Preserve same message/booking identifiers and absence of duplicate side effects.
- Keyboard/focus/Escape, reduced motion, contrast, no horizontal overflow, unobstructed footer, contact retention and slot/consent reset. Physical mobile keyboard needs an actual device or a documented unverified limitation.
- Existing backend contracts/auth/CSRF/consent and server-derived Cairo schedule remain authoritative. Browser/SQL regressions cannot certify real model wording; post-deployment provider conversation remains separate.

Risks reviewed: consultation CSS is scoped; footer occupies layout space and submits its associated native form; product state/API remain in their original owners. Long-message/polling and closed-day/consent/lost-response cases are checked on the real components. Actual device keyboard and non-Chromium rendering remain unverified. The next operational step after verified Git delivery is the owner's existing server update script, followed by fresh production acceptance.
