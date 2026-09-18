# KMT Consultation Assistant Redesign — Correction Pass

Single unified intake console. All booking interaction lives inside one
assistant shell; the page holds only a compact intro, the assistant, and the
footer. Commit: correction pass (unified console).

## Phase 0 — Current audit

- **Issue:** the flow was split across the chat plus a "what happens next"
  side card (`BookingSupportPanel` + `SupportGlowGate`), an external
  duplicated progress legend (`BookingFlowHeader` steps), and an external
  "what happens after sending" rail (`AfterSubmitStrip`). The chat shell,
  bubbles, chips, and input used hard-coded dark surfaces, so light theme
  left the whole assistant black. Quick actions showed all services at once;
  the live log bypassed Animated List.
- **Tasks:** map every external booking UI element, map every hard-coded
  dark class in the chat, confirm which legacy components are dead code.
- **Files changed:** none (read-only audit).
- **Components used:** none.
- **Acceptance criteria:** full inventory of external UI + dark hard-coding.
- **Status:** COMPLETE.
- **Screenshots checked:** prior-pass AR/EN dark captures (baseline).

Dead code confirmed (never imported, left untouched per STOP rule):
`consultation-assistant-panel.tsx`, `booking-stepper.tsx`
(`BookingStepperFromQuery` has no importers).

## Phase 1 — Remove external flow UI

- **Issue:** side panel, external progress legend, after-submit rail.
- **Tasks:** migrate trust content and after-submit steps into in-chat info
  cards; delete the side panel + glow gate; strip the header legend; delete
  the rail component; recompose the page as one centered console.
- **Files changed:**
  - `src/features/public-site/public-pages.tsx` (centered `max-w-[64rem]`
    console, no grid/side/rail)
  - `src/features/public-site/public-components.tsx` (`BookingFlowHeader`
    without steps; `AfterSubmitStrip` deleted)
  - deleted `src/features/public-site/booking-support-panel.tsx`
  - deleted `src/features/public-site/support-glow-gate.tsx`
- **Components used:** none (removals only).
- **Acceptance criteria:** no "what happens next" side panel; no external
  progress; no external after-submit panel; nothing deleted without a
  migrated in-chat home (trustItems → what-next card; afterSubmitSteps →
  confirmation card; lawyer notice → in-chat system row).
- **Status:** COMPLETE.
- **Screenshots checked:** pending QA round (see Phase 8).

## Phase 2 — Assistant shell

- **Issue:** shell competed with side cards; header stacked five trust
  chips, oversized title, glowing status; fixed heights left giant empty
  space with one message; desktop spread into a side grid.
- **Tasks:** single dominant shell (themed line + hairline, beam kept);
  compact header (mark + name + status dot + one-line scope, then tabs);
  content-sized shell (`min-h` + `max-h`, log `min-h-[14rem]` flex-1);
  desktop console `max-w-[64rem]`; mobile full-width stacked.
- **Files changed:**
  - `src/features/public-site/consultation-booking-chat.tsx`
  - `src/features/public-site/public-pages.tsx`
- **Components used:** Magic Border Beam (kept, unchanged config).
- **Acceptance criteria:** header = mark/name/status/scope/progress only;
  no empty-space cavern on first paint; input never pushed out of view;
  mobile keeps header/progress/messages/actions/input with no hover
  dependency.
- **Status:** COMPLETE.
- **Screenshots checked:** pending QA round (see Phase 8).

## Phase 3 — Real MCP components

- **Issue:** Animated List staged only the intro; the live log was plain.
- **Tasks:** render the WHOLE conversation (messages + language/slot/
  confirm/payment panels) through the real vendored Animated List
  (`delay={160}`); keep the real Aceternity vanish composer with
  stage-aware placeholders from real copy; keep Animate UI Tabs as the
  internal stage system with themed overrides; keep one restrained gold
  beam. No new decorative components; support-panel glow removed with
  its panel.
- **Files changed:**
  - `src/features/public-site/consultation-booking-chat.tsx`
  - `src/content/public-content.en.ts`, `public-content.ar.ts`
    (`intentPrompt`, `matterPrompt`, `startNew`)
- **Components used:**
  - Aceternity Placeholders And Vanish Input —
    import `@/components/ui/placeholders-and-vanish-input`, rendered in the
    composer zone, `onSubmit={submitMessage}` / `value={freeMessage}` /
    `inputName="chatMessage"` / `formTestId="booking-chat-composer"`.
  - Magic Animated List — import `@/components/ui/animated-list`,
    wraps `messages.map(...)` + language/slot/confirm/payment children in
    `booking-chat-log`.
  - Magic Border Beam — import `@/components/ui/border-beam`, assistant
    shell, `size={90} duration={9} colorFrom="#eac987" colorTo="#a87830"`.
  - Animate UI Tabs — import `@/components/animate-ui`,
    `BookingStageTabs` inside the assistant header; triggers disabled
    (status, not navigation) with animated indicator + per-stage hint.
- **Acceptance criteria:** each component above is imported AND rendered
  (unit source contracts assert both); placeholders change per stage
  (pending/contact/details/slot/confirm/payment/inquiry); beam stays slow
  thin gold; no particles/3D/marquee/tilt anywhere near the assistant.
- **Status:** COMPLETE.
- **Screenshots checked:** pending QA round (see Phase 8).

## Phase 4 — Conversation flow

- **Issue:** one message in a large panel; permanent chips under every
  message; oversized floating language tab; no visible journey.
- **Tasks:** first run = greeting → language question → in-conversation
  language options → intent question + what-next card → book/inquire →
  contextual matter chips → server-driven follow-ups → slots → review →
  payment → confirmation card + one clear action (new request). Selections
  are recorded as user messages; option groups collapse on progress;
  max 2 intent chips / 4 matter chips, no "more" needed (4 real services).
- **Files changed:**
  - `src/features/public-site/consultation-booking-chat.tsx`
    (`actionStep` state machine, `AssistantInfoCard`, `startNewRequest`)
  - `tests/e2e/booking-stepper-validation.spec.ts` (matter-journey test)
- **Components used:** stage primitives from Phase 3 only.
- **Acceptance criteria:** language choice is chat history; matter choice is
  a user message and collapses options; after submit the same console shows
  confirmation + next steps + one action; booking state machine untouched
  (all API payloads/flows identical).
- **Status:** COMPLETE.
- **Screenshots checked:** pending QA round (see Phase 8).

## Phase 5 — Theme tokens

- **Issue (P0):** light theme left the assistant black: hard-coded
  `bg-black/*`, `bg-[#0e0b07]`, `text-white`, `text-amber-*`, `slate-*`
  across shell, log, bubbles, chips, input placeholder, tabs, slot/payment
  panels, typing indicator.
- **Tasks:** add `--kmt-assistant-*` tokens (`shell/log/bubble/user/input/
  text/muted/line/chip/avatar`) with warm-ivory light values in `:root`
  and deep-black dark values in `.dark`; repoint every chat surface;
  status dot uses `bg-current` with theme green; gold action buttons keep
  gold bg + `#120d07` text in both themes (verified contrast).
- **Files changed:**
  - `src/app/globals.css`
  - `src/features/public-site/consultation-booking-chat.tsx`
  - `src/content/public-content.en.ts`, `public-content.ar.ts`
    (`onlineNow` → "Assistant ready" / "المساعد جاهز")
- **Components used:** KMT theme tokens only.
- **Acceptance criteria:** zero `amber-/text-white/slate-/bg-black/bg-[#…]`
  in the chat source (unit contract); EVERY assistant surface changes
  between themes (shell, log, bubbles, chips, input, tabs, panels,
  typing); avatar plaque may stay dark.
- **Status:** COMPLETE.
- **Screenshots checked:** pending QA round incl. AR/EN light (see Phase 8).

## Phase 6 — RTL

- **Issue:** stage order and send direction must be logical, not faked.
- **Tasks:** section keeps `dir` from locale (visual order = logical
  order); tabs indicator uses rect math (no `offsetLeft`); send icon
  mirrored with `rtl:-scale-x-100`; Arabic stage order renders
  RIGHT→LEFT 01→04 natively.
- **Files changed:**
  - `src/features/public-site/consultation-booking-chat.tsx`
- **Components used:** existing Animate UI tabs primitive.
- **Acceptance criteria:** keyboard/focus order matches visual order;
  send points forward in both directions; no CSS-order hacks.
- **Status:** COMPLETE.
- **Screenshots checked:** pending QA round (see Phase 8).

## Phase 7 — Responsive

- **Issue:** side grid collapsed awkwardly; tabs row could push its start
  out of reach on small screens.
- **Tasks:** console centers at `max-w-[64rem]`; mobile uses full width
  with `86svh` cap; tabs row start-aligned scroll on small screens;
  chips wrap; bubbles cap at 86% width.
- **Files changed:**
  - `src/features/public-site/public-pages.tsx`
  - `src/features/public-site/consultation-booking-chat.tsx`
- **Components used:** none.
- **Acceptance criteria:** 390px EN+AR: no overflow, tabs reachable,
  composer usable, no hover dependency.
- **Status:** COMPLETE.
- **Screenshots checked:** pending QA round (see Phase 8).

## Phase 8 — QA

- **Tasks:** typecheck, lint, unit suite, targeted e2e, production build,
  8-combo screenshots (AR/EN × dark/light × 1440/390) across journey
  states, console-error review.
- **Files changed:** `tests/ui/booking-assistant-stage.test.tsx`
  (17 tests: primitives, composition, theme, copy, zones).
- **Acceptance criteria:** all boxes in the brief's acceptance list
  (verified in the final report).
- **Status:** COMPLETE.
- **Screenshots checked:** `test-results/correction-qa/` — 64 captures,
  8 combos × 8 states (initial, intent, matter, contact-ask, details,
  slots, review, confirmation). Reviewed: role distinction, hierarchy,
  both themes, RTL order, progress checks, input, contextual options,
  border density, no empty cavern, mobile stacking.
- **Gates:** `typecheck` clean · `lint` clean · unit 85 files / 611 tests
  pass · e2e `booking-stepper-validation` 5/5 (incl. new matter-journey
  test) · `booking-recovery` 31/31 · `mvp-smoke` booking 1/1 ·
  `batch5-chat-recovery` unchanged at 3 passed / 8 failed (pre-existing
  duplicate `public-language-switch` in uncommitted header work, out of
  scope) · production `next build` green · full scripted journey in all
  8 combos with zero console errors · live shell bg verified per theme
  (dark `rgb(10,9,8)`, light `rgb(250,247,240)`).
- **Incidents:** dev-server stale module graph after deleting the side
  panel fixed by one server restart (dev-only); content-sized shell broke
  the ≤2px no-page-scroll contract via focus scroll — reverted to a
  fixed shell (Phase 16: no layout jumping wins).
