# 50 — Admin Content Hub (articles / case studies / social)

> Phase 4 · Depends on `00`, `01`, `40`.

## Routes

`/admin/content`, `/admin/content/articles`, `/admin/content/case-studies`, `/admin/content/social` — `src/app/(app-ar)/admin/content/*`.

## Components

Content hub landing, per-type lists (FilterBar + table), editors for articles/case studies, social post composer.

## Issues (audit)

- [P3] Near-copy of case-detail tabs with template-literal classes (`content/page.tsx:333-350`) — replace with Tabs (T1.6).

## Tasks

- [ ] T50.1 Hub tabs → Tabs component; per-type lists on retokenized table + shared pagination.
- [ ] T50.2 Article/case-study editors: Field/Textarea components; locale toggle (AR/EN fields) with direction-aware editing surfaces (`dir` switches with active locale field).
- [ ] T50.3 Publishing states (draft/published/scheduled) on Badge tokens; visibility of "published on public site" kept.
- [ ] T50.4 Social composer: preview card (how it renders publicly) on tokens; character counters.
- [ ] T50.5 Both themes verified; mixed AR/EN content isolation.

## Verify

- [ ] Create → publish → visible on public site round-trip (e2e or manual).
- [ ] Screenshots 375/1440 × themes.
