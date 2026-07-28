# Feature Specification: Site Cleanup, Contact Alerts, and Client Localization

**Feature Branch**: `main`

**Created**: 2026-07-28

**Status**: Approved for implementation

**Input**: Retire obsolete public routes, deliver contact-message alerts to authorized office
staff, add a branded bilingual not-found experience, and make the client experience fully
Arabic/English while keeping staff administration Arabic.

## Clarifications

### Session 2026-07-28

- Q: How should office staff learn about a new public contact message? → A: Keep the inbox as
  the source of truth and add an in-app bell alert; do not send email or WhatsApp.
- Q: Should `/portal` remain a compatibility path? → A: No. Retire every `/portal` page and
  service path so it returns the branded not-found page without a login redirect.
- Q: Which protected experiences should be bilingual? → A: The client experience and client
  login are Arabic/English; the staff/admin experience remains Arabic.
- Q: What happens to Stitch design material? → A: Remove routable experimental pages and
  clone-only tooling, but keep the offline read-only source archive and product-used assets.

## User Scenarios & Testing

### User Story 1 - Office receives contact alerts (Priority: P1)

As an authorized office coordinator, I can see a new public contact message in the contact
inbox and receive a bell alert so that the request is not missed.

**Why this priority**: Missed public inquiries directly affect client service and office
operations.

**Independent Test**: Submit one synthetic contact message and confirm that it remains readable
in the inbox and produces a non-sensitive unread alert only for active users with contact-read
access.

**Acceptance Scenarios**:

1. **Given** an active secretary, office admin, or super admin has contact-read access, **When**
   a visitor submits a valid message, **Then** the full message appears in the inbox and a
   non-sensitive bell alert appears for that user.
2. **Given** an active lawyer or marketing user lacks contact-read access, **When** a visitor
   submits a message, **Then** that user receives no contact alert and cannot open the inbox.
3. **Given** alert creation fails after the message is accepted, **When** the request completes,
   **Then** the contact message remains saved and the visitor receives the normal success result.
4. **Given** an authorized staff member keeps the admin workspace open, **When** a new alert is
   created, **Then** the bell reflects it within 30 seconds and also refreshes when opened.

---

### User Story 2 - Obsolete routes are gone and invalid links recover safely (Priority: P1)

As a visitor or client, I receive a branded, useful not-found page for invalid or retired links
instead of an English framework page or an unexpected login redirect.

**Why this priority**: Obsolete routes expose unfinished work and the current fallback is
confusing and inconsistent with the KMT Legal brand.

**Independent Test**: Open representative `/portal`, `/product-system`, `/stitch-clone`, and
unknown links while signed out and confirm a genuine 404 response with the bilingual recovery
page and no login redirect.

**Acceptance Scenarios**:

1. **Given** any signed-out visitor, **When** they open `/portal` or any nested `/portal` path,
   **Then** they receive the branded 404 response and are not redirected to login.
2. **Given** any visitor, **When** they open `/product-system` or `/stitch-clone` and any nested
   path, **Then** they receive the same branded 404 response.
3. **Given** a visitor opens any other unknown public path, **When** the route cannot be found,
   **Then** the response remains 404 and offers Arabic home, English home, and client-login
   recovery actions.
4. **Given** the experimental pages are retired, **When** current public pages load, **Then**
   product-used hero imagery and brand assets remain available.

---

### User Story 3 - Client chooses Arabic or English (Priority: P2)

As a client, I can use login and every client page in Arabic or English, and my language choice
is kept with my account.

**Why this priority**: The public experience already supports both languages, while authenticated
clients currently encounter an Arabic-only experience.

**Independent Test**: Use one synthetic client account to switch from Arabic to English, reload
and sign in again, then visit every client destination and confirm translated text, correct
direction, and locale-aware dates, numbers, and currency.

**Acceptance Scenarios**:

1. **Given** a client whose saved language is Arabic, **When** they open any client destination,
   **Then** the page uses Arabic text and right-to-left direction.
2. **Given** a client changes the saved language to English, **When** the change succeeds, **Then**
   every client destination uses English and left-to-right direction without changing its URL.
3. **Given** the client signs out and returns later, **When** they sign in, **Then** the saved
   language remains active.
4. **Given** a new client starts from an Arabic or English booking/account-setup journey, **When**
   the account is created, **Then** the account starts with that journey language.
5. **Given** validation, loading, empty, denied, or failure states occur, **When** the client sees
   them, **Then** their visible and assistive text matches the active language and does not expose
   internal error details.

---

### User Story 4 - Staff copy remains consistent Arabic (Priority: P3)

As an office employee, I see consistent Arabic operational wording across the touched admin
surfaces without unexplained English labels or raw internal values.

**Why this priority**: Consistent wording reduces staff confusion and prevents future copy drift,
but it does not block visitor inquiries or client access.

**Independent Test**: Review the contact inbox, notification center, and shared staff recovery
states and confirm their visible text comes from the approved Arabic copy sources.

**Acceptance Scenarios**:

1. **Given** an employee opens a touched admin surface, **When** labels, states, or alerts appear,
   **Then** they use approved Arabic wording.
2. **Given** an internal error code or stored status exists, **When** it is shown to staff, **Then**
   a safe Arabic label is displayed instead of the raw value.

### Edge Cases

- A contact message may be saved while alert creation is temporarily unavailable; message
  durability takes precedence and the failure is recorded without visitor data.
- Role names are not the authorization boundary; alert delivery follows current effective
  permissions and active-role status.
- Multiple roles may grant the same user access; only one alert is created for that message.
- A client may submit an invalid or unsupported locale; the request is rejected without changing
  the saved preference.
- Existing client accounts without an explicit preference continue in Arabic.
- Retired URLs must not be reintroduced by cache rules, middleware, test fallbacks, or old
  navigation data.
- Stitch-derived assets that current product pages use remain available even though routable
  clone pages and clone-only commands are removed.

## Scope & Connected Impact

### In Scope

- Contact-message inbox continuity, permission-based in-app alerts, and bell refresh behavior.
- Retirement of all `/portal`, `/product-system`, and `/stitch-clone` user-facing routes.
- Retirement of clone-only and product-system-only runtime commands and test fallbacks.
- A branded bilingual global 404 response.
- Full Arabic/English client and client-login copy, direction, formatting, and saved preference.
- Arabic copy centralization for the touched staff surfaces.
- Current planning, contract, test, deployment, and project-guide updates.

### Out of Scope

- Email, SMS, WhatsApp, desktop push, or mobile push notifications.
- English translation of the admin/staff workspace.
- Deleting the read-only Stitch source archive or product-used localized assets.
- Changing client ownership rules, contact lifecycle states, payment behavior, or public content
  slugs.
- Adding a new localization library or changing the public English-default URL strategy.
- Migrating or modifying real client records during verification.

### Existing Behavior to Preserve

- Public contact validation, duplicate protection, rate limiting, success response, stored
  message detail, inbox review/archive lifecycle, audit behavior, and dashboard contact count.
- `/client` as the only client workspace URL and client-owned-data authorization on all reads,
  uploads, downloads, assistant calls, and team chat.
- English-default public routes with Arabic public routes under `/ar`.
- Arabic staff/admin authorization, natural denied states, and server-side permission checks.
- Current public pages that use `/stitch-assets` images.

### Affected Surfaces

- **Actors/Roles**: Guest, Client, Secretary, Office Admin, Super Admin; lawyers and marketing
  users are covered by denied-path tests unless their effective permissions are changed.
- **UI/Routes**: Contact success, admin bell/notification center, global 404, login, all `/client`
  pages, and retired route families.
- **API/Services**: Public contact submission side effect, notification listing/reading, canonical
  client profile service, and authenticated client language preference.
- **Data**: Existing ContactMessage, Notification, and User locale records, plus an additive
  booking-locale field on consultation requests with an Arabic default for existing rows.
- **Messages/Localization**: Client Arabic/English catalog, locale-aware formatting, accessible
  names, safe error-code mapping, and touched admin Arabic copy.
- **Tests/Docs/Deployment**: Contract, permission, component, browser, responsive/RTL, build,
  cache-policy, route-manifest, server runbook, project guide, and live read-only smoke evidence.

## Requirements

### Functional Requirements

- **FR-001**: Every accepted public contact message MUST remain readable in the existing contact
  inbox with its existing lifecycle and audit behavior.
- **FR-002**: Every accepted public contact message MUST create at most one unread in-app alert
  for each active user whose effective permissions allow contact reading or management and
  notification self-reading.
- **FR-003**: Contact alerts MUST contain only a generic title, generic body, creation time, and
  safe inbox link; they MUST NOT contain the sender's name, email, phone, message text, or topic.
- **FR-004**: Alert-creation failure MUST NOT roll back or report failure for an already accepted
  contact message, and the failure record MUST exclude visitor content and contact details.
- **FR-005**: The admin bell MUST refresh immediately when opened and at most every 30 seconds
  while the document is visible, without announcing unchanged counts repeatedly.
- **FR-006**: `/portal` and every nested page or service path under it MUST be removed and MUST
  return 404 without authentication redirection; no compatibility redirect remains.
- **FR-007**: The canonical client profile service MUST use the `/client` family, and the former
  `/portal` service path MUST return 404.
- **FR-008**: `/product-system`, `/stitch-clone`, and every nested path MUST be unavailable and
  return 404; their runtime-only components, commands, readiness probes, cache exceptions, and
  test fallbacks MUST be retired.
- **FR-009**: The offline Stitch archive and every localized Stitch asset referenced by current
  product pages MUST be preserved.
- **FR-010**: Every unmatched public or retired route MUST return a branded bilingual 404 page
  with Arabic home, English home, and client-login actions, keyboard-visible focus, and responsive
  layout.
- **FR-011**: Every `/client` page and client-login state MUST provide complete Arabic and English
  visible text, assistive text, validation, loading, empty, denied, success, and recovery states.
- **FR-012**: Client pages MUST keep the same `/client` URLs in both languages and MUST apply the
  saved account locale to document language, reading direction, navigation, formatting, assistant
  requests, and team-chat copy.
- **FR-013**: An authenticated client MUST be able to save only `ar` or `en` as their own locale;
  unsupported values and attempts to alter another user MUST be rejected without change.
- **FR-014**: A new client created through booking/account setup MUST start with the selected
  journey locale; the confirmed locale MUST be stored with the consultation before account setup,
  and existing consultations or clients without a supported locale MUST safely default to Arabic.
- **FR-015**: Client-facing failures MUST map stable response codes to localized copy and MUST
  never display raw provider, database, stack, or internal exception text.
- **FR-016**: Touched staff/admin labels, alerts, validation, accessible names, and recovery text
  MUST use centralized Arabic copy; admin English translation remains out of scope.
- **FR-017**: Current public Arabic/English routes, content selection, metadata, forms, and image
  alternatives MUST remain complete and must not regress from route retirement or client changes.
- **FR-018**: Cache, middleware, route policy, startup probes, tests, and current documentation
  MUST name `/client` as the only client path and MUST NOT depend on retired runtime routes.
- **FR-019**: Verification MUST use synthetic data on local/staging environments; live
  verification MUST be read-only.

### Key Entities

- **Contact Message**: A visitor inquiry stored with its sender details, topic, body, status,
  review information, and audit history.
- **Notification**: A per-user, deduplicated in-app alert with safe display text, read state,
  resource reference, and permission-checked action.
- **Client Locale Preference**: The existing language value owned by the authenticated client
  account and restricted to Arabic or English.
- **Retired Route Family**: A former public/runtime path prefix that must resolve to the global
  not-found experience and must not participate in authentication or cache exceptions.

## Success Criteria

### Measurable Outcomes

- **SC-001**: In a synthetic permission matrix, 100% of active contact-authorized staff receive
  exactly one non-sensitive alert and 100% of unauthorized staff receive none.
- **SC-002**: An injected alert-write failure leaves 100% of accepted test messages readable in
  the inbox with the normal visitor success result.
- **SC-003**: A newly created contact alert appears in an already-open visible admin workspace
  within 30 seconds and immediately after opening the bell.
- **SC-004**: Representative root and nested paths for all three retired route families return a
  genuine 404 with zero login redirects and zero runtime experimental content.
- **SC-005**: All current public pages that reference Stitch-derived imagery continue to load
  those assets successfully after experimental route removal.
- **SC-006**: Every client destination passes Arabic and English browser checks at desktop and
  390-pixel mobile widths with correct direction, no horizontal overflow, and complete keyboard
  access.
- **SC-007**: A client's language change survives page reload and a new authenticated session in
  100% of the synthetic persistence scenarios.
- **SC-008**: Arabic and English client catalogs have matching keys, and automated source checks
  find no unapproved client-facing literal outside the approved copy/catalog sources.
- **SC-009**: Type checking, lint, full automated tests, production build, focused browser flows,
  route checks, and documentation accuracy checks complete without unresolved failures.

## Assumptions

- Contact and notification records need no schema change; consultation requests receive one
  additive, non-null locale field with an Arabic default and an `ar`/`en` database constraint.
- Existing `User.locale` values are the durable client preference source.
- The existing public locale/content pattern is extended rather than replaced.
- The global 404 is bilingual because an unknown path does not provide a reliable locale.
- Historical plan documents remain as history but are marked superseded where they describe
  active `/portal`, `/product-system`, or `/stitch-clone` runtime behavior.
- The current modified Spec Kit templates are intentional project customizations and will not be
  overwritten by an integration upgrade.
