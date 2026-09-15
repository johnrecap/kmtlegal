# 54 — Admin Notifications + Contact-Messages Inbox

> Phase 4 · Depends on `00`, `01`, `40`.

## Routes

`/admin/notifications`, `/admin/contact-messages` — `src/app/(app-ar)/admin/notifications/page.tsx`, `admin/contact-messages/*`.

## Components

Notifications list (mark-read actions, filters), contact-message inbox (FilterBar + table + detail actions).

## Issues (audit)

- [P3] Contact inbox follows the good pagination pattern (clear-filters present) — keep, adopt shared component.
- [P3] Notification list styling is basic relative to the rest of admin.

## Tasks

- [ ] T54.1 Notifications: list on tokens; unread indicator (gold dot), mark-read with subtle motion (150ms, reduced-motion: instant); bulk mark-read as secondary Button; empty state with copy.
- [ ] T54.2 Contact inbox: retokenized table + shared pagination (pattern already correct); message detail in Dialog with localized reply/status actions kept.
- [ ] T54.3 Both themes; timestamps + sender isolation (`bdi`).

## Verify

- [ ] Mark-read round-trip updates badge count in shell popover (T40.3).
- [ ] Screenshots 375/1440 × themes.
