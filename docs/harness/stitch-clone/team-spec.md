# Stitch Clone Harness Team Spec

## Goal

Preserve Stitch exported screens exactly as raw visual clone routes before any product UI or backend work starts.

The harness exists because Stitch clone work fails when agents treat the reference as inspiration. For this project, Stitch is the visual source of truth. Product design-system work starts only after clone parity is accepted.

## Architecture Pattern

Pattern: Pipeline + Producer-Reviewer.

Reason:
- Pipeline fits because source inventory -> mechanical conversion -> screenshot -> diff -> targeted fix -> acceptance are sequential.
- Producer-Reviewer fits because the conversion output must be reviewed against screenshots before fixes are allowed.
- Fan-out is allowed only across independent screens after the source inventory format is stable.

## Roles

### Stitch Clone Orchestrator

Owns phase order, route naming, handoff files, and done/blocked status.

Inputs:
- source inventory
- plan/task references
- target screen name

Outputs:
- `_workspace/stitch-clone/{screen-name}/06_acceptance.md`

### Source Inventory Agent

Finds and records source files without editing implementation.

Outputs:
- `_workspace/stitch-clone/{screen-name}/00_source-inventory.md`

Required fields:
- source HTML
- source CSS
- reference screenshot
- assets
- fonts/icons
- route name
- target viewports

### Mechanical Converter

Converts HTML to JSX mechanically.

Outputs:
- `/src/app/stitch-clone/[screen-name]/page.tsx`
- `_workspace/stitch-clone/{screen-name}/01_conversion-log.md`

Forbidden:
- redesign
- component reuse
- dynamic data
- backend calls
- class replacement

### CSS/Assets Preserver

Ensures CSS, fonts, icons, and image assets match the Stitch export.

Outputs:
- clone-only CSS import or documented CSS absence
- stable clone asset paths
- `_workspace/stitch-clone/{screen-name}/02_css-assets-log.md`

### Playwright Visual QA

Runs the rendered page at exact reference viewports.

Outputs:
- mobile screenshot at `390x844`
- desktop screenshot at `1440x900` when reference exists
- `_workspace/stitch-clone/{screen-name}/03_playwright-screenshots.md`

### Parity Reviewer

Compares screenshots to references and lists visible differences only.

Outputs:
- `_workspace/stitch-clone/{screen-name}/04_visual-diff-report.md`

Review categories:
- font
- spacing
- card size
- border radius
- shadow
- background
- icon size
- alignment
- overflow

### Targeted Fix Agent

Fixes only differences documented by the Parity Reviewer.

Outputs:
- implementation patch
- `_workspace/stitch-clone/{screen-name}/05_fix-log.md`

## Handoff Contract

Each screen uses this folder:

```text
_workspace/stitch-clone/{screen-name}/
  00_source-inventory.md
  01_conversion-log.md
  02_css-assets-log.md
  03_playwright-screenshots.md
  04_visual-diff-report.md
  05_fix-log.md
  06_acceptance.md
```

## Failure Policy

- Missing source HTML blocks conversion for that screen.
- Missing CSS allows conversion only if CSS absence is documented.
- Missing reference screenshot blocks parity acceptance.
- Missing asset blocks acceptance if visible in the reference.
- Build/runtime errors must be fixed before screenshot comparison.
- A broad mismatch triggers source/CSS/asset/viewport investigation, not redesign.

## Acceptance Gate

`PLAN-02` is complete only when every required Stitch screen has:
- raw route under `/src/app/stitch-clone/[screen-name]/page.tsx`
- original classes and CSS preserved
- no shadcn/ui
- no product components
- no backend/data connection
- Playwright screenshot evidence
- visual diff report
- targeted fix log
- final acceptance file

## Plan Split

- `PLAN-02A` Stitch Source Inventory & Asset Freeze
- `PLAN-02B` Raw JSX Mechanical Conversion
- `PLAN-02C` CSS/Font/Icon/Asset Preservation
- `PLAN-02D` Playwright Screenshot Capture
- `PLAN-02E` Visual Difference Review
- `PLAN-02F` Targeted Parity Fix Loop
- `PLAN-02G` Final Acceptance Report

## Integration With Main Plans

- `PLAN-02` depends on `PLAN-01`.
- `PLAN-03` may read Stitch visual direction after `PLAN-02`, but must not reuse clone code or mutate clone routes.
- Backend, auth, database, and dynamic product slices must not enter `/stitch-clone/*`.
