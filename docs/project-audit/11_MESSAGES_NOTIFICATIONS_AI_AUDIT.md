# 11 — Messages, Notifications & AI Audit

## Public contact messages — PARTIAL (MEDIUM)

`ContactForm` → `POST /api/public/contact` (zod: topic enum, 10..2000
chars, `consent=true`; rate-limited) → `ContactMessage NEW` +
`phoneCanonical` + audit + fail-soft staff notifications → `201
{id, MSG-<8>}`. Admin inbox `NEW→REVIEWED→ARCHIVED` (forward-only; no
in-place reply — must use thread or external mail, and SMTP is off).

## Admin ↔ client chat — PARTIAL (MEDIUM)

- Persistence: YES (`ConversationThread` + `ConversationMessage`, TEXT
  body, sender CLIENT/STAFF/SYSTEM).
- Transport: 5s polling both panels (`cache:no-store`); no websocket/SSE.
- Unread: inferred via `WAITING_STAFF/WAITING_CLIENT` + `lastMessageAt`
  (no read-receipt columns).
- Assignment: staff assign (restricted roles); single active thread per
  client auto-reused; `CLOSED|ARCHIVED` blocks replies.
- Attachments: NO. Moderation: length caps + rate limits + server scoping
  (`findClientThreadOrThrow` 404s cross-client); no profanity/PII filter
  on bodies (P4).
- Validation/error/loading states present; RTL/theme inherit shells.

## Notifications — PARTIAL (MEDIUM)

- Persistence: YES (`Notification` + dedupe `@@unique(user,type,resource)`).
- Polling: 30s bell + on-open refresh; cursor pagination; manual `readAt`.
- Routing: `safeNotificationHref` allowlists `/admin`, validates
  case/consultation ownership, demotes deep links to list pages.
- Triggers wired: consultation-review (scheduled+unreviewed+pending),
  consultation-outcome (`AWAITING_RESULT|MISSED` upsert, else resolve),
  contact-message (NEW). Fail-soft (never breaks the write path).
- NOT WIRED: `CASE|APPOINTMENT|DOCUMENT|PAYMENT|SECURITY` types,
  client-side delivery, email/SMS/push, digests, preferences.

## AI — PARTIAL, default MOCK (MEDIUM)

- Actual provider: NO vendor SDK. OpenAI-compatible `fetch` gateway with
  `mock|openrouter|openai-compatible|local|custom` (default `mock-kmt-
  legal-v1`; openrouter default `google/gemini-2.5-flash`, inactive
  without env). All traffic via `generateStructured()`:
  strict-JSON instruction → zod validation → `assertNoFinalLegalAdviceText`
  → `AiProviderRun` audit row (`reviewRequired=true`).
- Tasks: `booking_intake_extraction, consultation_classification,
  consultation_assistant, intake_summary, document_checklist_suggestion,
  anonymous_case_study_draft, social_post_draft`.
- Client assistant: NO LLM (deterministic organizer + disclaimer).
- Public booking: extraction with deterministic fallback (`recordRun:false`
  path keeps booking working with AI down).
- Safeguards: `requireHumanReview + prohibitLegalAdvice + redactBeforeLogging`
  forced; social drafts forced `LEGAL_REVIEW`; case-study drafts blocked on
  identifiers (`isAnonymized` + email/phone/`KMT-\d+` regex); 2000-char caps;
  `ai 20/10m` rate limit.
- Can it give legal advice? Code prohibits final legal advice text and
  forces human review; no evidence of client/case data exfiltration path
  (assistants use scoped listers). Residual risk is prompt-level, not
  architectural → LOW, P3 (red-team prompts before enabling live model).
