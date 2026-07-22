# KMT Legal Feature Inventory

Last updated: 2026-07-22

## Public Site

- English-first public website with Arabic `/ar` routes.
- Public shell, navigation, services, team, articles, case studies, media/contact/legal pages.
- Dark luxury public visual system, public motion system, responsive Arabic RTL support.
- Public contact form with validation, rate limiting, audit metadata, and no-store API behavior.

## Consultation Booking

- Admin-controlled consultation entry mode: `AI_CHAT_PAID` for chat plus mandatory hosted checkout, or `AI_CHAT_FREE` for the same AI chat flow without a booking fee; legacy `PAID_CHAT`/`MANUAL_REVIEW` values are normalized.
- Chat-first public booking assistant with Arabic/English language choice in both paid and free booking modes.
- Public booking review shows the client's email state, initial request area, and the client's real request summary; generic AI text such as a general booking intent is rejected as an insufficient request description.
- In free booking mode, the assistant confirms the consultation appointment after client approval without creating a payment attempt.
- Booking field collection, service classification, phone/name/date validation, slot selection, conflict recovery.
- Secretary-managed consultation availability.
- New paid booking v1: server-side pricing review, payment attempt creation, hosted checkout URL, return/status page, trusted webhook confirmation.
- Temporary reservation: appointment status `RESERVED` while payment is pending; confirmed appointment uses `SCHEDULED` only after trusted payment.
- Confirmed consultation bookings create secretary review alerts after free chat confirmation or after paid webhook confirmation.
- Successful confirmed consultation bookings expose a signed, time-limited client account setup link so the client can choose an email/password and see the request in `/client`.
- The original booking uses its earliest case-less `CONSULTATION` appointment as the canonical primary appointment; later case follow-ups do not change the booking outcome.
- At or after the primary appointment end, the 60-second maintenance cycle classifies an unassigned and unreviewed request as `MISSED`, otherwise as `AWAITING_RESULT`.
- No consultation becomes successful automatically. Secretary, Office Admin, or Super Admin users with both required permissions record `SUCCESSFUL`, `NO_SHOW`, or `CANCELLED` manually, with optimistic version checks and audit history.
- Missed requests require the explicit audited reopen-and-reschedule flow with an active lawyer, future Cairo time, and lawyer/client conflict checks before returning to `PENDING`.

## AI

- Provider-neutral AI gateway with mock/local/OpenAI-compatible providers.
- Public booking AI uses schema-validated structured intake extraction to understand multilingual free text, then the server validates and asks for any missing booking fields.
- Client assistant reads only client-owned data and refuses legal advice.
- AI does not price, collect card data, confirm payment, or override webhook truth.

## Client Portal

- Protected `/client` portal with dashboard, cases, appointments/court dates, documents, payments, profile, AI assistant, and team chat.
- Public post-booking account setup can create or link a Client-role user account to the booked consultation's `Client` record, then signs the client into the portal.
- Client payments now distinguish internal invoices from gateway payment attempts.
- Gateway attempt cards expose pay/status actions without treating pending attempts as paid invoices.
- Paid consultation invoices expose a signed printable receipt page with the client name, phone, amount, invoice number, receipt reference, office name, and KMT logo.

## Admin

- Admin dashboard, CRM clients, consultations, cases, calendar, sessions, tasks, documents, users, settings, audit log, messages, finance, and reports.
- Admin consultation queue includes secretary review status, unreviewed/unassigned filters, post-booking review action, and next-request navigation.
- Admin consultation operations include seven shareable RTL outcome tabs with counts, primary start/end time, effective status, responsive cards, manual result/correction controls, and missed-request reopen recovery.
- Dashboard cards link directly to `AWAITING_RESULT` and `MISSED` queues; calendar and notification surfaces use the same canonical consultation outcome state.
- Dashboard shell includes consultation review notifications for staff with `consultation.review.any`.
- Finance now includes manual invoices plus gateway operations visibility: pricing rules, payment attempts, webhook events, operational filters, replay, CSV export, and visible manual-review issue labels.
- Finance settings include the active consultation booking mode plus active payment provider readiness, without storing provider or AI secrets.
- Role/permission model protects admin and portal surfaces.

## Finance And Payments

- Manual invoice/payment tracking remains available.
- Gateway payment foundation adds `ConsultationPricingRule`, `PaymentAttempt`, `PaymentTransaction`, `PaymentWebhookEvent`.
- `Payment` is created as the internal paid invoice after trusted gateway confirmation.
- Paid gateway invoices can be viewed from the payment return page and client payments page through signed receipt links.
- Reconciliation keys link provider transaction, attempt, payment/invoice, appointment, and consultation request.
- Public tokenless payment status does not expose client identity, checkout/receipt/account links, or legal request details.
- Payment webhook events keep a redacted payload snapshot plus normalized data and payload hash for audit without storing raw personal details.
- Manual paid finance records reject gateway-managed method labels and repeated receipt numbers across manual paid records.

## Content

- Articles, case studies, social draft workflow, AI social draft generation, locale-aware public content reads.

## Auth, Roles, Privacy, Uploads

- Staff sessions, client sessions, RBAC, portal ownership guards, audit logs.
- Private file upload/download pipeline, visibility checks, content validation, size/type limits.
- Security headers, CSRF/origin hardening, safe logging, redaction, no real secrets in repo.

## Analytics And Observability

- Internal analytics events with strict taxonomy and privacy-safe properties.
- Payment events added for checkout creation and webhook success/failure.
- Request IDs and audit metadata propagate across critical backend operations.
- Payment maintenance can optionally send safe failure alerts through `PAYMENT_MAINTENANCE_ALERT_WEBHOOK_URL`.
- The existing payment-maintenance PM2 process also performs idempotent consultation outcome reconciliation every 60 seconds and emits privacy-safe aggregate counts without client text or identity.

## Deployment And Operations

- The aaPanel/PM2 update path creates and validates a custom-format PostgreSQL backup outside the Git checkout before migrations.
- After migrations it runs one reconciliation cycle before restarting the app/maintenance process, then verifies the maintenance process stays online with an unchanged restart counter for longer than one full cycle.
- Global npm configuration and deprecated Nginx HTTP/2 directive remediation remain documented manual operations with backups and syntax checks; deploy automation does not silently edit them.
