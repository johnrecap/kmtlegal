# PLAN-00 Governance & Source Of Truth

## Status

Implemented as repository guidance and source-of-truth pointers.

## Canonical Inputs

- Product artifacts: `specs/kmt-legal-platform/`
- PRD: `docs/KMT_LEGAL_PLATFORM_PRD.md`
- Implementation order: `specs/kmt-legal-platform/tasks.md`
- Stitch exports: `stitch_kmt_legal_platform_ui_system/`
- Stitch clone harness: `docs/harness/stitch-clone/team-spec.md`
- Repo operating rules: `AGENTS.md`

## Current Scope

- No production backend is connected.
- No real client data is present.
- Stitch clone work is isolated from product UI.
- MVP integration decisions are documented in the Spec Kit artifacts.

## Verification

- Every implementation task should start from `AGENTS.md`.
- Every Stitch clone task should use `.agents/skills/stitch-clone-orchestrator/SKILL.md`.
- Every protected feature task should map back to the relevant plan artifact before implementation.
