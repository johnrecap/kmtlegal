---
name: KMT Legal Design System
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#45464d'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#755a26'
  on-secondary: '#ffffff'
  secondary-container: '#fdd898'
  on-secondary-container: '#785d29'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#0d1c2e'
  on-tertiary-container: '#77859a'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#ffdea7'
  secondary-fixed-dim: '#e5c184'
  on-secondary-fixed: '#271900'
  on-secondary-fixed-variant: '#5b4311'
  tertiary-fixed: '#d5e3fc'
  tertiary-fixed-dim: '#b9c7df'
  on-tertiary-fixed: '#0d1c2e'
  on-tertiary-fixed-variant: '#3a485b'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-lg:
    fontFamily: IBM Plex Sans Arabic
    fontSize: 48px
    fontWeight: '600'
    lineHeight: 60px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: IBM Plex Sans Arabic
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-md:
    fontFamily: IBM Plex Sans Arabic
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
  body-lg:
    fontFamily: IBM Plex Sans Arabic
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: IBM Plex Sans Arabic
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-sm:
    fontFamily: inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  container-max: 1200px
  gutter: 1.5rem
  margin-desktop: 2.5rem
  margin-mobile: 1rem
  stack-sm: 0.5rem
  stack-md: 1rem
  stack-lg: 2rem
---

## Brand & Style

The design system is engineered for a high-end legal environment where precision, security, and authority are paramount. The aesthetic is **Corporate Modern**, blending the steadfast reliability of traditional legal practice with the efficiency of modern technology. 

The personality is calculated and calm. It avoids the aggressive visual noise of consumer apps in favor of a "quiet luxury" approach: generous white space, refined typography, and a deliberate lack of decorative clutter. The UI communicates that the user’s data is secure and their cases are being handled with the utmost professionalism.

For the international nature of high-end law, the system is built with a global-first mindset, ensuring the interface feels native whether rendered in Arabic (RTL) or English (LTR).

## Colors

The palette is anchored by **Midnight Navy (#0F172A)**, providing a deep, authoritative foundation for headers and navigation. This is contrasted against a clean **Paper White** surface to ensure maximum legibility for dense legal documents.

- **Primary (Midnight Navy):** Used for global navigation, hero sections, and primary branding elements.
- **Accent (Deep Gold):** A refined **#997B44** is used sparingly for primary call-to-actions and active states to denote premium quality.
- **Neutral Surface:** A series of cool grays (from #F8FAFC to #64748B) are used for table headers, borders, and secondary metadata.
- **Status Semantic:**
    - *Success:* Sage Green (#166534) - calm and organic.
    - *Warning:* Ochre (#92400E) - professional, not alarming.
    - *Error:* Garnet (#991B1B) - authoritative and serious.

## Typography

This design system utilizes a dual-font strategy to maintain international standards. **IBM Plex Sans Arabic** is the primary typeface, chosen for its technical precision and exceptional legibility in professional Arabic contexts. For Latin characters and numerical data within tables, **Inter** provides a systematic, neutral counterpoint.

- **Hierarchy:** Large display titles are reserved for dashboard overviews. Case files and legal documents utilize `body-md` for high density without sacrificing readability.
- **RTL Considerations:** Line heights are slightly increased for Arabic text (approx 1.5x - 1.6x) to accommodate character flourishes and diacritics without clipping.
- **Numerical Data:** Always use tabular figures for financial summaries and case numbers to ensure alignment in lists.

## Layout & Spacing

The layout follows a **Fixed-Fluid hybrid grid**. On desktop, the content is centered within a 1200px container to prevent line lengths from becoming unreadable in legal briefs. 

- **The 12-Column Grid:** Enables complex dashboard layouts. Typical distributions include a 3-column sidebar with a 9-column main view, or 4-column "metric cards" for case statistics.
- **RTL Mirroring:** The entire grid logic mirrors horizontally for Arabic. The sidebar moves to the right, and the primary reading gravity shifts to the right margin.
- **Rhythm:** A base-8 scale is used for all padding and margins. Generous `stack-lg` (32px) spacing between sections creates the "premium" airy feel requested.

## Elevation & Depth

To maintain a professional and "flat" corporate look, this design system avoids heavy drop shadows. Instead, it uses **Tonal Layering** and **Low-Contrast Outlines**.

- **Level 0 (Base):** #F8FAFC (Light Gray) background.
- **Level 1 (Cards/Content):** Pure White (#FFFFFF) with a thin 1px border (#E2E8F0).
- **Level 2 (Modals/Popovers):** Pure White with a subtle, diffused shadow: `0 10px 15px -3px rgba(15, 23, 42, 0.05)`.

Interactive elements do not "pop" off the screen; they highlight via subtle color shifts or the Gold accent border, maintaining a grounded, secure appearance.

## Shapes

The design system uses a **Soft (0.25rem)** roundedness profile. This specific radius strikes a balance between the rigid "sharp" edges of traditional law firms and the overly friendly "bubbly" curves of consumer startups.

- **Primary Elements:** 4px radius for buttons, input fields, and small badges.
- **Containers:** 8px (rounded-lg) for main content cards and case file folders.
- **Strictness:** No "pill" shapes are used except for status badges, ensuring the UI feels structured and intentional.

## Components

### Buttons & Actions
- **Primary:** Deep Gold background with White text. Used for "Submit Filing," "Sign Document," or "New Case."
- **Secondary:** Transparent background with Midnight Navy border and text.
- **Language Switcher:** A minimalist text-only toggle in the top-right (or top-left for LTR) utility bar, using `label-sm` typography.

### Data Tables & Lists
- **Structure:** Clean, border-bottom only layout. Header row in `neutral-100` background.
- **Case Status Badges:** Small, subtle-colored pills.
    - *Active:* Muted Blue tint.
    - *Pending:* Muted Amber tint.
    - *Closed:* Muted Gray tint.
- **Icons:** Use **Lucide** icons at 20px for primary navigation and 16px for inline actions. Stroke weight set to 1.5px for a refined look.

### Input Fields
- Understated styling: 1px border (#CBD5E1), no heavy shadows on focus. On focus, the border transitions to Midnight Navy with a 2px soft outer glow in the same hue.

### Cards
- Case summary cards utilize a vertical layout: Title at top, metadata (date/case ID) in `tertiary` color, and a footer with a single "View Details" secondary action.