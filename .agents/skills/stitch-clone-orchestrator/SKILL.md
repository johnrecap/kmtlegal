---
name: stitch-clone-orchestrator
description: Orchestrate strict Stitch exported HTML/CSS/assets into isolated Next.js visual clone routes with Playwright screenshot parity and documented diff/fix loops.
---

# Stitch Clone Orchestrator

## When To Use

Use this skill for any KMT Legal Stitch clone work under `/src/app/stitch-clone/[screen-name]/page.tsx`.

Use it when the task mentions:
- Stitch exported HTML/CSS/assets
- reference screenshots
- raw visual clone routes
- visual parity
- preserving classes, CSS, typography, spacing, shadows, radius, colors, layout, or hierarchy

Do not use this skill for product UI, design-system implementation, dynamic frontend features, backend integration, or shadcn/Radix component work.

## Hard Rules

- Do not redesign.
- Do not improve.
- Do not use `shadcn/ui`.
- Do not reuse existing app components.
- Do not translate the design into the product design system.
- Do not change spacing, radius, shadows, colors, typography, layout, or hierarchy unless a screenshot diff proves it is needed.
- Do not simplify CSS.
- Do not replace arbitrary Tailwind classes.
- Do not use placeholder icons if assets exist.
- Do not connect backend.
- Do not make the clone dynamic.

## Required Inputs

For every screen:
- Stitch source folder or exported `code.html`
- exported CSS if available
- assets used by the HTML/CSS
- reference screenshot
- target route name
- target viewport: mobile `390x844`; desktop `1440x900` only when a desktop reference exists

If a required input is missing, document it in the source inventory and block only that screen, not the whole clone batch.

## Workflow

1. Create source inventory.
   - Record HTML path, CSS path, asset paths, screenshot paths, fonts/icons, source viewport, and target route.
   - Output: `_workspace/stitch-clone/{screen-name}/00_source-inventory.md`.

2. Convert mechanically.
   - Convert Stitch HTML to JSX with minimal mechanical changes only: `class` to `className`, inline style object conversion where needed, valid JSX attribute names, and asset import/path fixes.
   - Preserve original classes and DOM hierarchy.
   - Output route: `/src/app/stitch-clone/[screen-name]/page.tsx`.
   - Output log: `_workspace/stitch-clone/{screen-name}/01_conversion-log.md`.

3. Preserve CSS/assets.
   - Import original CSS.
   - Keep clone-only CSS separate from product CSS.
   - Keep assets in clone-only paths or stable public asset paths.
   - Output: `_workspace/stitch-clone/{screen-name}/02_css-assets-log.md`.

4. Capture screenshots.
   - Run the route in the exact reference viewport.
   - Capture mobile `390x844`.
   - Capture desktop `1440x900` only when a desktop reference exists.
   - Output: `_workspace/stitch-clone/{screen-name}/03_playwright-screenshots.md`.

5. Review visual differences.
   - Compare implementation screenshots to references.
   - List only visible differences in font, spacing, card size, border radius, shadow, background, icon size, alignment, and overflow.
   - Output: `_workspace/stitch-clone/{screen-name}/04_visual-diff-report.md`.

6. Fix only documented differences.
   - Make the smallest targeted CSS/JSX/asset-path changes needed.
   - Do not introduce product components or dynamic behavior.
   - Output: `_workspace/stitch-clone/{screen-name}/05_fix-log.md`.

7. Repeat screenshot comparison.
   - Re-run Playwright after fixes.
   - Output final status: `_workspace/stitch-clone/{screen-name}/06_acceptance.md`.

## Done Definition

A screen is done only when:
- route exists under `/src/app/stitch-clone/[screen-name]/page.tsx`
- original CSS is imported or explicitly documented as unavailable
- classes and DOM hierarchy are preserved
- assets/icons/fonts are real, not placeholders
- no product components, shadcn/ui, backend calls, or dynamic data are used
- Playwright screenshots exist for required viewports
- visible differences are listed
- fixes are limited to listed differences
- final acceptance says the implementation screenshot is visually close to the Stitch screenshot

## Failure Policy

- Missing source asset: block the screen and record the exact missing path.
- Missing reference screenshot: conversion may proceed, but visual parity cannot pass.
- Build failure: fix only JSX/CSS import/runtime issues needed to render the clone.
- Large visual mismatch: do not redesign; inspect whether CSS, font, asset, viewport, or DOM hierarchy was not preserved.

## Reference

Read `references/parity-checklist.md` before reviewing or accepting any screen.
