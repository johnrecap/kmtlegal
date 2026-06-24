# KMT Legal Platform

## Source Of Truth

- Product planning artifacts live in `specs/kmt-legal-platform/`.
- Implementation sequencing is tracked in `specs/kmt-legal-platform/tasks.md`.
- Implementation progress is tracked in `docs/KMT_LEGAL_IMPLEMENTATION_STATUS.md`.
- Stitch visual clone rules live in `docs/harness/stitch-clone/team-spec.md` and `.agents/skills/stitch-clone-orchestrator/SKILL.md`.
- Stitch exports are read-only source inputs under `stitch_kmt_legal_platform_ui_system/`.

## Implementation Rules

- Keep `/src/app/stitch-clone/*` isolated from product components, backend calls, dynamic data, and `shadcn/ui`.
- For Stitch clone work, preserve exported HTML/CSS/classes/assets mechanically and verify with Playwright screenshots.
- Product UI work starts after Stitch clone isolation is in place.
- Do not commit real secrets or real client data.

## Commands

- Install: `npm install`
- Dev: `npm run dev`
- Build: `npm run build`
- Typecheck: `npm run typecheck`
- Lint: `npm run lint`
- Generate Stitch clone: `npm run stitch:generate`
- Stitch screenshots: `npm run stitch:screenshots`
