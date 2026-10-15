# واجهة مختصرة / Only the essentials

Status: Comparison proposal; not selected by the owner. No production integration is performed by this page.

## Identity and rationale

KMT logo, gold accents and existing Arabic/Latin fonts remain. Typography-led conversation rows; dividers rather than a surrounding chat box.
Minimal appointment rows and clock choices; contact fields two columns on desktop, one on mobile.
This is original KMT HTML informed by the ledger below; no vendor code or brand identity is reproduced.

## Actual implementation paths and geometry

- Page: [index.html](index.html); overrides: [tokens.css](tokens.css).
- Shared semantic palette/type/states: [base.css](../shared/base.css).
- Shared components and behavior: [app.js](../shared/app.js).
- Copy: [catalogs.js](../shared/catalogs.js) from existing product catalogs, with [preview-copy.js](../shared/preview-copy.js) for clearly local presentation.
- Data: [fixtures.js](../shared/fixtures.js), shared across all five and baseline capture.
- Desktop dialog maximum width: 860px. Base radius 0px; chat radius 0px; chat padding 0px; chat title 20px.
- Body 16px/1.7; messages 14–16px, line-height 1.8 where overridden; labels 11–14px. IBM Plex Sans Arabic for Arabic, Inter for Latin, then sans-serif. Font weights 400/500/600 and Arabic 700 are locally available.
- Shared spacing uses 4/8/12/16/20/24/28/32px; direction-specific padding and grid are authoritative in tokens.css. These are original KMT choices, not official external brand tokens.
- Controls are at least 44px high. Seven date choices fit at 390px; at 360px the shared grid wraps to avoid narrow targets. Direction 05 uses compact wrapped rows.
- The dialog uses one vertical scrolling content region, a clear close button and a footer that occupies its own layout space. Mobile width is viewport minus 20px, max-height viewport minus 20px.
- No imported image except the approved KMT mark; no decorative photo, fake testimonial or live-presence claim. Icons are small inline SVGs.

## Semantic palette and specimen

| Role | Light | Dark |
| --- | --- | --- |
| Canvas / surface | #f6f3ec / #fffdf8 | #080706 / #11100e |
| Text / muted | #1c1812 / #625846 | #f5efe3 / #b6ad9d |
| Gold text / action fill | #755a26 / #755a26 | #e3bd74 / #d0a048 |
| On gold / tint | #fffdf8 / #f3e8d2 | #120d07 / #292010 |
| Border | #cbbfa9 | #514630 |
| Success / background | #286342 / #edf5ef | #9bd1ad / #15271b |
| Error / background | #9c3535 / #fff2ef | #f1b7ac / #351b18 |

Open the visual-system details below the conversation to inspect swatches, typography, buttons, inputs, disabled/error/success states. Hover changes action feedback; keyboard focus uses a 2px gold outline with offset. Disabled actions remain visibly unavailable.

## Interaction and content contract

Conversation distinguishes customer, assistant and staff. Composer grows from one to four lines and retains drafts through error/retry. Local sample replies are clearly simulations. Booking starts only by an explicit action. Weekly consultation hours are collapsed, nearest appointment is selectable, a selected day shows its own clocks, and an unavailable day explains its reason. A closed day never implies the whole window is empty.

Changing date resets the selected clock and consent while retaining name/phone/channel. Phone validation is inline. Review, consent and confirmation are explicit; edit/cancel are simulated. No payment/free-fee promises. No permanent progress navigation. Copy stays concise and bilingual; date/time labels identify Cairo. Fixture business hours are illustrative, not approved administration settings.

## Responsive, accessibility and motion

Use logical CSS and actual lang/dir. Mixed numbers/phone/date use appropriate input semantics; slot strings are generated for the chosen locale. Native dialog/fieldset/radios retain keyboard behavior. Escape closes, focus returns, and Tab stays inside the open dialog. Error/status feedback uses announcements; do not rely on color alone.

Only 160ms background/border feedback with cubic-bezier(.22,1,.36,1); reduced-motion removes transitions. No staged message animation, infinite glow, vanishing drafts or animation dependency. Keep contact/consent reachable by scrolling and actions unobstructed.

## Qualitative comparison and evidence

- Audience fit: Visitors comfortable with compact interfaces.
- Task clarity: Content takes precedence over decorative containers.
- Brand fit: KMT mark, typography and semantic gold retained.
- Density/readability: High; Less decoration; hierarchy depends on typography.
- Implementation complexity: local layout/CSS adaptation around existing production components later; no new dependency needed for these previews.
- Sources: S02, K01–K04; exact access and reuse limits in [SOURCES.md](../SOURCES.md).
- Mechanical result: eight combinations for this direction pass in [results.json](../qa/results.json); 360px checks are included per combination.
- Root visual self-review is distinct from mechanical PASS. It is not independent acceptance or a physical-device/browser matrix.
- Exact selected screenshot authority, current artifact hashes and later integration scope are kept in the existing project register/canonical consultation contract.

Do preserve sample-vs-live boundaries, explicit consent and all recovery states. Do not turn this preview into an alternate production route, change business hours from its fixture, add a library, or auto-confirm an appointment.
