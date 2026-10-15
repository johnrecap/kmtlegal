# Selected consultation appearance — direction 02

Scope: conversation surface and its single booking dialog, Arabic/English, light/dark, mobile/desktop. Owner decision on 2026-10-15: «التصميمين دول كويسين اعتمدهم». [DECISIONS.md](DECISIONS.md) retains the authority. This is the canonical scoped appearance contract; existing site tokens/primitives remain the production foundation.

Integration update: the owner's next explicit message authorizes implementation, commit/push and server handoff. The subsequent reading-area request supersedes the prototype's short log: use the remaining viewport height, internal scroll, anchored composer and history-position protection with a new-messages action. Current implementation paths are `src/features/public-site/consultation-experience.css`, the chat/panel/picker below and existing catalogs. The HTML lab remains historical comparison evidence; no lab fixture/runtime is imported by product code.

## Visual authority and selected system

- [Approved chat image](../../design-preview/consultation/images/owner-selected-chat-light-ar-1440.png): ivory background, KMT mark, centered welcome, soft conversation card, distinct customer/assistant bubbles and rounded composer.
- [Approved booking image](../../design-preview/consultation/images/owner-selected-booking-dark-en-390.png): near-black dialog, gold nearest action, pill days/clocks, compact closed-day labels, stacked contact/review section and separate footer.
- [Interactive direction 02](../../design-preview/consultation/direction-02/index.html), [exact local tokens](../../design-preview/consultation/direction-02/tokens.css) and [full system/specimen contract](../../design-preview/consultation/direction-02/DESIGN.md).
- Palette/type/states are in [shared base.css](../../design-preview/consultation/shared/base.css); existing KMT logo and IBM Plex Sans Arabic/Inter are retained. This approval changes no office hours, availability, fees or provider behavior.

Direction 02 is selected for both surfaces, rather than a hybrid. Target chat width 820px; desktop dialog maximum 780px; base radius 18px, conversation radius 28px (22px mobile), pill composer/time controls, 20–24px day radii. Contact inputs use two columns on desktop, one on mobile. Light uses ivory/paper and readable dark gold; dark uses near-black and warm gold. The final local runtime scrolls to latest messages and shortens the log at low viewport heights so the primary booking action remains visible. Preserve the owner's appearance rather than the earlier screenshot's scroll offset.

## Reuse and behavior

Keep the existing [ConversationalBookingChat](../../src/features/public-site/conversational-booking-chat.tsx), [DirectBookingPanel](../../src/features/public-site/direct-booking-panel.tsx), [BookingAvailabilityPicker](../../src/features/public-site/booking-availability-picker.tsx) and [native Dialog](../../src/components/ui/dialog.tsx) as production owners. The HTML prototype is a visual reference, not an alternate backend or production state model. Retain localized catalogs, guest capability/CSRF, same message/retry IDs, server schedule, sequential tools, timeout/call ceilings, consent and duplicate-booking protections.

Only selected-day clocks appear. Weekly consultation hours stay collapsible; nearest appointment is a deliberate action; unavailable-day details appear on selection. Date changes retain contacts but reset slot/consent. One full/closed day never triggers a global contact fallback. Review and consent precede confirmation. Edit/cancel, retry/error, empty schedule and staff ownership remain available. No recurring consultation prompt is introduced. No permanent stepper, timeline, progress tabs or separate booking pages.

## Accessibility, content and motion

Use actual RTL structure/logical spacing, existing Arabic/English catalogs and Cairo date/time labels. Meaning cannot depend on gold color alone. Preserve labels, validation/status announcements, keyboard radio/date behavior, Escape, focus containment/return, 44px targets, scroll reachability and reduced motion. The preview uses 160ms color/border feedback; no automatic list staging, vanishing draft or decorative infinite animation is approved by this selection. No new library/component replacement is authorized.

## Acceptance boundaries

Local prototype matrix: 40/40 combinations passed; selected direction is eight of those. Tests cover 390/1440px plus 360px checks in each combination. Six measured normal-text pairs exceed 4.5:1. Root visual review supports the distinct composition and readable states, separate from automated evidence. Physical devices, software keyboard, Safari/Firefox, real AI and production integration remain unverified.

The two attached images establish owner appearance selection, followed by separate implementation authorization. They do not establish business data approval or server deployment acceptance. Current evidence hashes live in [manifest.json](../../design-preview/consultation/qa/manifest.json). The existing [implementation register](../KMT_LEGAL_IMPLEMENTATION_STATUS.md) owns current production-source verification and remaining device/server checks; [integration plan](CONSULTATION_INTEGRATION_PLAN.md) records the scoped slice. The product implementation retains the approved visual system with the owner's larger reading area and real catalog/business data.
