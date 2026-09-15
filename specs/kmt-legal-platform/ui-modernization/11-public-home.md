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

- [ ] T11.1 Hero modernization (GSAP + Lenis): keep matter-picker/docket concept; add word-level AnimatedHeading (React Bits) for EN, **line-level for AR** (never per-letter Arabic); keep parallax behind `prefers-reduced-motion: no-preference` gate (`hero-parallax-layers.tsx:77-106`).
- [ ] T11.2 Hero RTL fixes: mirror docket CTA arrow (line 240); strip `tracking-*`/`uppercase` when `locale === "ar"` (lines 211,224,236).
- [ ] T11.3 `Reveal` SSR-safe rebuild: visible by default, JS enhances (IntersectionObserver adds transition only); reduced-motion: content fully visible, no transform.
- [ ] T11.4 Practice areas → bento grid (asymmetric, 1 featured + 3 standard) with SpotlightCard hover (React Bits); mobile: single column; keep `aria-live` docket prefill behavior.
- [ ] T11.5 Count-up stats (React Bits CountUp) in TrustStrip or hero trust row; reduced-motion: static numbers; RTL: numerals stay LTR (`bdi`/`dir` isolation).
- [ ] T11.6 ProcessSteps scroll storytelling: GSAP ScrollTrigger pin + progress hairline (desktop only), simple stagger reveal on mobile; reduced-motion: static.
- [ ] T11.7 Focus Area: split checklist into "Outcomes" and "Required documents" groups (`public-pages.tsx:257`).
- [ ] T11.8 Team cards: unify photo treatment with team detail (grayscale→color hover both places); badge fix verification.
- [ ] T11.9 Insights section: skeleton + error State (not silent omission); empty state with link to articles.
- [ ] T11.10 Verify both themes: hero overlays, marquee masks, gold accents pass AA in light mode (adjust overlay tokens per theme).

## Verify

- [ ] Screenshots 375/768/1440 × EN/AR × light/dark.
- [ ] Reduced-motion emulation: all content visible, no parallax.
- [ ] No-JS render: full page content visible (Reveal fix).
- [ ] `test:e2e:smoke` green; axe contrast pass.
