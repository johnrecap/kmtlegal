# 07 — Cases, Clients & CRM Audit

## Clients — PARTIAL (MEDIUM)

| Operation | UI | Backend/API | DB | Permission | Status |
|---|---|---|---|---|---|
| List + search | `/admin/clients` | `GET /api/admin/clients` → `listAdminClients` | `Client` | `client.read.any\|assigned` | PARTIAL |
| Detail (cases/consultations/appointments/docs/payments) | `/admin/clients/[clientId]` | `GET …/[clientId]` → `getAdminClientDetail` | joins | scoped, 403 out-of-scope | PARTIAL |
| Create | Reports "add unavailable" | `createAdminClient` exists | `Client` | — | NOT WIRED (UI/service mismatch) |
| Edit | `ClientCrmForms` | `PATCH …/[clientId]` → `updateAdminClient` | `Client` | `client.update.any` | PARTIAL |
| Assign lawyer | form | `POST …/assign` | `assignedLawyerId` | staff | PARTIAL |
| Archive/status | form | `POST …/archive` | `ClientStatus` 5-state | staff | PARTIAL |
| Portal account link/create | form | `POST …/account` | `User` + `Client.userId` unique | `client.account.manage` | PARTIAL |
| Password reset | form | `POST …/account/password` (hash + tx + optional revoke + audit) | `User.passwordHash` | `client.account.manage` | PARTIAL |
| Consultation links | detail view | via `ConsultationRequest.clientId` | relation SetNull | scoped | PARTIAL |

Relationships: `Client 1—* LegalCase (Restrict)`, `Appointment (Restrict)`,
`Payment (Restrict)`, `ConsultationRequest/Document threads (SetNull/
Cascade)`. `phoneCanonical` stored; 24h booking-duplicate guard keys on
phone/email.

## Cases — PARTIAL (MEDIUM)

| Operation | UI | Backend/API | DB | Status |
|---|---|---|---|---|
| Manual create | `/admin/cases/new` → `ManualCaseForm` | `POST /api/admin/cases` → `createManualCase` | `LegalCase`, `internalFileNumber` unique | PARTIAL |
| Edit core | detail forms | `PATCH …/[caseId]`, `updateManualCore` | `LegalCase` | PARTIAL |
| Status/priority | forms | `POST …/[caseId]/status` | `CaseStatus`, `CasePriority` | PARTIAL |
| Assigned lawyer | forms | service-scoped | `assignedLawyerId` Restrict | PARTIAL |
| Parties | roster UI | service | `CaseParty` Cascade | PARTIAL |
| Sessions log | `createAdminCaseSession` | `POST …/sessions` | `CaseSession` Cascade | PARTIAL |
| Appointments/tasks/docs/notes tabs | detail tabs | respective services | relations | PARTIAL |
| Convert from consultation | action | `convert` (links `consultationRequestId` unique) | `LegalCase` | PARTIAL |
| Financial links | `CasePaymentsGroup` | `Payment.caseId` | relation SetNull | PARTIAL |

## Protections & history

- Duplicate-client protection: PARTIAL — canonical phone + 24h booking
  guard; no admin-side fuzzy-duplicate warning.
- Duplicate-case prevention: unique `internalFileNumber` only; no
  same-client/same-title guard → GAP (P3).
- Audit history: WORKING (MEDIUM) — `AuditLog` rows per mutation with
  actor/resource/metadata (redacted).
- Archival: `ClientStatus` 5-state + task `ARCHIVED`; cases have no
  archived flag (status-driven) → minor GAP.
- Deletion: soft (`deletedAt`, `DELETED` statuses); file bytes retained;
  no hard-delete path; no retention policy → P3.

## Weaknesses

1. Client-create UI/service mismatch (NOT WIRED).
2. No case merge/split, no bulk ops, no duplicate warnings.
3. No client-facing case timeline beyond grouped lists.
4. `internalFileNumber` generation scheme not reviewed here (needs ops
   confirm) → UNKNOWN (minor).
