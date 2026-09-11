# Batch 3: document HTTP boundaries and disposable restore

Baseline: `ea186fdb2e0a3b46572879bdb1683bd0098a153e` (pushed after supervisor approval).
Date: 2026-09-11. Status: HTTP/restore verification and cleanup passed; final guarded build passed (exit 0, 44 static pages). Local review required before this batch is pushed.

## Confirmed repair

An actual browser visit to `/client/files` submitted the initial upload form using default GET,
producing `/client/files?caseId=&category=OTHER&file=browser-fixture.pdf`; no upload API request
was made and the browser test timed out. The filename entered the URL, not the document bytes.
The client upload form now declares POST and uses the existing useHydrated hook to disable the
file, selections and submit until handlers are attached. The connected admin upload form had
the same initially rendered form structure; it receives the same focused protection. Existing
copy, styling, file policy, ownership and permission behavior are preserved. No new UI library.

## Connected source map

| Layer | Source | Contract / evidence |
|---|---|---|
| Client upload | src/features/portal/document-upload-form.tsx | FormData POST to existing files endpoint, CLIENT_VISIBLE set by client; error codes mapped through client-content |
| Admin upload | src/features/admin/task-documents/task-document-forms.tsx | Existing document.manage.any UI gate; case, owner, category, visibility passed as multipart fields |
| Entry/session | src/app/api/files/upload/route.ts; src/server/auth/session-store.ts | Real session required; rate limit and content-length gate before multipart parsing |
| Upload service | src/server/storage/document-service.ts | Permission, extension/MIME/magic/size, scan, target match, private write, DB record; failed DB write removes file best-effort |
| Storage | src/server/storage/vps-storage.ts | Configured private root, traversal checks, exclusive file creation |
| Download | src/app/api/files/[documentId]/download/route.ts; document-service.ts | Session then ownership/assignment/permission before reading bytes; attachment/nosniff headers |
| Scan | src/server/storage/malware-scan.ts | Required mode returns 503 on unavailable scanner; local disabled mode explicitly skips scanning |
| Backup | deploy/install/aapanel-pm2-update.sh; postgres-backup-tools.sh | Production update takes custom DB dump and checks archive readability; local drill below additionally restores DB and separately copies files |

## Permission evidence

`PERMISSIONS.md` and `permission-matrix.json` derive all 19 office route entries across three
tool groups from `src/lib/admin-route-policy.ts` and `src/server/auth/policy-data.json`.
The table is default-policy source evidence, not a full mutation-API audit. Persisted role
permissions are used by real sessions; Super Admin has its existing permission override and
role-management route still requires the exact role. No role or permission was changed.

The HTTP matrix uses real `/api/auth/login` sessions and `/api/files/{id}/download`, not manual
Principal injection. CLIENT_VISIBLE ownership allows the owning client; another client is denied.
STAFF_ONLY and INTERNAL_ONLY are denied to the client. Office Admin may read all tested documents;
Marketing Staff is denied. Lawyer can read assigned documents, including INTERNAL_ONLY, and is
denied documents assigned to a different lawyer. This internal-document behavior is existing
policy, not a newly granted right or a discovered defect.

Upload negatives cover foreign owner, foreign case, owner/case mismatch for an authorized staff
actor, extension mismatch, false PDF magic and >5MB payload. Normal upload success runs with
MALWARE_SCAN_MODE=disabled explicitly in this local lane. It does not prove a file is malware-free.
The separate required-scanner lane targets a confirmed unused loopback port and verifies failure
without writing a document or file. No real ClamAV executable was found on PATH or in the checked
Program Files location; real signature detection and production scanner integration are unverified.

## Disposable database and restore

New PostgreSQL 18.6 cluster: `_workspace/batch3-postgres/data` in this worktree, loopback port
55437, source database kmt_batch3 and separate restore database kmt_batch3_restore. Port was checked
unused before initialization. The existing PostgreSQL binaries were reused; no system service
was installed. The original D: checkout and port 5432 were not used. All data/passwords are fixtures.
17 migrations and seed passed. Test setup rejects other DB names, host/port, APP_ENV, upload paths
and SQL data_directory before writes.

The restore runner `scripts/batch3-disposable-restore.mjs` refuses an existing restore DB and
checks both SQL targets and resolved private paths. With the app stopped, it uses pg_dump custom
format, pg_restore --list, and pg_restore --exit-on-error into the separate database; it compares
counts and sorted-row SHA-256 for every public table. Private files are copied separately into a
backup directory and restored to a new directory, with each SHA-256 compared. This is a local
logical restore/copy drill, not a live production snapshot, aaPanel restore, encrypted/offsite
backup, disaster recovery timing guarantee or retention policy verification.

Restore passed: all 37 public tables had identical row counts and sorted-row hashes; all 39 copied private files had identical SHA-256 after restore. pg_dump/pg_restore 18.6 were used. The test runner stopped its server/process tree; port 3109 refused connections and the restore runner verified zero other source-database clients before dumping. The cluster then stopped successfully, postmaster.pid disappeared and port 55437 returned no response (pg_isready exit 2). The exact verified batch3-postgres root, including source, restore DB, uploads, dump and restored file copies, was removed. See restore-results.json and database-lifecycle.json.

## Test interpretation

Initial fixture construction omitted the required assignedLawyerId; corrected by creating a
second disposable lawyer. Another initial user fixture had default INVITED status and correctly
failed login; corrected to ACTIVE. Those are fixture errors, not application defects. The actual
upload GET failure is separate and confirmed. Final case names, counts and commands will be saved.

## Fourteen-step coverage

| Step | Evidence / remaining work |
|---|---|
| 1 Inventory | Batch 1/2 source preservation; dynamic content crawl remains. |
| 2 Data protection | Batch 2 sessions/service isolation; this batch adds document HTTP boundaries, upload checks, local restore. Full staff mutation matrix, real ClamAV and production backup/restore remain. |
| 3 Booking | Winter/DST and free-service races checked in batch 2. First-500-slot and impossible-date hypotheses await the next booking batch; no changes here. |
| 4 Assistant | Recovery only; understanding, ambiguity and AI failures remain. |
| 5 Payments | Provider sandbox and reconciliation/races remain. |
| 6 Office operations | Source entry matrix and selected file/auth HTTP evidence; all operational domains remain to audit fully. |
| 7 Content | Copy review not started; facts and existing translations preserved. |
| 8 Design checkpoint | Interactive home/service/booking/client/admin prototypes in light/dark remain for user review. |
| 9 Shared UI | No visual migration started; existing hydration helper reused. |
| 10 Booking rollout | Await approved design and full journey checks. |
| 11 Public pages | All retained; redesign pending. |
| 12 Client/admin | Credential and upload submission safety repaired; remaining tools and theme behavior pending. |
| 13 Tailwind removal | Not started; no new libraries or archive mixing. |
| 14 Release | Batch-local evidence only; whole-product sign-off, provider and deployment gates remain. |

## Final verification evidence

- 18 unique browser/HTTP cases passed: 12 download combinations, upload negative matrix, two
  browser uploads, both unhydrated form surfaces, API JSON contract, and required-scanner outage.
- Execution counts: normal lane 16 passed / 1 intentional outage skip; strengthened upload lane
  3 passed (two repeated browser cases plus JSON contract); separate outage lane 1 passed.
- Browser uploads use a unique name per run/actor, assert zero rows before and exactly one after
  POST/201, and verify client, case, visibility, filesystem bytes and authorized HTTP 200 bytes.
- Failed uploads leave both document counts and the recursive file inventory unchanged.
- 35 focused storage, malware, admin document/route and backup-tool tests passed; no skipped tests.
- Typecheck, lint, source-preservation comparison and secret scan passed. Final guarded build passed (exit 0, 44 static pages).
- Original successful reports: browser-results.json, upload-contract-results.json,
  scanner-results.json and unit-results.json. Sanitized commands/counts are in verification.json.
- Browser response.json hung after refresh in an intermediate run. This is recorded as a harness
  observation, not a confirmed application response defect. Independent APIRequestContext JSON
  parsing passed with data.id and expected metadata; browser persistence/download checks passed.

No policy, price, booking behavior, library or schema change is included. Production ClamAV,
production backup/restore, every mutation endpoint and whole-product release readiness remain open.
