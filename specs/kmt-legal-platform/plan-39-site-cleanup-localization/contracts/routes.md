# Route Contract: PLAN-39

## Canonical client surface

- `/client`
- `/client/cases`
- `/client/cases/[caseId]`
- `/client/court-dates`
- `/client/files`
- `/client/payments`
- `/client/assistant`
- `/client/profile`

These paths remain protected, dynamic, and non-shared-cache. Arabic and English use the same URLs;
the authenticated account locale controls content and direction.

## Retired route families

The following root and nested paths are absent and return the global 404 without a login redirect:

- `/portal` and `/portal/*`
- `/product-system` and `/product-system/*`
- `/stitch-clone` and `/stitch-clone/*`
- `/api/portal/profile`

No redirect, rewrite, middleware block body, compatibility alias, readiness probe, or test fallback
may keep these routes operational.

## Global not-found

- HTTP status remains 404.
- Self-contained bilingual KMT Legal page.
- Arabic home action: `/ar`
- English home action: `/`
- Client login action: `/login?next=/client`
- No automatic redirect and no database dependency.

## Preserved assets

- `/stitch-assets/*` remains available and immutable-cacheable because current public pages use it.
- The offline `stitch_kmt_legal_platform_ui_system/` archive remains non-routable.
