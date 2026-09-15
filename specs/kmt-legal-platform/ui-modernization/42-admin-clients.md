# 42 — Admin Clients (list + detail)

> Phase 4 · Depends on `00`, `01`, `40`.

## Routes

`/admin/clients`, `/admin/clients/[clientId]` — `src/app/(app-ar)/admin/clients/*` + `src/features/admin/clients/*`.

## Components

FilterBar + DataTable/mobile cards, create form in side rail (with permission fallback), detail: linked entities (cases, consultations, payments) with per-section empty states, archive action.

## Issues (audit)

- [P2] Client archive has no confirm/reason — unlike document delete and case status change (`client-crm-forms.tsx:379-384`).
- [P3] Eyebrow inconsistency: list "لوحة المكتب" vs detail "CRM العملاء" (`clients/page.tsx:168` vs `[clientId]/page.tsx:77`).
- [P3] "تلقائياً" tanween-order drift (`client-crm-forms.tsx:129` vs `ui-copy.ts:542`).

## Tasks

- [ ] T42.1 List: FilterBar/DataTable/mobile cards on tokens; NEW badge = pending tone (convention); pagination via shared component (T1.7) with clear-filters slot.
- [ ] T42.2 Detail: eyebrow unified to "CRM العملاء" for both list and detail; section cards on tokens; 403 handling kept.
- [ ] T42.3 **Archive safeguard**: confirm checkbox + optional reason (matches document-delete pattern); copy in `ui-copy.ts`.
- [ ] T42.4 Create form: Field/Button components, InlineFeedback (T1.5) for pending/success/error; dirty-guard optional.
- [ ] T42.5 Tanween normalization: "تلقائيًا" everywhere (sweep `client-crm-forms.tsx`).
- [ ] T42.6 Phones/IDs keep `dir="ltr"`/`bdi` isolation; both themes verified.

## Verify

- [ ] Archive flow requires confirm (e2e or manual); screenshots 375/1440 × themes.
