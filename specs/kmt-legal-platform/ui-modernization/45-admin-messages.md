# 45 — Admin Messages (list + thread)

> Phase 4 · Depends on `00`, `01`, `40`.

## Routes

`/admin/messages`, `/admin/messages/[threadId]` — `src/app/(app-ar)/admin/messages/*` + `src/features/admin/messages/admin-message-thread-panel.tsx`.

## Components

Thread list (FilterBar + table/mobile cards), thread panel (polling + mutation-version guards, reply composer, status actions).

## Issues (audit)

- [P2] Composer textarea unlabeled (placeholder only) (`admin-message-thread-panel.tsx:245-255`).
- [P2] Raw red error box (`:243`).
- [P2] No auto-scroll to latest after polls/sends (`:205`).
- [P3] Chat bubble corners physically flipped in RTL (`rounded-br-md`/`rounded-bl-md`, `:219`).
- [P3] Custom selects bypass Select component (`:288,305`).
- [P3] Pagination `justify-end` no clear-filters (`messages/page.tsx:192`).

## Tasks

- [ ] T45.1 Thread panel: bubbles on tokens with **logical corners** (`rounded-ee/es`); avatars circular post-radius-fix; sender alignment RTL-correct.
- [ ] T45.2 Composer: labeled textarea (`aria-label` + visible label), Enter-to-send (Shift+Enter newline), 44px send, disabled while sending.
- [ ] T45.3 Auto-scroll: stick-to-bottom on new messages unless scrolled up; "new messages ↓" affordance.
- [ ] T45.4 Error styling → danger InlineFeedback; polling guards untouched.
- [ ] T45.5 Custom selects → Select component (T1.4) or tokenized ClientPortalSelect pattern.
- [ ] T45.6 List: shared pagination + clear-filters; thread status badges on tokens.

## Verify

- [ ] Reply + poll behavior unchanged (e2e if exists, else manual two-browser test); RTL bubble tails correct.
- [ ] Screenshots 375/1440 × themes.
