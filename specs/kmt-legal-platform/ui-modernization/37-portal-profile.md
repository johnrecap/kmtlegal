# 37 — Portal Profile

> Phase 3 · Depends on `00`, `01`, `30`.

## Route

`/client/profile` — `src/app/(client)/client/profile/page.tsx` + `src/features/portal/profile-form.tsx`.

## Components

Edit form (name/phone/email/city) beside read-only account panel (login email, responsible lawyer, file creation date).

## Issues (audit)

- [P2] Success and error feedback share one blue `role="status"` box (`profile-form.tsx:30,53,57,76-80`).
- [P3] Hardcoded `"غير محدد"` fallback (shared, fixed in T30.7).

## Tasks

- [ ] T37.1 Form on new Field/Button components; validation + server error mapping via `clientErrorMessage` kept.
- [ ] T37.2 Feedback: success = success InlineFeedback ("saved" + check icon, auto-fade 4s); error = `role="alert"` danger InlineFeedback with localized message.
- [ ] T37.3 Account panel on Card tokens; `dl` layout kept; emails/phones `dir="ltr"`.
- [ ] T37.4 Dirty-state guard: warn before navigating away with unsaved changes (native `beforeunload` + router event, both locales).

## Verify

- [ ] Save success + failure (API error) show distinct feedback; unsaved-changes guard fires.
- [ ] Screenshots 375/1440 × EN/AR × themes.
