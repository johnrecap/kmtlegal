# 15 — Public Articles / Insights (list + detail)

> Phase 2 · Depends on `00`, `01`, `10`.

## Routes

| Locale | URLs | Source |
|---|---|---|
| EN | `/articles`, `/articles/[slug]` | → `ArticlesPageView`, `ArticleDetailPageView` |
| AR | `/ar/articles`, `/ar/articles/[slug]` | catch-all → same views (DB-backed) |

## Components

PageHero, DirectoryFilter (read-time meta), detail: category/date badges + body + disclaimer + DetailCta.

## Issues (audit)

- [P0] Category badge renders white pill (`public-pages.tsx:532`).
- [P1] No `<h1>` on detail (`public-pages.tsx:528`).
- [P2] Entire article body rendered as one `<p>` — no paragraphs/headings/rich text (`public-pages.tsx:535`).
- [P2] No author, no related articles, no share.
- [P3] Nav label "Insights" vs page title "Practical Legal Reading" mismatch (`public-content.en.ts:204` vs `:338`).

## Tasks

- [ ] T15.1 Rich-text body: split on double-newline into paragraphs; support `## ` heading → `h2`, `- ` → list (minimal renderer, no new dependency); reading width `max-w-[65ch]`, prose spacing tokens.
- [ ] T15.2 Detail: `<h1>` title; breadcrumbs (Insights › category); author byline (from DB or office default), published `<time>`, estimated read time; related articles (same category, 2–3 cards).
- [ ] T15.3 Reading experience: scroll progress hairline (gold, token motion; reduced-motion: hidden), text tokens verified for AA in light mode (long-form reading prefers light defaults — respect theme choice).
- [ ] T15.4 List: card grid on radius ramp; badges fixed; nav/page title aligned ("Insights").
- [ ] T15.5 Verify AR: rich-text renderer direction-safe (lists, headings), read-time meta, related cards.

## Verify

- [ ] Long article renders with paragraphs/headings in both locales; no unstyled HTML.
- [ ] Screenshots 375/1440 × EN/AR × themes.
