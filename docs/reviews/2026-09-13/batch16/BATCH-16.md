# Batch 16: isolated public UI preview

## Local route and safety boundary

`/preview/ui` is an isolated design-review route with no product navigation entry. In a development process it is available for local review. In a production process it returns `404` unless `KMT_ENABLE_UI_PREVIEW` is exactly `true`. The page calls `noStore()`, uses `noindex, nofollow` metadata, and does not call a booking, payment, provider, API, or database path.

The preview is intentionally separate from the current public product routes. It does not alter the live home, service, consultation, authentication, admin, payment, data, or deployment flows.

## Delivered views

- Home: architectural image hero, direct consultation action, numbered service rows, process rail, people imagery, and an editorial sector list.
- Service detail: existing service scope, outcomes, and source-defined helper-document guidance.
- Consultation request: a simulated conversation with explicit service and meeting-method choices, trimmed details, sample times, an editable summary, unavailable-time recovery, temporary-error retry, and simulated confirmation.
- English and Arabic share one preserved draft. Direction, navigation, labels, summary content, and interaction copy switch together.
- Desktop uses a persistent summary. Mobile uses native `<dialog>` behavior with Escape close, return focus, and field-specific edit focus.

Browsing a service does not silently change a consultation draft. An explicit booking service or method change invalidates the chosen sample time while retaining completed details and advancing to the next incomplete step. Summary values remain honest before selection.

New preview-only copy lives in `src/content/ui-preview-content.ts`. Factual service, person, sector, and process data continues to come from the existing public content sources. The preview reuses the public palette and bundled IBM Plex Sans Arabic/Inter fonts.

## Automated and visual evidence

`tests/e2e/batch16-ui-preview.spec.ts` runs as one Chromium test with one worker. It verifies:

- navigation across home, service detail, and consultation request;
- explicit service and meeting-method selection;
- no incomplete confirmation through summary edit shortcuts;
- whitespace trimming before review and confirmation;
- service and method changes invalidating only the sample time;
- draft retention across language changes, conflict recovery, temporary error/retry, and cross-view service browsing;
- desktop and mobile summary edit focus;
- native-dialog open, Escape close, return focus, and guarded field focus;
- reduced-motion scroll behavior;
- no horizontal overflow at 390, 768, and 1440 pixels;
- no API, booking, payment, provider, or other non-read network request.

The same run generated 18 full-page JPEGs under `screenshots/`: three views × two locales × three widths. Home captures scroll through lazy imagery before capture. Booking captures include a filled, readable composer and the mobile dialog summary. Representative visual review covered English mobile home, Arabic tablet service detail, English desktop booking, and Arabic mobile booking; headers, RTL direction, typography, contrast, content hierarchy, composer styling, and dialog placement were intact.

The supervisor then ran an independent browser pass against the built, explicitly enabled production preview. It confirmed the whitespace/summary guard, browsing-versus-booking service isolation, explicit-service slot invalidation with method/details retention, native modal focus containment/Escape/return/edit focus, and locale draft persistence. That pass observed no page error, API request, or write request. At 390 pixels the live composer measured 342 pixels wide and 132 pixels high with the intended dark surface and light text.

## Verification

- Focused Playwright: pass, 1 test in 33.2 seconds, `--workers=1`.
- Screenshot matrix: pass, 18 of 18 files.
- `npm run lint`: pass with no warnings or errors.
- `npm run typecheck`: pass.
- `npm run security:secrets`: pass; no high-confidence secret patterns.
- `npm run build`: pass. Existing public-content generation logged the expected unavailable local database fallback while using the deliberately unreachable test URL; all 45 static pages completed and the production bundle was emitted.
- Production gate with the flag absent: `/preview/ui` returned `404`.
- Production gate with `KMT_ENABLE_UI_PREVIEW=true`: `/preview/ui` returned `200` and the expected preview content.
- `git diff --check`: pass before commit.

The approved Motion `13.1.1` and `@base-ui/react` `1.8.0` installation could not be performed because automatic approval review rejected both install attempts after the host usage limit was reached. No dependency was added and no substitute library was introduced. The preview uses existing CSS, reduced-motion rules, and native `<dialog>`. No Motion bundle-size claim is made.

This evidence uses loopback Chromium at the three requested viewport widths. It does not claim physical-device coverage, a real booking, provider integration, payment behavior, or database behavior.

This batch completes the isolated public preview milestone only. Motion/Base UI integration and measurement, fuller hero/chat motion, client/admin preview work, and user approval of the visual direction remain open before any preview is promoted to product routes.
