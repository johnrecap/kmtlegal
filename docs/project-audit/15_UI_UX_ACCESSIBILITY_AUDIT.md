# 15 — UI/UX & Accessibility Audit (shipped system)

Covers the post-redesign system (public luxury theme + client portal +
admin). Phase 13 evidence: 19 views, 0 overflow, CLS ~0.0001, zero console
errors, keyboard/drawer/dialog/sheet/accordion/RTL/theme/motion verified.

## Public — WORKING (HIGH)

- Consistency: locked kit (Resizable Navbar, Menu, Sheet/Tooltip, shimmer
  CTA, ripple links), gold-on-dark language, Parallax hero, timeline
  process, glass pills. No imitation components (Blocker #1 closure
  verified file-identical).
- Hierarchy: hero → practices → process → team → CTA → footer; clear
  single conversion path.
- Responsive: EN-1440 + AR-390 verified; mobile drawer from correct RTL
  side; touch targets adequate on nav/CTA/dock.
- Dark/light: both verified; brand logo has theme surfaces.
- RTL: true mirror (sheet side flips, drawer, timeline); Arabic copy in
  content files (parity not line-audited — P4).
- Forms: inline errors, consent gates, success lock-in, focus rings.
- Keyboard: flyout hover+focus opens, Esc closes, focus trap/return in
  sheet, `aria-expanded/current`, `MotionConfig reducedMotion="user"`.
- Gaps: no skip-link found (P3), heading-order not audited (P3), no
  cookie banner, contrast ratios not instrumentally measured (P3).

## Client — PARTIAL (MEDIUM)

- Functional, calmer visual language; tables readable; empty/loading/error
  patterns present via shared components.
- Weaknesses: chat buried in assistant tab (discoverability); route named
  `court-dates` shows all appointments (labeling); no unread badges; no
  notification center client-side; receipt discovery depends on knowing to
  open payments tab.

## Admin — PARTIAL (MEDIUM)

- Dense but consistent: filters, dialogs with confirmations, status pills,
  cursor pagination in feeds, optimistic updates where it matters.
- Bottlenecks: no bulk actions; settings KV opacity; reports without
  export; 5s/30s polling (no live badges); content hub tabbed but no
  delete; calendar list-based (no drag-drop).

## Distinguishing flaw vs taste

Functional flaws recorded: skip-link absence, `court-dates` mislabel, chat
discoverability, settings opacity, missing bulk ops. Everything else
(visual richness, density) is preference, not defect — and the shipped
taste level is high (locked kit, motion discipline, zero console noise).

## Strengths / weaknesses / inconsistencies

- Strengths: locked component governance, RTL correctness, motion
  restraint with reduced-motion support, bilingual 404s, zero-overflow
  discipline.
- Weaknesses: accessibility instrumentation (contrast, headings, skip
  link) not evidenced; client/admin UX trails public polish.
- Inconsistencies: portal route naming (`court-dates`), assistant hosting
  chat, `PUBLISHED` social meaning "internal", finance `moneyStatus`
  vocabulary exists only in admin.
