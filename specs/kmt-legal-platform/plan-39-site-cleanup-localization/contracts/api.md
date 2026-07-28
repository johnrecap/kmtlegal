# API Contract: PLAN-39

All responses keep the existing `{ data, requestId }` success envelope and standard `{ error,
requestId }` failure envelope. All routes are `Cache-Control: no-store`.

## POST `/api/public/contact`

- Request and 201 response remain unchanged.
- After the contact row is accepted, the server attempts permission-based generic notifications.
- Notification failure is not included in the visitor response and does not change the 201.

## GET `/api/client/profile`

- Requires an active authenticated Client user linked to the requested client profile.
- Returns the existing profile projection previously served by `/api/portal/profile`.
- Failure statuses remain 401, 403, 404, and standard 500 mapping.

## PATCH `/api/client/profile`

- Requires the same self-owned client access.
- Body remains:

```json
{
  "fullName": "string",
  "phone": "string",
  "email": "optional string",
  "city": "optional string"
}
```

- The former `/api/portal/profile` route is absent and returns 404.

## PATCH `/api/client/preferences`

- Requires an active authenticated Client role and linked client profile.
- Strict request body:

```json
{
  "locale": "ar | en"
}
```

- Success 200:

```json
{
  "data": {
    "locale": "ar | en"
  },
  "requestId": "string"
}
```

- 400 `VALIDATION_ERROR`: missing, unsupported, or additional fields.
- 401 `UNAUTHENTICATED`: no active session.
- 403 `PERMISSION_DENIED`: not a linked Client account.
- No user ID is accepted; another user's preference cannot be targeted.

## Public client-account setup

- The signed setup token contains the confirmed `ar`/`en` booking locale.
- Account setup renders and submits in that locale.
- The server stores the signed locale and rejects token/payload inconsistencies.
- Existing token expiry, consultation ownership, email, password, and session behavior remains.
