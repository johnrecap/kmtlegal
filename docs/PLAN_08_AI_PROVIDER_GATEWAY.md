# PLAN-08 AI Provider Gateway and Legal Guardrails

## Implemented

- Provider-agnostic gateway in `src/server/ai/gateway.ts`.
- Provider registry for `mock`, `openrouter`, `openai-compatible`, `local`, and `custom`.
- Deterministic mock provider in `src/server/ai/providers/mock.ts`.
- OpenAI-compatible HTTP adapter in `src/server/ai/providers/openai-compatible.ts`.
- AI config from env in `src/server/ai/config.ts`.
- Shared safety policy in `src/server/ai/safety.ts`.
- Output schemas for supported tasks in `src/server/ai/schemas.ts`.
- Review disclaimer copy in `src/server/ai/copy.ts`.
- AI run metadata persistence through `AiProviderRun`, without raw prompts, raw provider responses, document contents, API keys, or legal summaries.

## Supported Tasks

- `consultation_classification`
- `intake_summary`
- `document_checklist_suggestion`
- `anonymous_case_study_draft`
- `social_post_draft`

## Contract Rules

- UI and feature services call `generateStructured(...)`; they never call providers directly.
- Provider responses normalize to provider, model, task, output, usage, latency, reviewRequired, and requestId.
- All output is schema-validated.
- All output is review-gated.
- Phrases that claim final legal advice are rejected.
- Non-OpenAI-compatible providers must be wrapped behind the same adapter boundary.

## Tests

- `tests/server/ai-gateway.test.ts`

## Still Open

- Real provider smoke is blocked until production/staging `AI_PROVIDER`, `AI_BASE_URL`, `AI_API_KEY`, and `AI_MODEL` are selected.
- AI integration into booking/content flows starts in later feature plans.
