# Implementation Plan: Site Cleanup, Contact Alerts, and Client Localization

**Branch**: `main` | **Date**: 2026-07-28 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from
`specs/kmt-legal-platform/plan-39-site-cleanup-localization/spec.md`

## Summary

Extend the existing contact inbox and generic notification center so accepted public messages
produce deduplicated, permission-based, privacy-safe alerts without coupling message durability
to alert delivery. Retire the runtime `/portal`, `/product-system`, and `/stitch-clone` families
from routing, middleware, cache policy, test fallbacks, and operational tooling; preserve the
offline Stitch archive and product-used `/stitch-assets`. Add Next.js global not-found handling,
move `/client` into a locale-aware root layout, reuse the current public dictionary pattern for
a typed client Arabic/English catalog, and persist the existing `User.locale` through a self-only
preference endpoint.

## Technical Context

**Language/Version**: TypeScript on Node.js
`>=20.19.0 <21 || >=22.12.0 <23 || >=24.0.0 <25`

**Primary Dependencies**: Next.js 15.5.20 App Router, React 18.2, Prisma 7.8, Zod, Tailwind CSS,
existing KMT UI/layout primitives

**Storage**: Existing PostgreSQL `ContactMessage`, `Notification`, `User`, `Role`, and
`RolePermission` records plus an additive `ConsultationRequest.locale` migration

**Testing**: Vitest/Testing Library, route/contract tests, Playwright desktop/mobile/browser
flows, typecheck, lint, Prisma validation, production build, read-only live smoke

**Target Platform**: Responsive web app on the existing aaPanel + PM2 Linux deployment

**Project Type**: Next.js full-stack web application

**Performance Goals**: A visible open admin workspace reflects new contact alerts within
30 seconds; no new request is added to unchanged hidden documents

**Constraints**: Preserve contact success response and message durability; no email/WhatsApp;
no new localization/UI dependency; keep staff UI Arabic; keep `/client` URLs stable; no real
client data in tests; keep `.playwright-mcp/` untouched

**Scale/Scope**: Three retired route families, eight client destinations, shared client shell,
two client conversation panels, two portal-named forms, one contact side effect, one notification
polling surface, login, cache/startup/deployment references, and current documentation

## Constitution Check

### Pre-design gate

- **Spec Kit gate**: PASS. Constitution v1.1.0, specification, four recorded clarifications,
  and 15/15 specification-quality checks are complete.
- **Existing-system gate**: PASS. The plan extends the current contact service, permission
  helpers, generic notification center, `User.locale`, public content pattern, KMT components,
  and session context. One additive consultation-locale field closes the delayed-payment
  inheritance gap; no parallel auth, notification, profile, or localization framework is
  introduced.
- **Connected-impact gate**: PASS. Route policy, middleware, cache rules, startup probes,
  APIs/services, data, permissions, messages, tests, docs, and deployment are mapped.
- **Correctness gate**: PASS. Alert recipients are selected by effective permission, profile and
  preference mutations are current-user-only, notification uniqueness is reused, and contact
  success is not rolled back by best-effort alert delivery.
- **Quality gate**: PASS. Contract, permission, failure, route, catalog-parity, component,
  responsive/RTL, build, staging, and read-only live checks are defined.
- **Conflict-control gate**: PASS. Shared route policy, legal formatting, client copy, package
  scripts, and planning/status files each have one sequential ownership lane.

### Post-design gate

PASS with no exceptions. Research resolves runtime-route retirement, global 404, polling,
locale ownership, account-setup inheritance, and asset retention. The data-model artifact
defines the additive consultation-locale migration and historical Arabic backfill. Contracts
define the three HTTP changes and removed route behavior.
Quickstart provides objective local, DB-backed, browser, and deployment acceptance.

## Project Structure

### Documentation (this feature)

```text
specs/kmt-legal-platform/plan-39-site-cleanup-localization/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── api.md
│   └── routes.md
├── checklists/
│   ├── requirements.md
│   └── delivery.md
└── tasks.md
```

### Source code and operational surfaces

```text
src/
├── app/
│   ├── (client)/client/...
│   ├── (public-en)/client-account/setup/...
│   ├── (public-ar)/ar/client-account/setup/...
│   ├── api/client/profile/route.ts
│   ├── api/client/preferences/route.ts
│   └── global-not-found.tsx
├── components/layout/client-site-shell.tsx
├── content/client-content.ts
├── features/client/...
├── features/portal/...
├── lib/{auth-routing,legal-format,public-locale,ui-copy}.ts
└── server/
    ├── admin/notification-service.ts
    ├── auth/client-portal-guard.ts
    ├── contact/contact-message-service.ts
    └── portal/{client-account-setup-service,client-portal-service}.ts

tests/
├── server/
├── ui/
└── e2e/

scripts/
deploy/
docs/
```

**Structure Decision**: Keep existing domain services and portal-named internal service files
where renaming provides no user-visible value. Retire only public `/portal` routes/contracts and
dead navigation. Move the `/client` route directory to a dedicated route group so its root
layout can emit the account locale at document level without changing URLs.

## Reuse and Connected-Impact Decisions

- **Contact alerts**: Add `createContactMessageNotifications` beside existing notification
  writers. It selects active users/active roles, builds principals from current permissions,
  requires contact-read/manage plus `notification.read.self`, and reuses the existing
  per-user/type/resource uniqueness constraint with `skipDuplicates`.
- **Failure isolation**: `createPublicContactMessage` awaits a best-effort alert callback after
  message creation and existing best-effort audit. It catches alert errors and writes only
  request ID/resource type/resource ID to `safeLog`; no visitor fields are logged.
- **Bell refresh**: Reuse `/api/admin/notifications?limit=5`; refresh on `<details>` open and
  every 30 seconds only while `document.visibilityState === "visible"`. Reuse the existing state
  replacement and read behavior.
- **Route retirement**: Delete page/API files, remove protected-path classification before
  routing, remove cache/startup/test/script dependencies, and do not add redirects or rewrites.
- **Stitch retention**: Keep `stitch_kmt_legal_platform_ui_system/`, `public/stitch-assets/`, the
  `/stitch-assets` immutable header, and any asset-localization command still required to
  reproduce product assets. Remove clone generation/render/screenshot/compare commands and the
  runtime flag/readiness warning.
- **Global 404**: Enable Next.js `experimental.globalNotFound` and add a self-contained branded
  bilingual page with root HTML, current global CSS, logo, 404 status, three recovery actions,
  visible focus, and no data dependency.
- **Client locale**: Add a typed `ar`/`en` client content catalog modeled after current public
  content. Normalize unsupported stored values to Arabic. Use the session's `user.locale` in the
  client root layout, pages, shell, assistant, team chat, forms, formatting, and metadata.
- **Preference mutation**: Add `PATCH /api/client/preferences` with a strict `{ locale }` body,
  active Client role, linked client profile, self-owned `User.update`, safe response, and
  best-effort audit. No user ID is accepted.
- **Profile contract**: Move the existing route handler to `/api/client/profile`; keep service
  semantics and response shape, update all consumers, and leave the old API absent.
- **Account inheritance**: Add locale to the signed setup token/target, pass the confirmed
  booking/payment consultation locale, persist it with the consultation, move setup into its own
  locale-aware root layout, and submit the same token locale. The server owns the final stored
  value and does not trust a conflicting client locale.
- **Error localization**: Keep stable server error codes. Client components map codes to the
  active catalog with a localized generic fallback and optional request ID; raw backend messages
  are not displayed.
- **Staff copy**: Add contact-alert wording and touched notification/recovery text to the existing
  Arabic copy source. A full unrelated admin rewrite is excluded.
- **Documentation truth**: Current docs and runbooks name `/client` only. Historical PLAN-02,
  PLAN-03, PLAN-05, PLAN-13, and PLAN-14 records remain but receive a short superseded note rather
  than rewritten history.

## Interface and Data Flow

1. Visitor contact form → public contact route → contact service → `ContactMessage` create →
   best-effort audit → best-effort permission-based notification create → unchanged 201 response.
2. Admin shell initial snapshot → bell client state → open/visible 30-second refresh → notification
   API → permission-scoped projection → inbox action link.
3. Client request → middleware protects `/client` → client root layout loads session locale →
   typed content/formatters render page → preference mutation updates current `User.locale` →
   `router.refresh()` re-renders document direction and text.
4. Unknown or retired request → no retired middleware/auth special case → App Router miss →
   global branded 404 with status 404.

## File Conflict Control

Work is sequential in this task:

1. Planning artifacts and active feature pointer.
2. Notification service/contact writer/tests.
3. Route retirement, scripts/config/tests.
4. Client contracts and locale foundation.
5. Client route/page/component localization.
6. Global docs/tests/build/browser verification.
7. Convergence, task check-off, status/project guide, commit/push/deploy handoff.

No parallel producer edits are used; `.specify/**`, `specs/**`, shared copy/format files, route
policy, package scripts, and final integration evidence remain root-owned.

## Complexity Tracking

No constitution violations. The additive consultation locale is required because payment and
account setup can occur after the booking request, and uses a safe Arabic backfill. The dedicated
client root layout is required to produce correct
document-level `lang`/`dir`; a client-only DOM mutation was rejected because it would ship an
incorrect server document and create accessibility/hydration risk.
