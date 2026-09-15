# 36 — Portal Assistant (+ team chat)

> Phase 3 · Depends on `00`, `01`, `30`.

## Route

`/client/assistant` — `src/app/(client)/client/assistant/page.tsx` + `src/features/client/client-assistant-panel.tsx`, `client-team-chat-panel.tsx`.

## Components

Assistant chat (role=log, quick-action chips, structured data cards in replies, typing indicator, error bubbles, "talk to the team" escape hatch), team chat (polling with mutation-version guards, composer, privacy note).

## Issues (audit)

- [P1] **Error bubbles visually identical to normal replies** — `border-red-300/35 bg-red-950/45 text-red-100` overridden by base `border-white/10 bg-white/[0.05] text-slate-100` via `cn` order bug (`client-assistant-panel.tsx:275-281`).
- [P1] Quick-action chip gold styling dead — same `!important` conflict (`client-assistant-panel.tsx:200,212`; team chat `client-team-chat-panel.tsx:246`).
- [P3] No Enter-to-send; no history persistence (state-only); no request abort/timeout; team-chat typing dots unlabeled (`client-team-chat-panel.tsx:328-337`); no scroll-to-bottom affordance.
- [P3] Intent router single-topic (backend, optional).

## Tasks

- [ ] T36.1 Rebuild bubbles on tokens: user = primary surface, assistant = surface, error = danger state tokens + icon (visible both themes after `cn` fix).
- [ ] T36.2 Quick-action chips: proper gold-pill treatment (T1.x pattern) in both themes; 44px targets kept.
- [ ] T36.3 Composer: Enter-to-send (Shift+Enter newline), `enterkeyhint="send"`, 44px send button, disabled while pending; abort in-flight request on navigation (AbortController).
- [ ] T36.4 Typing indicators: labeled in both panels (`aria-label` "جارٍ الكتابة…" / "Typing…"); staggered dots with reduced-motion: static.
- [ ] T36.5 Auto-scroll behavior: stick-to-bottom unless user scrolled up; "new messages ↓" affordance (token motion).
- [ ] T36.6 Structured data cards (appointments/sessions/cases/documents/payments) on Card tokens with Badge statuses; `bdi` isolation for numbers/IDs.
- [ ] T36.7 Assistant history: persist per-session in `sessionStorage` (capped, SSR-safe), restore on remount; explicit "clear conversation" action. No backend change.
- [ ] T36.8 Team chat: keep polling/version guards untouched; restyle only; thread subject localized.

## Verify

- [ ] e2e/manual: quick actions return correct data cards; error path (API down) shows distinct danger bubble; Enter sends, Shift+Enter newlines.
- [ ] Screenshots 375/1440 × EN/AR × themes; reduced-motion: static indicators.
