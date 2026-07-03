# KMT Legal Feature Inventory

Last updated: 2026-07-03

## Public Site

- English-first public website with Arabic `/ar` routes.
- Public shell, navigation, services, team, articles, case studies, media/contact/legal pages.
- Dark luxury public visual system, public motion system, responsive Arabic RTL support.
- Public contact form with validation, rate limiting, audit metadata, and no-store API behavior.

## Consultation Booking

- Chat-first public booking assistant with Arabic/English language choice.
- Booking field collection, service classification, phone/name/date validation, slot selection, conflict recovery.
- Secretary-managed consultation availability.
- New paid booking v1: server-side pricing review, payment attempt creation, hosted checkout URL, return/status page, trusted webhook confirmation.
- Temporary reservation: appointment status `RESERVED` while payment is pending; confirmed appointment uses `SCHEDULED` only after trusted payment.

## AI

- Provider-neutral AI gateway with mock/local/OpenAI-compatible providers.
- Public booking AI assists with intake and classification only.
- Client assistant reads only client-owned data and refuses legal advice.
- AI does not price, collect card data, confirm payment, or override webhook truth.

## Client Portal

- Protected `/client` portal with dashboard, cases, appointments/court dates, documents, payments, profile, AI assistant, and team chat.
- Client payments now distinguish internal invoices from gateway payment attempts.
- Gateway attempt cards expose pay/status actions without treating pending attempts as paid invoices.

## Admin

- Admin dashboard, CRM clients, consultations, cases, calendar, sessions, tasks, documents, users, settings, audit log, messages, finance, and reports.
- Finance now includes manual invoices plus gateway operations visibility: pricing rules, payment attempts, and webhook events.
- Role/permission model protects admin and portal surfaces.

## Finance And Payments

- Manual invoice/payment tracking remains available.
- Gateway payment foundation adds `ConsultationPricingRule`, `PaymentAttempt`, `PaymentTransaction`, `PaymentWebhookEvent`.
- `Payment` is created as the internal paid invoice after trusted gateway confirmation.
- Reconciliation keys link provider transaction, attempt, payment/invoice, appointment, and consultation request.

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
