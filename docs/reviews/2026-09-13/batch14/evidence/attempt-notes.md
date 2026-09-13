# Batch 14 retained attempt notes

- The first `scripts/run-playwright-with-server.mjs` attempt compiled the application but ended before Playwright printed a final result. Its console transcript was not redirected, so no raw log is claimed.
- An earlier full `npm run test` attempt reported only the known slow-provider timeout in `tests/server/batch5-provider-boundaries.test.ts`; its console transcript was not redirected. The isolated retry later passed 6/6 and the final full suite passed 544 tests.
- Files named `playwright-browser-attempt-*.log` are retained verbatim. They record the corrected port selection, strict-label selectors, and screenshot caret styling. The accepted result is `playwright-browser.log`.
- A later browser retry received `500` because an old development process shared `.next` while the production build rewrote it. That final-log path was replaced by the clean accepted rerun, so the failed transcript is not claimed as a retained file. The verified listener PID was stopped, the derived cache was removed inside the workspace, and the clean rerun passed.
- The first `pg_ctl stop` call could not signal the server inside the sandbox. The authorized escalated retry succeeded; `cleanup-stop.log` contains the accepted shutdown result.
