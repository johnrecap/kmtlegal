# Stitch Visual Parity Checklist

Use this checklist for every `/stitch-clone/*` screen.

## Source Integrity

- Source HTML path recorded.
- Source CSS path recorded or marked unavailable.
- Reference screenshot path recorded.
- Asset folder recorded.
- Route name recorded.
- Mobile viewport `390x844` recorded.
- Desktop viewport `1440x900` recorded only when applicable.

## Mechanical Conversion

- `class` converted to `className` only where JSX requires it.
- DOM order preserved.
- Wrapper hierarchy preserved.
- Arbitrary Tailwind classes preserved.
- Inline styles converted mechanically.
- No product components introduced.
- No shadcn/Radix components introduced.
- No backend calls or dynamic data introduced.

## CSS And Assets

- Original CSS imported.
- Clone CSS isolated from product UI.
- Existing icons/assets used when available.
- No placeholder icons when source assets exist.
- Fonts match source or missing font is documented.
- Public/product tokens are not substituted for source values.

## Screenshot Capture

- App rendered at exact route.
- Mobile screenshot captured at `390x844`.
- Desktop screenshot captured at `1440x900` if reference exists.
- Console/runtime errors recorded.
- Screenshot file paths recorded.

## Visual Diff Review

Check and list visible differences for:
- font family, weight, size, line-height
- spacing and padding
- card or container size
- border radius
- shadow
- background color/image/gradient
- icon size and asset
- alignment
- overflow or clipping
- viewport framing

## Fix Discipline

- Every fix maps to a listed visual difference.
- No unrelated cleanup.
- No CSS simplification.
- No hierarchy changes unless required to restore source DOM behavior.
- No design-system translation.

## Acceptance

- Screenshot after fixes is visually close to reference.
- Remaining differences are documented.
- Any blocked item has an exact missing input or command failure.
