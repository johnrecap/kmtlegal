# 02 — Public Site Audit

## Route verdicts

| Route | File | Status | Confidence | Notes |
|---|---|---|---|---|
| `/` Home | `src/app/(public-en)/page.tsx` → `public-pages.tsx:HomePageView` | WORKING | HIGH | Phase 13 EN+AR 200, visuals clean |
| `/services` | `(public-en)/services/page.tsx` | WORKING | HIGH | DB-driven `LegalService` list |
| `/services/[slug]` | `(public-en)/services/[slug]/page.tsx` | WORKING | HIGH | Unknown slug → `notFound()` |
| `/team` | `(public-en)/team/page.tsx` | WORKING | HIGH | `LawyerProfile isPublic` list |
| `/team/[slug]` | `(public-en)/team/[slug]/page.tsx` | WORKING | HIGH | Booking CTA `?lawyer=` link |
| `/contact` | `(public-en)/contact/page.tsx` + `contact-form.tsx` | WORKING | MEDIUM | POST → `ContactMessage NEW`, ref `MSG-<8>`; DB write not live-proven |
| `/book-consultation` | `(public-en)/book-consultation/page.tsx` → booking chat | PARTIAL | MEDIUM | Intake works; payment needs provider env |
| `/client-account/setup` | `(public-en)/client-account/setup/page.tsx` | PARTIAL | MEDIUM | HMAC token flow coded; needs SCHEDULED record |
| `/privacy`, `/terms` | static pages | WORKING | HIGH | — |
| `/ar/*` mirror | `(public-ar)/ar/[[...path]]/page.tsx`, `revalidate=900` | WORKING | HIGH | Static params limited to known paths |
| `/login` | `(login)/login/page.tsx` | WORKING | HIGH | `?next=&locale=` sanitized |
| `/install` | `(install-ar)/install/page.tsx` | WORKING | MEDIUM | `notFound` when disabled |
| `/payment/consultation/return` | `(public-ar)/payment/.../return/page.tsx` | WORKING | MEDIUM | Token-gated + poller; live PAID needs env |
| `/payment/consultation/receipt` | `.../receipt/page.tsx` | WORKING | MEDIUM | PAID-only, reversals excluded |
| `/sitemap.xml` | `src/app/sitemap.ts` | WORKING | HIGH | Static EN+AR; DB paths return `[]` by design |
| `/preview/ui`, `/preview/components` | `src/app/preview/*` | DISABLED | HIGH | `notFound` in prod unless flag |

## Hidden-content verification (code authority)

- Articles / Case Studies: **PUBLIC HIDDEN** (HIGH). No EN route files;
  AR `generateStaticParams` excludes them; `renderPublicPath()` /
  `metadataForPublicPath()` have no arms → `notFound()`; nav (`navForPath`,
  header insight logic yields empty), footer, sitemap, metadata call sites
  all removed. Admin CRUD + detail views still exported (admin-only).
- Media: **DELETED / unavailable** (HIGH). No model, no API, was static
  `mediaItems` only; retired-route specs assert branded 404.
- Conflict: public JSON APIs `GET /api/public/articles(+/[slug])`,
  `/api/public/case-studies(+/[slug])` still serve `PUBLISHED` rows
  (`content-service.ts`, `status=PUBLISHED + publishedAt!=null`,
  studies require `isAnonymized`). Hidden pages but fetchable data if slug
  known → recorded as P1 leak in file 20.

## Navigation / footer / CTA

- Header: locked system (Resizable Navbar + Menu + Sheet/Tooltip),
  `Home/Services/Team/Contact` only, gold active indicator, Services flyout
  (4 practice links + View All + booking CTA), theme toggle, language
  switch, login link, consultation CTA. Verified EN-dark-1440 +
  AR-light-390 in Phase 13.
- Footer (`public-shell.tsx:70-187`): booking CTA, practice links, offices,
  contact, privacy/terms bar. No hidden-content links.
- Floating dock: exactly booking + WhatsApp (`NEXT_PUBLIC_KMT_WHATSAPP_URL`
  else `/contact` fallback); suppressed on booking page.
- Booking entries: header CTA, flyout CTA, footer CTA, hero, team-detail
  `?lawyer=`, floating dock. No dead entry points found.

## Forms / theme / locale / mobile / links / SEO

- Contact form: zod client+server, `consent literal(true)`, rate-limited
  (`contact 5/10m`), locks after success, returns reference.
- Booking chat: language choice → intent → matter chips → free text (≥20
  chars, anti-generic) → slots → confirm/pay; legal-advice refusal branch.
- Theme: `next-themes` dark default, `ThemeToggle`, light verified.
- Locale: EN LTR + AR RTL layouts, `ar|en` preference persisted for
  clients; no locale prefix beyond `/ar`.
- Mobile: AR-390 sheet verified (`data-side="right"`, overflow 0).
- External: WhatsApp deep-link only (no WhatsApp API/SDK in repo).
- SEO: per-page metadata + canonical/hreflang; article/case-study metadata
  helpers defined but uncalled; sitemap leaks nothing hidden.

## Strengths

- Locked header kit, clean nav/footer/CTA graph, honest 404s, RTL + themes
  actually verified, no decorative dead links.

## Weaknesses / gaps

- No service search, no FAQ, no testimonials section, no Arabic/English
  content parity check in code, no cookie consent, no offline handling.
- Contact has no file attachment; booking has no guest reschedule/cancel.
- Hidden-but-fetchable article/case-study APIs (P1).

## Conversion problems

- Single conversion path (booking chat) — no phone-number CTA, no callback
  request, no pricing display before checkout (price appears at review
  step only).
