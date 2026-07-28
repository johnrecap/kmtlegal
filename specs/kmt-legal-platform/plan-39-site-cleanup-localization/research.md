# Research: Site Cleanup, Contact Alerts, and Client Localization

## Decision 1: Reuse generic notifications for contact alerts

- **Decision**: Create one generic `SYSTEM` notification per eligible user and contact message.
- **Rationale**: The existing notification center already provides per-user read state,
  permission-checked admin links, deduplication, paging, and bell counts.
- **Alternatives considered**: A second contact-alert table duplicates lifecycle/read behavior;
  email or WhatsApp is explicitly excluded; using only the dashboard count does not provide the
  requested bell alert.

## Decision 2: Permission-based recipients

- **Decision**: Deliver to active users with active roles whose effective permissions include
  `notification.read.self` and either `contact.read.any` or `contact.manage.any`.
- **Rationale**: Role names are defaults, not security boundaries; the platform supports edited
  role permissions and Super Admin wildcard access.
- **Alternatives considered**: Hardcoded Secretary/Office Admin names would drift from the role
  matrix; notifying all staff would disclose the existence of private inquiries.

## Decision 3: Best-effort alert delivery after durable message creation

- **Decision**: Keep the accepted contact message if notification writing fails and emit a
  privacy-safe operational warning.
- **Rationale**: Losing an inquiry is worse than delaying its bell alert. The inbox and dashboard
  count remain the source of truth.
- **Alternatives considered**: One transaction guarantees simultaneous rows but turns a secondary
  notification outage into visitor submission failure.

## Decision 4: Bounded bell polling

- **Decision**: Refresh on bell open and every 30 seconds only while the document is visible.
- **Rationale**: It satisfies the timing requirement without adding WebSockets or a new service,
  and avoids hidden-tab traffic.
- **Alternatives considered**: Server-sent events/WebSockets add infrastructure; page-load-only
  refresh misses messages during long admin sessions.

## Decision 5: Hard retirement, not redirect

- **Decision**: Remove `/portal`, `/product-system`, and `/stitch-clone` from routing,
  authentication, cache policy, probes, commands, and active tests; do not redirect.
- **Rationale**: The user explicitly selected full removal. Removing `/portal` from middleware
  before deleting aliases allows the router to return a genuine 404.
- **Alternatives considered**: Compatibility redirects preserve old behavior but contradict the
  requested retirement; middleware-only blocks leave dead implementation and misleading tests.

## Decision 6: Preserve product-used Stitch assets

- **Decision**: Keep the offline source export, `/stitch-assets`, its cache header, and only the
  localization tool needed to reproduce used assets.
- **Rationale**: Current public hero pages reference localized Stitch imagery. Runtime clone
  components and visual comparison commands are independent and removable.
- **Alternatives considered**: Deleting all Stitch files would break current public images;
  keeping runtime pages would continue exposing experimental surfaces.

## Decision 7: Use Next global not-found support

- **Decision**: Enable the installed Next.js global not-found feature and add a self-contained
  bilingual root page.
- **Rationale**: This app uses multiple root layouts, so a single route-group `not-found.tsx`
  cannot consistently own unmatched URLs. An unknown path has no trustworthy locale.
- **Alternatives considered**: A catch-all page risks masking protected nested not-found behavior;
  separate Arabic/English guesses based on path are unreliable for arbitrary invalid URLs.

## Decision 8: Dedicated client root layout with account locale

- **Decision**: Move the route files from `(app-ar)/client` to `(client)/client` and render
  document `lang`/`dir` from the authenticated user's normalized `User.locale`.
- **Rationale**: The existing app-ar root always emits Arabic RTL. Client-shell attributes alone
  cannot correct document semantics or initial server output.
- **Alternatives considered**: A client effect that mutates `documentElement` causes incorrect
  initial markup and hydration/accessibility risk; duplicate `/ar/client` URLs contradict stable
  `/client`.

## Decision 9: Typed client catalog without a new library

- **Decision**: Add one typed Arabic/English catalog, feature-scoped copy objects, and locale-aware
  legal formatting while preserving Arabic defaults for admin consumers.
- **Rationale**: It matches the current public-content convention and avoids framework churn.
- **Alternatives considered**: `next-intl` or another library is unnecessary; leaving literals
  in pages prevents parity checks and safe maintenance.

## Decision 10: Server-owned account-setup locale

- **Decision**: Sign the booking locale into the client-account setup token and store that value.
- **Rationale**: The current form hardcodes Arabic even when booking chat is English. Signing the
  value prevents a client from submitting a conflicting locale and binds account creation to the
  selected journey.
- **Alternatives considered**: A query parameter is user-editable; trusting only form payload
  fails to preserve the confirmed journey and complicates validation.

## Decision 11: Additive consultation-locale migration

- **Decision**: Reuse `User.locale` and `Notification`, and add a non-null `locale` field to
  `ConsultationRequest` with Arabic as the default and a database check limited to `ar` or `en`.
- **Rationale**: The confirmed booking locale previously existed only in the request in memory.
  Payment completion may happen later, so the consultation must durably carry the trusted locale
  used to sign account setup. The default safely backfills historical consultations.
- **Alternatives considered**: Inferring from URL or payment time loses the original choice;
  accepting locale from account-setup form is mutable; a separate preference entity is excessive.
