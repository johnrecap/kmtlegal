# KMT Legal Platform

## Source Of Truth

- Product planning artifacts live in `specs/kmt-legal-platform/`.
- Implementation sequencing is tracked in `specs/kmt-legal-platform/tasks.md`.
- Implementation progress is tracked in `docs/KMT_LEGAL_IMPLEMENTATION_STATUS.md`.
- Historical Stitch visual clone rules live in `docs/harness/stitch-clone/team-spec.md` and `.agents/skills/stitch-clone-orchestrator/SKILL.md`.
- Stitch exports remain read-only offline source inputs under `stitch_kmt_legal_platform_ui_system/`; runtime `/stitch-clone/*` pages are retired.

## Implementation Rules

- Do not recreate runtime `/stitch-clone/*` pages. Keep the archived Stitch export isolated from product components, backend calls, dynamic data, and `shadcn/ui`.
- Preserve only localized Stitch assets that are referenced by current product pages; treat the remaining export as an offline historical input.
- Do not commit real secrets or real client data.

## Commands

- Install: `npm install`
- Dev: `npm run dev`
- Build: `npm run build`
- Typecheck: `npm run typecheck`
- Lint: `npm run lint`
- Refresh archived design assets: `npm run stitch:assets`
- Server commands and push handoff: `docs/SERVER_COMMANDS.md`

## Mandatory Push And Server Handoff Rule

- After every completed repository modification, run the relevant verification, commit the change, and push it to `origin/main` unless the user explicitly says not to push or the change is only an uncommitted review/proposal.
- If verification cannot be run or fails, say that clearly before deciding whether to push.
- After any successful `git push` to `origin/main`, include the matching server pull/deploy commands in the final response.
- Default current deployment target is aaPanel + PM2. Unless a different target is explicitly requested, hand off:
  - `cd /www/wwwroot/kmtlegal`
  - `bash deploy/install/aapanel-pm2-update.sh`
- Do not recommend `npm run dev` for production server operation.
