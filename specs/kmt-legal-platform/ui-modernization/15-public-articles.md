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

- [x] [P0] Category badge renders white pill (`public-pages.tsx:532`). *(list badges already fixed by the file-12 DirectoryFilter retokenization — re-verified dark `rgb(248,243,234)` + light `rgb(28,24,18)`; detail category badge → `publicGoldChip`, published date → `publicNeutralChip` this file)*
- [x] [P1] No `<h1>` on detail (`public-pages.tsx:528`). *(PublicSection `headingLevel="h1"`)*
- [x] [P2] Entire article body rendered as one `<p>` — no paragraphs/headings/rich text (`public-pages.tsx:535`). *(new `ArticleBody` minimal renderer: double-newline blocks → paragraphs, `## ` → h2, all-`- ` blocks → ul/li with gold markers; plain text only — no HTML is injected; reading width `max-w-[65ch]`)*
- [x] [P2] No author, no related articles, no share. *(author byline from the DB `author` relation with office-default fallback, related same-category cards; share intentionally omitted — no task requires it and it avoids extra client surface)*
- [x] [P3] Nav label "Insights" vs page title "Practical Legal Reading" mismatch (`public-content.en.ts:204` vs `:338`). *(hero/section titles aligned to the nav label: EN "Insights", AR "المقالات")*

## Tasks

- [x] T15.1 Rich-text body: split on double-newline into paragraphs; support `## ` heading → `h2`, `- ` → list (minimal renderer, no new dependency); reading width `max-w-[65ch]`, prose spacing tokens. *(verified: 2 `##` h2s, 4-item ul, ≥3 paragraphs; 65ch cap engages at 1440 — body 656px vs 688px panel content; prose rhythm via `gap-6`/`leading-8` tokens)*
- [x] T15.2 Detail: `<h1>` title; breadcrumbs (Insights › category); author byline (from DB or office default), published `<time>`, estimated read time; related articles (same category, 2–3 cards). *(breadcrumbs follow the established service-detail 3-level pattern: Insights › category › title, `aria-current` on the title, BreadcrumbList JSON-LD; byline "By {author}" from `article.author.name` with `defaultAuthor` fallback; `<time datetime="2026-06-01">` formatted per locale; read time kept as the section eyebrow kicker; related = same-category cards excluding the current article, hidden when empty)*
- [x] T15.3 Reading experience: scroll progress hairline (gold, token motion; reduced-motion: hidden), text tokens verified for AA in light mode (long-form reading prefers light defaults — respect theme choice). *(new `ReadingProgress` client component: fixed 2px top hairline, `--kmt-public-gold`, `scaleX` with `duration-kmt-normal ease-kmt-out`, `rtl:origin-right`, rAF-throttled scroll, `motion-reduce:hidden` — verified scaleX(0)→~scaleX(1) on scroll, hidden under reduced motion, grows from the right edge in AR; light-mode body text AA verified ≥ 4.5:1 against the composited panel background)*
- [x] T15.4 List: card grid on radius ramp; badges fixed; nav/page title aligned ("Insights"). *(cards on the file-12 DirectoryFilter token ramp; gold category chip + read-time meta (`3 min read` / `٣ دقائق`, bdi) verified; hero/section titles aligned to nav labels)*
- [x] T15.5 Verify AR: rich-text renderer direction-safe (lists, headings), read-time meta, related cards. *(AR detail: `dir=rtl`, AR `##` headings "المسؤولية والجزاءات"/"ما تجهزه للمراجعة", 4-item list with computed `direction: rtl`, localized date "١ يونيو ٢٠٢٦", byline "بقلم …", read-time eyebrow "1 دقائق", 2 AR related cards, progress origin at the right edge)*

Additional changes:
- `content-service.ts`: `articleDto` now exposes `author` (name via `author: { select: { name: true } }` on the list + detail queries) with `null` fallback consumed by the page.
- Amber disclaimer → `kmt-warning` state tokens; back button retokenized to public tokens (mirrors case-study detail).
- New unit tests `tests/ui/public-articles.test.tsx` (3 tests) mocking the content service.
- Scratch-DB verification methodology as in file 14 (Postgres 5433 + gitignored `.env.local`), plus a new teardown lesson: Next's persisted disk data cache (`.next/cache`) served stale scratch-DB article data after `.env.local` removal — `.next/cache` must be deleted (and the dev server restarted) when tearing down a scratch DB before running the no-DB smoke suite.

## Verify

- [x] Long article renders with paragraphs/headings in both locales; no unstyled HTML. *(renderer is plain-text → React elements; body never uses `dangerouslySetInnerHTML`; verified EN + AR in-browser and in unit tests)*
- [x] Screenshots 375/1440 × EN/AR × themes. *(12 full-page shots with DB-backed content: articles + article detail, EN/AR dark + EN light; zero horizontal overflow; plus 55/55 browser probes, 561 unit tests, 46/46 smoke e2e, pixel-diff home 0.76–2.37% / services 0.44–0.68% / contact ≤0.27%)*
