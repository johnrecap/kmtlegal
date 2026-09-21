# 03 — Client Portal Audit

Guard: `requirePortalPage()` + `clientPortalGuardIssue()` — `role==Client`
with linked `clientId`, else `PermissionBlocked`. All data scoped by
`assertClientPortalAccess(actor)` → `ownClientWhere/ownCaseWhere`
(`src/server/portal/client-portal-service.ts:27-63`). Confidence MEDIUM
throughout (code-complete, service-tested; no live session proven here).

## `/client` Dashboard — Status: PARTIAL

- Data: case count + 5 recent cases, 5 upcoming appointments
  (`SCHEDULED|RESCHEDULED`, future), documents count, open balance;
  `nextStep` CTA (due payment → appointments → files → assistant).
- Frontend: `src/features/client/*` dashboard view. Backend:
  `getPortalDashboard`. Models: `Client,LegalCase,Appointment,Document,Payment`.
- Actions: navigation only. Empty/loading/error states present per layout
  patterns; mobile/RTL/theme inherit portal shell.
- GAP: no notifications widget, no unread chat badge, no upcoming-hearing
  countdown.

## `/client/cases` + `/client/cases/[caseId]` — Status: PARTIAL

- List: `title/internalFileNumber/status/priority/lawyer/nextSessionAt`
  via `listPortalCases`. Read-only.
- Detail: header (status/priority/lawyer/next/created/summary) +
  `SessionsGroup` (courtName/sessionDate/decision/nextSessionDate),
  `CaseAppointmentsGroup`, `CaseDocumentsGroup` (`CLIENT_VISIBLE` only),
  `CasePaymentsGroup` via `getPortalCaseDetail`.
- Provides: case status ✓, lawyer info ✓ (assigned lawyer), sessions ✓,
  appointments ✓ (read), document downloads ✓ (authorized links),
  invoice/payment history ✓, receipts ✓ (PAID + token link).
- GAP: no case timeline/audit for client, no session outcome
  notifications, no document request flow.

## `/client/assistant` (AI organizer + team chat tab) — Status: PARTIAL

- AI: `ClientAssistantPanel` → `POST /api/client/assistant` →
  `handleClientConsultationAssistant`. Deterministic keyword organizer
  (intents `sessions|cases|documents|payments|appointments`,
  `out_of_scope`/`forbidden_data` refusals), data from portal listers
  (sessions take 20). Always disclaimer + `requestId`. Rate-limited.
  NOT a generative LLM — cannot give legal advice by design ✓.
- Chat: `ClientTeamChatPanel` (no standalone route) → `GET|POST
  /api/client/messages*`. Single active `OPEN|WAITING_STAFF|WAITING_CLIENT`
  thread auto-created; reply flips to `WAITING_STAFF`; `CLOSED|ARCHIVED`
  blocks; text 1..2000; **5s polling, no websocket**.
- GAP: chat hidden inside assistant (discoverability), no attachments, no
  read receipts, no typing indicator, no notifications on staff reply.

## `/client/files` — Status: PARTIAL

- List + authorized download links; upload via `DocumentUploadForm`
  (`accept` PDF/DOC/DOCX/JPG/PNG, `visibility=CLIENT_VISIBLE` forced) →
  `POST /api/files/upload` → server allowlist + magic bytes + ClamAV.
- Provides: uploads ✓, downloads ✓.
- GAP: no delete/rename/version, no `STAFF_ONLY` visibility, no upload
  progress for large files (5MB cap keeps this minor).

## `/client/court-dates` — Status: PARTIAL

- `listPortalAppointments`: title/type/case/time/mode/lawyer/status +
  `pendingOfficeReview` flag. Read-only.
- GAP: route name says court-dates but shows all appointments; no
  booking/cancel/reschedule/request actions; no reminders.

## `/client/payments` — Status: PARTIAL

- Metrics (open/dues), gateway attempt cards (`continuePayment` via
  `checkoutUrl` when `CREATED|PENDING`, `followStatus` → return page with
  attempt token), invoice table, receipt link only when fully PAID and
  not under review → HMAC receipt URL (7d).
- Provides: payment history ✓, receipts ✓ (gateway-paid only).
- GAP: no in-portal payment creation (external checkout only), no manual
  invoice receipt view, no failed-payment retry guidance beyond return
  page, no refund visibility.

## `/client/profile` — Status: PARTIAL

- Editable `fullName/phone/email/city` (`PATCH /api/client/profile`,
  double-checks `client.userId === actor.id` else 404); locale via
  `PATCH /api/client/preferences` (`ar|en`); read-only login email,
  assigned lawyer, created date.
- GAP: no password change, no 2FA management (disabled globally), no
  avatar, no notification preferences.

## Missing client capabilities (GAPs, not invented as features)

1. Appointment self-service (book/cancel/reschedule/request).
2. Standalone messages route + reply notifications.
3. Password change + notification preferences.
4. File management (delete/rename/version).
5. Case progress timeline + hearing reminders.
6. Payment creation + refund status + manual-invoice receipts.
7. Download-all / share case file.
