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
- Contact submissions are validated and rate-limited. Email delivery is deferred; the email helper returns disabled metadata without sending.
- Public GET APIs use cache-friendly headers.

## Tests

- `tests/server/public-content.test.ts`
- `tests/ui/public-pages.test.tsx`

## Still Open

- Legal/privacy copy should receive final legal review before production release.
- Contact submissions are email-only because the MVP schema has no ContactMessage model.
