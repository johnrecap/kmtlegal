# Phase 06 — Remaining Public Core

## Objective

Bring Contact, Privacy, Terms, Client Account Setup, Payment Return, Payment
Receipt, Login, and Install onto the locked components (Stateful Button,
Accordion, Scroll Progress) with full theming. Exclude Articles, Case
Studies, and Media unless the Phase 01 ruling is reversed by the owner.

## Current State

- Contact (`ContactPageView`, `public-pages.tsx:880`): `PageHero` + grid;
  `ContactForm` (`contact-form.tsx:42`) with `ShimmerButton` submit;
  branch `publicPanel` asides + WhatsApp panel (`ButtonLink` external).
- Privacy/Terms (`:982`, `:1061`): `PublicSection` h1 + `lg:[260px_1fr]`
  sticky `PolicyToc` aside + long-form article; local `ReadingProgress`
  bar on article detail only (policy pages have no progress bar today).
- Setup (`client-account-setup-page.tsx:22` + `-form.tsx:40`): status-aware
  card + `ConsultationSummary` aside; plain submit `button` + spinner.
- Return (`(public-ar)/payment/consultation/return/page.tsx`): status-toned
  card + `PaidConfirmation` + `PaymentStatusPoller` + `StatusItem` cards +
  action buttons.
- Receipt (`consultation-payment-receipt-document.tsx` + print button):
  standalone light document, `print:` variants.
- Login (`(login)/login/page.tsx` + `login-form.tsx`): split layout + `Card`
  form + loading `Button`.
- Install (`install-wizard.tsx`): 4 numbered `Card`s + status aside; plain
  buttons.

## Target State

Stateful Button drives every async submit (contact, setup, return retry/pay,
login, install bootstrap/preflight/finish). Accordion drives mobile-only
collapsible groups (contact branches, policy TOC, setup summary, install
groups). Scroll Progress drives policy reading progress. Receipt keeps its
current print-first document. The Contact WhatsApp card is REMOVED; WhatsApp
remains available through the global Floating Dock. Contact retains the
contact form, office/branch information, and phone/email links.
Deferred content untouched.

## Component Decisions

| Area | Current | Decision | Locked Component | Library | Official URL |
|---|---|---|---|---|---|
| Contact submit | ShimmerButton submit | REPLACE WITH: Aceternity UI Stateful Button | Stateful Button | Aceternity UI | https://ui.aceternity.com/components/stateful-button |
| Contact branch details (mobile) | Static stacked panels | REPLACE WITH: Animate UI Accordion | Accordion | Animate UI | https://animate-ui.com/docs/components/radix/accordion |
| Contact WhatsApp card | ButtonLink external WhatsApp card | REMOVE | None | — | — |
| Policy reading progress | None on policy pages | REPLACE WITH: Magic UI Scroll Progress | Scroll Progress | Magic UI | https://magicui.design/docs/components/scroll-progress |
| Policy mobile TOC | Stacked TOC | REPLACE WITH: Animate UI Accordion | Accordion | Animate UI | https://animate-ui.com/docs/components/radix/accordion |
| Setup submit | Plain button + spinner | REPLACE WITH: Aceternity UI Stateful Button | Stateful Button | Aceternity UI | https://ui.aceternity.com/components/stateful-button |
| Setup mobile summary | Stacked aside | REPLACE WITH: Animate UI Accordion | Accordion | Animate UI | https://animate-ui.com/docs/components/radix/accordion |
| Return async action | Plain pay/retry buttons | REPLACE WITH: Aceternity UI Stateful Button | Stateful Button | Aceternity UI | https://ui.aceternity.com/components/stateful-button |
| Receipt document | Current print-first doc | KEEP CURRENT | None | — | — |
| Login submit | Loading Button | REPLACE WITH: Aceternity UI Stateful Button | Stateful Button | Aceternity UI | https://ui.aceternity.com/components/stateful-button |
| Install groups | Numbered Cards | REPLACE WITH: Animate UI Accordion (groups only; card content kept) | Accordion | Animate UI | https://animate-ui.com/docs/components/radix/accordion |
| Install async actions | Plain buttons | REPLACE WITH: Aceternity UI Stateful Button | Stateful Button | Aceternity UI | https://ui.aceternity.com/components/stateful-button |

## Tasks

- [ ] TASK-06-01 Vendor/install the official Aceternity Stateful Button and
  Magic Scroll Progress (verbatim sources; record URL + version); reuse the
  Phase 05 Accordion; verify themes + RTL + reduced-motion for all three.
- [ ] TASK-06-02 Contact: submit → Stateful Button wired to the existing
  `ContactForm` states (idle → loading → success/error + newMessage reset);
  fields, validation rules, error/success presentation, and observable submit
  outcomes remain behaviorally identical.
- [ ] TASK-06-03 Contact mobile: branch/office details → Accordion; REMOVE
  the WhatsApp card; keep office/branch information and `tel:`/`mailto:`
  links tappable; WhatsApp remains available through the global Floating
  Dock only. No new WhatsApp CTA card is added.
- [ ] TASK-06-04 Policy: Scroll Progress bar mounted (offset below sticky
  header, `scaleX` without layout shift); desktop sticky TOC kept; mobile
  TOC → Accordion with anchor navigation + `scroll-mt` preserved.
- [ ] TASK-06-05 Setup: submit → Stateful Button (validation + status +
  redirect behavior preserved); mobile consultation summary → Accordion;
  expired/existing-account branches intact.
- [ ] TASK-06-06 Return: pay/retry async action → Stateful Button (polling +
  countdown + status tones untouched); receipt/setup/new-booking links intact.
- [ ] TASK-06-07 Receipt: print-first pass only (readability, `print:` variants,
  `dir=ltr` islands); no animated component added.
- [ ] TASK-06-08 Login: submit → Stateful Button (validation, alert, redirect,
  readiness-blocked variant intact); language link + security note kept.
- [ ] TASK-06-09 Install: 4 groups → Accordion (content + order kept);
  bootstrap/preflight/finish → Stateful Buttons (gates + notices preserved);
  internal-only route; full AR RTL verification included.
- [ ] TASK-06-10 AR sweep: every page above in Arabic RTL; translated strings
  complete for new/changed copy; `dir` islands intact.
- [ ] TASK-06-11 Full sweep EN+AR × light+dark × 390/1440 + submit-state
  captures; phase commit; STOP.

## Files Expected To Change

- `contact-form.tsx`, `public-pages.tsx` (contact/policy views),
  `policy-toc.tsx`, `client-account-setup-form.tsx` +
  `-page.tsx`, payment return page, receipt styles (print only),
  `login-form.tsx` + login page, `install-wizard.tsx`, vendor files for
  Stateful Button + Scroll Progress.

## Files That Must NOT Change

- Contact/booking/payment/auth APIs, validation rules, poller timing logic,
  home/services/team/booking views, admin, client, deferred public content,
  routes, inventory doc.

## Dependencies

- Phase 02 (tokens, toggler outcome), Phase 05 (Accordion vendor pattern).
  Blocked on nothing else; excludes Phase 01-deferred pages.

## Risks

- Stateful Button async contract (`onClick` promise → success state) vs
  existing form-submission flows → mitigate by wrapping, not rewriting,
  submit handlers; keep native `type="submit"` support.
- Scroll Progress offset vs sticky header height → verify per breakpoint.
- Install is rarely exercised → run its full wizard path in QA explicitly.

## Acceptance Criteria

- [ ] Every listed submit is a Stateful Button with correct async states.
- [ ] Every listed mobile group uses Accordion; desktop layouts kept.
- [ ] Contact WhatsApp card removed (grep proof); contact form, office/branch
  information, and phone/email links intact; no new WhatsApp CTA card added.
- [ ] Policy progress bar present without layout shift.
- [ ] Receipt unchanged in behavior; print output verified.
- [ ] EN+AR × light+dark × 390/1440 pass; one phase commit; STOP.

## Visual QA

- [ ] Submit-state sequences (idle/loading/success/error) captures.
- [ ] Accordion + progress captures per page × theme.

## Technical QA

- [ ] `npm run typecheck`, `npm run lint`, production build green.
- [ ] Form-submit + payment-poller + login + install E2E pass.

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
