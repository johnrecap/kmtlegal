# 32 — Portal Cases (list + detail)

> Phase 3 · Depends on `00`, `01`, `30`.

## Routes

`/client/cases`, `/client/cases/[caseId]` — `src/app/(client)/client/cases/page.tsx`, `cases/[caseId]/page.tsx`.

## Components

DataTable (desktop) + DataRecordCard (mobile): case link, file number, status/priority badges, lawyer, next session. Detail: header panel (badges, lawyer, next session, summary), sessions, appointments, documents, payments sections.

## Issues (audit)

- [P1] **No 404 handling on detail** — unknown/foreign `caseId` throws `ApiError(404)` to light global error page (`cases/[caseId]/page.tsx:43`, no group boundary).
- [P1] Badge contrast on dark; ad-hoc inline-style patches (`cases/page.tsx:35,39,58,59`, `cases/[caseId]/page.tsx:61,62` pass `style={{color: kmtTokens.color.muted}}`).
- [P3] `formatBytes` duplicate (`cases/[caseId]/page.tsx:112-120`).

## Tasks

- [ ] T32.1 Detail 404: catch `ApiError` NOT_FOUND → `notFound()` (renders group dark not-found from T30.5); friendly "case not found" copy EN/AR.
- [ ] T32.2 Migrate tables to retokenized DataTable (T1.10) + mobile cards; delete inline-style badge patches; badges readable both themes.
- [ ] T32.3 Detail page: section cards on tokens; status change feedback unchanged; document download links keep `dir` isolation for file names.
- [ ] T32.4 Delete local `formatBytes` → shared lib (T1.12).
- [ ] T32.5 Verify: sessions/appointments/documents/payments sections render all states (data/empty) in both themes.

## Verify

- [ ] Invalid caseId → in-portal not-found (not global error); foreign caseId same.
- [ ] Screenshots 375/1440 × EN/AR × themes.
