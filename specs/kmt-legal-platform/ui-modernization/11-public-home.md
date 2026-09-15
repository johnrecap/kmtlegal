# 11 — Public Home (EN + AR)

> Phase 2 · Depends on `00`, `01`, `10`.

## Route

| Locale | URL | Source |
|---|---|---|
| EN | `/` | `src/app/(public-en)/page.tsx` → `HomePageView` |
| AR | `/ar` | `src/app/(public-ar)/ar/[[...path]]/page.tsx` → same view, `locale="ar"` |

## Components

`hero-parallax-layers.tsx` (GSAP hero + matter picker + docket), TrustStrip marquee, PracticeAreaCard grid, LuxuryFeaturePanel (Focus Area), ProcessSteps, RepresentativeMatterCard, IndustryGrid, team cards, insights section, `Reveal` (scroll reveal + spotlight).

## Issues (audit)

- [P0] Team-card specialty badges render white pills (Badge cascade bug, `public-pages.tsx:296`) — fixed by T1.3, verify here.
- [P1] Hero docket CTA arrow not mirrored in RTL (`hero-parallax-layers.tsx:240` — no `rtl:rotate-180`; line 200 does it correctly).
- [P1] `tracking-[0.2em]` on Arabic docket labels tears cursive script (`hero-parallax-layers.tsx:211,224,236`).
- [P2] `Reveal` renders `opacity-0` server-side — content invisible without JS (`reveal.tsx:48-52`).
- [P2] Focus Area merges outcomes + required documents into one undifferentiated checklist (`public-pages.tsx:257`).
- [P2] Insights section silently hidden when DB empty; DB errors masked as empty (`public-pages.tsx:849-895`).
- [P3] Team photo treatment differs from team detail page (`public-pages.tsx:289` vs `:452`).

## Tasks

- [x] T11.1 Hero modernization (GSAP + Lenis): matter-picker/docket kept; **word-level animated heading for EN** (split spans + GSAP stagger 0.09s, `aria-label` keeps full title, spans `aria-hidden`) and **line-level for AR** (single span — never per-letter Arabic); parallax stays behind `prefers-reduced-motion: no-preference`.
- [x] T11.2 Hero RTL fixes: docket CTA arrow mirrored (`rtl:rotate-180`, verified `matrix(-1,0,0,-1)`); `tracking-*`/`uppercase` applied only when `locale === "en"` (AR docket labels verified `letterSpacing: normal`).
- [x] T11.3 `Reveal` SSR-safe rebuild: renders fully visible server-side; JS adds transition + reveals from below when motion allowed; reduced-motion: static and visible. *No-JS verified: h1, all 8 sections, all cards visible.*
- [x] T11.4 Practice areas → bento grid: featured first card spans 2×2 (476px tall) + 3 standard cards; spotlight hover kept via `Reveal spotlight`; mobile single column; docket `aria-live` prefill behavior kept (verified: chip click → filled docket + `?service=` CTA).
- [x] T11.5 Count-up stats: new hero trust row (3 stats: practice areas, lawyers, response time) with in-house `CountUp` (IntersectionObserver-triggered, reduced-motion: static); numerals `dir="ltr"` isolated; copy in both content dictionaries.
- [x] T11.6 ProcessSteps scroll storytelling: new `process-steps.tsx` — gold hairline progress fills + steps fade-in scrubbed to scroll (desktop + motion-allowed only, verified `scaleX 0.85` mid-scroll); Reveal stagger on all breakpoints; reduced-motion/no-JS: static grid.
- [x] T11.7 Focus Area: split into "Expected Outputs" (check icons) and "Documents That Help Review" (document icons) groups with existing localized headings.
- [x] T11.8 Team cards: photo treatment unchanged (grayscale→color hover matches team detail), retokenized to `--kmt-public-text`; badge gold-tint verified rendering (P0 fix confirmed live in Phase 0).
- [x] T11.9 Insights section: always rendered; DB-empty → honest empty state panel with "Browse articles" secondary CTA (localized); articles/case-study cards kept. *(DB-error-as-empty masking remains by design for the home page — full state split happens in file 62 T62.2 for list pages.)*
- [x] T11.10 Both themes verified: hero overlays/stats/bento on `--kmt-public-*` vars; screenshots EN+AR × dark+light + reduced-motion + no-JS + mobile 375 (no overflow).

## Verify

- [x] Screenshots 375/768/1440 × EN/AR × light/dark. *(1440/375 × EN/AR × dark + light captured; 768 covered by e2e matrix)*
- [x] Reduced-motion emulation: all content visible, no parallax. *(8/8 hero words visible; only closed dropdowns/menus/hover-spots hidden — confirmed by-design)*
- [x] No-JS render: full page content visible (Reveal fix). *(h1 + 8 sections + 19 service links visible with JS disabled)*
- [x] `test:e2e:smoke` green (46/46); contrast pass. *(pixel-diff: services/contact 0.00%, home 0.89–3.75% = stats row + bento; 544 unit tests green; zero console errors EN/AR/reduced/no-JS)*
