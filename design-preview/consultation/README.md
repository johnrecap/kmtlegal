# KMT consultation HTML previews

Owner selected **direction 02 / A natural conversation** for both the chat and booking dialog on 2026-10-15: «التصميمين دول كويسين اعتمدهم». Exact supplied screenshots are retained under `images/owner-selected-*.png`. The other four directions remain comparison proposals. Selection is recorded in the existing [decisions](../../docs/ui-redesign/DECISIONS.md), with the [canonical consultation contract](../../docs/ui-redesign/CONSULTATION_DESIGN.md).

Later authorized integration now lives in the real React components, with a larger viewport-bounded reading log as explicitly requested. This gallery remains the historical comparison lab. `images/production-*.png` and `qa/production-results.json` capture/check the actual current components with the same intercepted sample data; no demo runtime is imported into the application. Production integration/release evidence is maintained in the existing implementation register.

## Open and try

Open [index.html](index.html) directly, or run this from the repository root with Node.js available:

```powershell
node design-preview/consultation/serve.mjs
```

Open http://127.0.0.1:3417/ in a browser. The server binds only to loopback, serves this folder, and accepts GET/HEAD only. It does not expose the repository or call an AI/database. If port 3417 is occupied, stop the existing preview server or set `KMT_PREVIEW_PORT` to another port before launching.

Try [the selected chat](direction-02/index.html?lang=ar&theme=light), [selected booking](direction-02/index.html?lang=en&theme=dark&scene=booking), or directions [01](direction-01/index.html), [03](direction-03/index.html), [04](direction-04/index.html), [05](direction-05/index.html). Each page offers language/theme and scenario controls outside the customer interface. The visual-system details below the conversation show its type, colors and control states.

Send a sample message; open/close booking; select an available/closed date; change time/contact/channel; review/consent/confirm; edit/cancel the sample appointment. The scenario control also exposes waiting, error/retry, empty schedule, success and staff takeover. All actions are in-memory simulations. Refresh clears them. No real appointment or model call is created.

## Shared content and comparison

The five directions share `shared/fixtures.js`, `shared/preview-copy.js`, and the generated read-only snapshot `shared/catalogs.js`. Dates, hours, staff and contacts are synthetic. Friday closure here is a fixture, not a business-hours decision. Local KMT mark and installed IBM Plex Sans Arabic/Inter distributions are copied with font licenses. No new library is installed. [SOURCES.md](SOURCES.md) records exact reference access, adaptations and limits.

Before images come from the actual unchanged local Next application at `dbdc9268b4286fe10c3893f7eab1fb1c09d9b533`, with the same synthetic conversation/availability responses intercepted in the browser. Booking/review images crop its real dialog; chat images crop its real conversation region. No real booking submit or provider call was made. `qa/baseline-results.json` records eight captures. The selected owner images preserve an earlier message scroll position; final local screenshots show the latest messages and a viewport-adaptive log so the booking action is visible.

The gallery switches locale, theme, direction, scene and viewport for side-by-side comparisons. Images link to the full-resolution capture. These controls do not grant approval; the owner's explicit message above does.

## Regenerate and verify

Prepared HTML/assets need no build. To refresh catalog/font snapshots from the existing installed repository dependencies:

```powershell
node design-preview/consultation/prepare.mjs
```

With the preview server running, Node, the repository's installed `@playwright/test`, and Chrome available:

```powershell
node design-preview/consultation/qa/check.mjs --direction=01
node design-preview/consultation/qa/check.mjs
node design-preview/consultation/qa/gallery-check.mjs
```

The first command was run and reviewed before creating directions 02–05. The final matrix is 40 passing cases: five directions × two languages × two themes × 390/1440px, each also checking 360px. It verifies booking/recovery/contact/consent behavior, focus/Escape, overflow/assets, six text-contrast pairs, local send/staff states and reduced motion. Current results: [results.json](qa/results.json). First failed representative attempts are retained; radio-group focus handling and invalid native phone-pattern syntax were repaired before scaling. This is local Chromium evidence, not physical-device/Safari/Firefox or live-model acceptance.

Full application TypeScript/lint/build were not repeated for this HTML-only proposal; no production TS/CSS, API, schema, environment, dependency or provider file changed. Baseline uses the existing compiled app. `git diff --check`, standalone JS syntax, gallery links and current artifact fingerprints are the relevant handoff checks. `qa/manifest.json` records evidence versions; it is not an approval generator.

## Design comparison

| Direction | Audience / task clarity | Brand / readability / density | Later implementation complexity / tradeoff |
| --- | --- | --- | --- |
| 01 Calm office | Service inquiries with clear schedule/contact split | Formal KMT, spacious, low density | Split desktop grid; wider dialog |
| **02 Natural conversation — selected** | Continued conversation, then explicit booking | KMT with soft bubbles, medium density | Stacked dialog and rounded controls; mobile contact fields require scrolling |
| 03 Appointment book | Appointment-focused visitors | Precise KMT rows, higher density | Calendar-led split grid; less conversational warmth |
| 04 Personal welcome | Visitors who prefer office-led welcome | Spacious brand header, low density | Top appointment summary; longer mobile scroll |
| 05 Essentials | Visitors comfortable with compact controls | Type/divider-led KMT, higher density | Fewer containers; typography must carry hierarchy |

These are root design judgments. Direction 01 was initially recommended for balance; the owner's later explicit choice of 02 controls. Production integration is a separate planned change. Do not deploy this lab or copy synthetic data into production.
