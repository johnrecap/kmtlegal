# Data Model: Site Cleanup, Contact Alerts, and Client Localization

## Migration Decision

One additive Prisma/PostgreSQL migration is required:

- Add `ConsultationRequest.locale` as non-null text with default `ar`.
- Backfill occurs safely through the default for existing rows.
- Add a database check constraint that permits only `ar` and `en`.
- No row, relationship, or existing value is removed.
- Application rollback keeps the additive field; a forward fix is preferred over dropping data.

## Existing Entities Used

### ContactMessage

- The existing row remains the durable source of a visitor inquiry.
- Existing `NEW → REVIEWED/ARCHIVED` and `REVIEWED → ARCHIVED` transitions remain unchanged.
- Alert creation happens only after the row is accepted.

### Notification

- `userId`: eligible active recipient.
- `type`: existing `SYSTEM`.
- `title` and `body`: generic centralized Arabic staff copy with no visitor fields.
- `resourceType`: `ContactMessage`.
- `resourceId`: contact message UUID.
- `actionUrl`: `/admin/contact-messages?status=NEW&sortBy=createdAt&sortDirection=desc`.
- `readAt`: existing per-user read state.
- Existing unique `(userId, type, resourceType, resourceId)` prevents duplicates.

### User / Role / RolePermission

- `User.locale`: existing stored client preference; normalized to `ar` or `en`.
- Recipient selection uses active user, non-deleted user, active role, and effective role
  permissions.
- Locale preference updates the authenticated client user's row only.

### ConsultationRequest

- `locale`: the confirmed public booking language (`ar` or `en`).
- New public consultation and assistant booking writers persist the request locale.
- Delayed payment/account setup reads this stored value rather than a query or form value.
- Historical rows default to Arabic.

## Validation and Ownership

- Client locale accepts only `ar` or `en`; unsupported values do not change the row.
- Preference input contains no user ID; actor identity comes from the active session.
- Client role plus linked client profile is required before preference or profile mutation.
- No contact fields are copied into notification title/body or operational failure logs.

## Lifecycle

1. Contact message row is created.
2. Existing best-effort audit runs.
3. Eligible recipient IDs are resolved from current roles/permissions.
4. Deduplicated notification rows are inserted.
5. Notification delivery failure is logged safely and does not alter the contact row.
6. A public booking stores its confirmed locale with the consultation.
7. Delayed payment/account setup signs the stored consultation locale into the setup token.
8. Client locale is read on every authenticated render and changed only by the client preference
   mutation or signed account setup.
