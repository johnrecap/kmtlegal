# 60 — Auth: Login + 2FA Stub

> Phase 3 (before portal phase completes) · Depends on `00`, `01`.

## Routes

| Route | Source |
|---|---|
| `/login?locale=&next=&reason=` | `src/app/(login)/login/page.tsx` + `src/features/auth/login-form.tsx` |
| `/login/2fa` | `src/app/(app-ar)/login/2fa/page.tsx` (stub, `notFound()`) |

## Components

Split hero: brand + security note + language toggle | LoginForm card (validation, error-code mapping, safe redirect). Layout reads `x-kmt-login-locale` header.

## Issues (audit)

- [P1] `/login` does not redirect already-authenticated users — `redirectSignedInUser` exists unused (`login/page.tsx:29-42`, `src/server/auth/page-guards.tsx:38-41`).
- [P3] 2FA stub: dead metadata + resulting 404 CTA points to `/admin` (wrong for anonymous visitors) (`2fa/page.tsx:4-10`, `(app-ar)/not-found.tsx:9`).
- [P3] Suspense fallback is a bare white box (`login/page.tsx:76`).
- [P3] Login is light-themed between two dark surfaces (public → login → portal).

## Tasks

- [ ] T60.1 Redirect signed-in users via `redirectSignedInUser` (role-aware target, respects `next`).
- [ ] T60.2 LoginForm on new Field/Button components; primary submit = gold AA button; error `role="alert"` + per-field errors kept; `2fa_expired` notice kept.
- [ ] T60.3 Theme: mount ThemeProvider (default dark to match public/portal continuity); login card = surface token with glass treatment; both themes verified.
- [ ] T60.4 Suspense fallback → login-card skeleton (T1.9).
- [ ] T60.5 2FA stub: remove dead metadata; make the 404 for this path anonymous-safe (CTA → `/login` not `/admin`) — adjust `(app-ar)/not-found.tsx` or add login-scoped not-found.
- [ ] T60.6 Security-note card + language toggle retokenized; `next`/`reason` params preserved in toggle.

## Verify

- [ ] Signed-in visit to `/login` redirects to correct role target; anonymous login e2e green.
- [ ] Screenshots 375/1440 × EN/AR × themes.
