# PLAN-10 Public Content, Media, Contact and Legal Pages

## Implemented

- Articles list/detail routes:
  - `/articles`
  - `/articles/[slug]`
- Anonymous case studies list/detail routes:
  - `/case-studies`
  - `/case-studies/[slug]`
- Read-only media wall:
  - `/media`
- Contact and branch page:
  - `/contact`
- Legal pages:
  - `/privacy`
    - English-default privacy and job-applicant notice.
    - Arabic RTL notice at `/ar/privacy`.
    - Meta Instant Form recruitment scope, CV-by-email handling, retention criteria, rights contacts, Meta links, semantic headings, and an in-page contents list.
  - `/terms`
- Public read-only API contracts:
  - `/api/public/services`
  - `/api/public/services/[slug]`
  - `/api/public/lawyers`
  - `/api/public/lawyers/[slug]`
  - `/api/public/articles`
  - `/api/public/articles/[slug]`
  - `/api/public/case-studies`
  - `/api/public/case-studies/[slug]`
- Contact form API:
  - `POST /api/public/contact`

## Contract Rules

- Public content exposes only published/anonymized static data.
- Case studies include disclaimers and no client identifiers.
- Contact submissions are validated, rate-limited, persisted as `ContactMessage`, and return a safe reference. SMTP/email delivery remains deferred.
- Public GET APIs use cache-friendly headers.

## Tests

- `tests/server/public-content.test.ts`
- `tests/ui/public-pages.test.tsx`
- `tests/e2e/mvp-smoke.spec.ts`
- `tests/e2e/public-luxury-visual.spec.ts`

## Still Open

- The public privacy notice uses verified project behavior and official Meta/PDPC references, but its published legal wording should still receive final human legal review before production release.
- Admin UI for reviewing `ContactMessage` entries can be added on top of the implemented admin read/status API.
