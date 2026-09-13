# Batch 16: isolated public UI preview

## Local route

Open `http://127.0.0.1:3130/preview/ui` after starting the development server with `KMT_ENABLE_UI_PREVIEW=true`. The route is server-gated: in production it returns `notFound()` unless that variable is exactly `true`. It has no navigation entry, API call, booking write, payment flow, or provider call.

## Delivered preview

`src/features/ui-preview/ui-preview.tsx` provides three client-side views in English and Arabic from one preserved draft state:

- Home: image-led architectural hero, direct consultation action, numbered service rows, process rail, image-led people and compact sector editorial list.
- Service detail: documented `legalServices` scope, outcomes and the source-defined helper-document list, explicitly framed as guidance rather than a new document requirement.
- Booking: sample-only slots, editable selected service/method/details, live desktop summary, native-dialog mobile summary, simulated conflict/retry and simulated confirmation. No result represents a booking, payment, reference, office availability or legal advice.

New preview copy lives only in `src/content/ui-preview-content.ts`; factual service, person, industry and process data continues to come from existing `public-content.*` sources. The module CSS preserves existing public tokens: canvas `#060504`, surfaces `#07090b`/`#0c1116`, text `#f8f3ea`, muted `#cbd5e1`, and public gold `#c79a52`.

## Manual interaction evidence

At `127.0.0.1:3130`, browser accessibility inspection confirmed the home view and each service row. The booking preview accepted a details draft and sample `12:30` slot, showed its explicit simulated confirmation, then preserved both slot and typed details after switching to Arabic. Its accessibility tree exposed the controls, summary, warning, and Arabic labels. The browser route returned HTTP 200 after the CSS-module selector fix.

## Verification and limits

- `npm run typecheck`: pass.
- `git diff --check`: pass before handoff.
- The exact Motion/Base UI installation was attempted but automatic approval rejected it due to host usage limits. No dependency was added and no workaround was used. This preview uses CSS transitions/reduced-motion rules and native `<dialog>` for the mobile summary focus/escape behavior.
- The full 3 × 2 × 3 screenshot matrix, automated Playwright suite, bundle-size measurement and production build remain required before promoting these isolated previews to product routes. No bundle size is claimed.

## Follow-up corrections

The preview now invalidates a simulated confirmation whenever the service, method, details, or sample slot changes. Simulating an unavailable slot clears only that slot and keeps the other draft answers for retry. Mobile navigation remains visible, and the client-side scroll action uses instant scrolling when reduced motion is requested. The server page calls 
oStore() before evaluating the runtime preview gate so it is not cached as an enabled production artifact.
