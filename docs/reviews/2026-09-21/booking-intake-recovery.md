# Booking intake recovery — 2026-09-21

## User-visible behavior

The public assistant collects one missing field at a time and preserves accepted fields when AI extraction fails. Structured start/category actions and recognized standalone contact replies do not require a model. A direct legal question receives a boundary message followed by the next booking question; it does not discard the draft or imply that a staff member has joined the chat.

The original incident was assessed from the supplied transcript and local code. Production provider logs and the deployed revision were not accessed. The patch fixes independently verified failure paths; it does not establish the original upstream provider failure.

## Existing contracts extended

- `POST /api/public/consultations/assistant` accepts optional `event`: `start_booking`, `select_category`, or `message`. Category events validate the chosen category and clear a previously selected slot.
- Intake responses include `intake.status` (`understood`, `degraded`, `needs_clarification`, `legal_boundary`), `intake.progressed`, and `intake.nextField`. Consumers must count unsuccessful conversational turns even when HTTP succeeds, and reset recovery state on progress.
- An optional `categorySuggestion` contains `current` and `suggested`. An assault description after another area was selected suggests general consultation without silently changing the client's selection. The choice remains reviewable before confirmation.
- The server derives the missing field from a normalized draft. AI receives `conversationContext.expectedField` and collected field names alongside that draft. Client-supplied prose does not authorize a booking or change payment state.
- Model-extracted names and contact details require evidence in the current client message. The saved matter summary comes from client text, never model-written advice or invented facts.
- Intake prompts live in `src/content/booking-assistant-copy.ts`; public UI copy stays in the existing Arabic/English content catalogs. Model-written follow-up prose is not rendered.
- Booking confirmation, price resolution, slot conflict checks, paid checkout, verified payment notifications, reference inquiries, and client authorization remain owned by their existing server services.

## AI operation and diagnostics

`AI_STRUCTURED_OUTPUTS` defaults to `off`. Set it to `json_schema` only after checking support for the configured model/provider. The HTTP adapter uses the existing output schema; local schema validation remains mandatory. No provider, model, key, or production configuration was changed by this patch.

The `booking.intake` operational event contains request ID, understanding status, progress, next field name, and missing-field count. Provider diagnostics distinguish provider/timeout/schema/safety failures. Do not log raw prompts, extracted client fields, or provider response bodies. Public intake continues to use `recordRun: false`, so it does not introduce a database dependency for AI-run recording.

To investigate a deployed failure, correlate the request ID with the app's PM2 logs and check the running revision and non-secret provider/model configuration. Never paste environment files, credentials, or client conversations into public issue reports.

```bash
pm2 logs kmtlegal --lines 120 --nostream
```

## Verification

- Focused server regressions cover incremental Arabic intake, provider outage, stale category-only summaries, plain names and Arabic-digit phones, legal-boundary continuation, low-confidence flags, unsafe model follow-up text, category validation, and stale-slot invalidation.
- Browser regressions cover both languages, unsuccessful HTTP-200 turns, recovery-counter reset, retained category selections, legal requests reaching server policy, and incremental intake.
- Full local Vitest suite: **92 files passed, 5 skipped; 658 tests passed, 53 skipped**. Environment-dependent skipped suites were not counted as passes.
- Focused intake/contract/conversation server suite: **81 tests passed**.
- TypeScript (`tsc --noEmit`) and Next ESLint: passed.
- Browser regression coverage: **57 unique scenarios passed across sequential runs** in the three booking specs (`batch5-chat-recovery`, `booking-stepper-validation`, `booking-recovery`), including Arabic/English and 390/768/1440px viewports. The final run used the existing `http://localhost:3000` server with mocked booking/payment writes. Responsive-header selectors and old request-count expectations were updated; affected cases were rerun. Arabic mobile screenshot visually reviewed.
- Latest integrated intake/provider/UI regression subset: **49 tests passed**.
- Production build: **not completed locally**. `npm run build` successfully generated Prisma Client, then Next compilation terminated with `FATAL ERROR: Zone Allocation failed - process out of memory`, even with one worker and a 2048MB heap limit. Earlier isolated dev-server/browser runs also exhausted local memory; no successful production build is claimed.
- The server update must complete its build and health gates before deployment can be considered verified.
- No real provider, payment gateway, production database, or deployed booking was exercised.

## Deployment

No migration or new package is required. Use the existing protected aaPanel/PM2 update:

```bash
cd /www/wwwroot/kmtlegal
bash deploy/install/aapanel-pm2-update.sh
```

After deployment, verify synthetic Arabic and English intake without confirming a production booking; confirm the name advances to phone, provider degradation still advances recognized fields, and no misleading automatic staff handoff is shown. A real-provider smoke remains an operational check.
