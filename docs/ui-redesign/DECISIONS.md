# DECISIONS (Owner-Locked Rulings)

> These rulings are fixed. Implementation phases obey them verbatim.
> Component selection is OWNER-LOCKED; the model never picks substitutes.

## # UI SYSTEM

- READY-MADE COMPONENT FIRST: APPROVED
- COMPONENT SELECTION: OWNER-LOCKED
- MODEL PICKS SUBSTITUTES: NO
- FREE COMPONENTS ONLY: YES
- ALLOWED SOURCES: Aceternity UI, Magic UI, Animate UI, shadcn/ui

## # PUBLIC CONTENT (DEFERRED)

- Insights / Articles: PENDING PHASE 01 AUDIT — OWNER DIRECTION: HIDE PUBLIC / PRESERVE BACKEND
- Case Studies: PENDING PHASE 01 AUDIT — OWNER DIRECTION: HIDE PUBLIC / PRESERVE BACKEND
- Media: PENDING PHASE 01 AUDIT — OWNER DIRECTION: HIDE PUBLIC; deletion safety: VERIFY LATER IN PHASE 12
- Homepage Representative Matters: NOT automatically Case Studies. REMOVE only with proof of direct dependence on public case-study content (Phase 01 task).
- Admin + backend content systems (ArticleForm, CaseStudyForm, content API, database): PRESERVE regardless of public visibility ruling.

## # CONSULTATION ASSISTANT

- Visible stepper: REJECTED
- Permanent progress bar: REJECTED
- Tabs for booking progress: REJECTED
- Timeline / wizard navigation / 01-04 permanent UI: REJECTED
- Conversation = booking flow: APPROVED
- Locked set: Magic UI Animated List + Aceternity Placeholders And Vanish Input + Magic UI Border Beam: APPROVED
- Stages inside chat (language, request type, details, slot, payment, review, confirmation, next steps): APPROVED

## # FLOATING DOCK

- Component: Aceternity Floating Dock — APPROVED
- Actions: Consultation, WhatsApp — exactly two, APPROVED
- Third action (AI / phone / email / custom FAB): REJECTED
- Render scope: public routes only — APPROVED
- Booking-route hiding to protect the composer: APPROVED (keep current behavior)

## # PUBLIC HEADER

- Family: Aceternity Resizable Navbar + Aceternity Navbar Menu + Animate UI Sheet + Animate UI Tooltip — APPROVED, KEEP
- Replacement with another navbar: REJECTED
- Improvement scope (colors, themes, logo scale, active states, scroll behavior, animation conflicts, responsive, RTL, accessibility): APPROVED

## # PUBLIC THEME TOGGLE

- REPLACE WITH: Magic UI Animated Theme Toggler — APPROVED CONDITIONALLY
- Condition: the official Magic implementation directly supports the existing `next-themes` setup (Phase 02 verification task).
- On incompatibility: BLOCKED — OWNER DECISION REQUIRED. No substitute toggle.

## # HOME

- Hero: Aceternity Spotlight New + Magic Text Animate + Animate CountingNumber (KEEP CURRENT) + Magic Border Beam + Magic Highlighter through KMT wrapper — APPROVED
- Extra hero animation (particles, meteors, globe, 3D, canvas reveal, wobble, rainbow): REJECTED
- Trust strip: Magic Marquee — APPROVED
- Legal services: Aceternity Glowing Effect as interactive border layer; custom KMT composition around it: APPROVED
- Services section bans: Magic Card, Card Spotlight, 3D Card, Wobble Card, Bento Grid — REJECTED for this section
- Awareness emphasis: Magic Highlighter through KMT wrapper; generic CSS underline: REJECTED
- Focus area: Aceternity Sticky Scroll Reveal — APPROVED, no substitute scroll-story component
- Process: Aceternity Timeline — APPROVED
- Representative matters: Aceternity Card Hover Effect — APPROVED
- Industries: KEEP CURRENT custom ledger; entrance motion only via Magic Blur Fade — APPROVED
- Team: Aceternity Focus Cards — APPROVED
- General public entrance animation: Magic Blur Fade, only where it adds value; blanket wrapping: REJECTED

## # SERVICES + TEAM

- Services index: REPLACE Magic Card treatment WITH Aceternity Glowing Effect; KEEP filter/search logic — APPROVED
- Service detail desktop: custom KMT editorial dossier — APPROVED
- Service detail mobile secondary sections: Animate UI Accordion — APPROVED
- Team index: REPLACE generic cards WITH Aceternity Focus Cards; KEEP filter logic — APPROVED
- Team detail desktop: custom people-first profile — APPROVED
- Team detail mobile secondary information: Animate UI Accordion — APPROVED

## # CONTACT / POLICY / SETUP / RETURN / RECEIPT / LOGIN / INSTALL

- Contact submit: Aceternity Stateful Button — APPROVED
- Contact mobile branch details: Animate UI Accordion — APPROVED
- Second major WhatsApp card where the global dock already exposes WhatsApp: REJECTED
- Policy reading progress: Magic Scroll Progress — APPROVED
- Policy mobile TOC: Animate UI Accordion — APPROVED
- Policy marketing-style animation: REJECTED
- Account-setup submit: Aceternity Stateful Button — APPROVED
- Account-setup mobile summary: Animate UI Accordion — APPROVED
- Payment-return async action: Aceternity Stateful Button; decorative animation: REJECTED — APPROVED
- Payment receipt: KEEP CURRENT; print readability first — APPROVED
- Login submit: Aceternity Stateful Button — APPROVED
- Install groups: Animate UI Accordion; async actions: Aceternity Stateful Button — APPROVED

## # CLIENT PORTAL

- Desktop navigation: Aceternity Sidebar; custom sidebar substitute: REJECTED — APPROVED
- Mobile navigation: Animate UI Sheet — APPROVED
- Tooltip / icon help: Animate UI Tooltip — APPROVED
- Data tables: KEEP CURRENT DataTable + DataRecordCard; decorative tables: REJECTED — APPROVED
- Mobile filters: Animate UI Sheet — APPROVED
- Pagination: REPLACE hand-built WITH shadcn Pagination — APPROVED
- Case detail desktop: KEEP visible panels; mobile: Animate UI Accordion — APPROVED
- AI assistant: Magic Animated List + Aceternity Placeholders And Vanish Input — APPROVED
- Human team chat: KEEP normal textarea composer; Vanish Input: REJECTED; AI-chat styling: REJECTED; the two chats stay deliberately distinct — APPROVED
- Files upload: Aceternity File Upload — APPROVED
- Payments async action: Aceternity Stateful Button; mobile payment details: Animate UI Accordion — APPROVED
- Profile save: Aceternity Stateful Button; mobile account information: Animate UI Accordion — APPROVED

## # ADMIN

- Visual direction: PRODUCTIVITY FIRST — APPROVED
- Marketing-style effects, decorative glows, unnecessary scroll animation: REJECTED
- Desktop sidebar: Aceternity Sidebar — APPROVED
- Mobile nav: Animate UI Sheet — APPROVED
- Tabs: Animate UI Tabs — APPROVED
- Collapsible sections: Animate UI Accordion — APPROVED
- Confirmation / destructive actions: Animate UI Dialog — APPROVED
- Row actions: Animate UI Menu — APPROVED
- Small overlays / notifications / extra filters: Animate UI Popover — APPROVED
- Icon help: Animate UI Tooltip — APPROVED
- Async buttons: Aceternity Stateful Button — APPROVED
- File upload: Aceternity File Upload — APPROVED
- Pagination: shadcn Pagination — APPROVED
- Dashboard: KEEP structure; MagicCard: REJECTED; CountingNumber for numeric motion + Tooltip for metric explanations: APPROVED; new decorative components: REJECTED
- Tasks kanban: KEEP structure; draggable UI without separate approval: REJECTED
- Message thread: KEEP native predictable chat stream + normal textarea composer; AnimatedList: REJECTED; only subtle transitions — APPROVED
- Reports: KEEP metrics + status bars; CountingNumber + Tooltip: APPROVED; new chart library: REJECTED
- Roles: KEEP role selection structure — APPROVED
- Finance locked section tabs: Invoices, Gateway, Pricing, Attempts, Webhooks — APPROVED
