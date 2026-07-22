import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";
import containerQueries from "@tailwindcss/container-queries";
import plugin from "tailwindcss/plugin";
import { kmtStateCssVariables, kmtTokens } from "./src/lib/design-system/tokens";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/features/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        kmt: {
          navy: kmtTokens.color.navy,
          gold: kmtTokens.color.gold,
          goldDark: kmtTokens.color.goldDark,
          paper: kmtTokens.color.paper,
          canvas: kmtTokens.color.canvas,
          ink: kmtTokens.color.ink,
          muted: kmtTokens.color.muted,
          border: kmtTokens.color.border,
          info: {
            DEFAULT: "var(--kmt-state-info)", surface: "var(--kmt-state-info-surface)", border: "var(--kmt-state-info-border)", strong: "var(--kmt-state-info-strong)"
          },
          success: {
            DEFAULT: "var(--kmt-state-success)", surface: "var(--kmt-state-success-surface)", border: "var(--kmt-state-success-border)", strong: "var(--kmt-state-success-strong)"
          },
          warning: {
            DEFAULT: "var(--kmt-state-warning)", surface: "var(--kmt-state-warning-surface)", border: "var(--kmt-state-warning-border)", strong: "var(--kmt-state-warning-strong)"
          },
          danger: {
            DEFAULT: "var(--kmt-state-danger)", surface: "var(--kmt-state-danger-surface)", border: "var(--kmt-state-danger-border)", strong: "var(--kmt-state-danger-strong)"
          }
        },
        "surface-container": "#eceef0",
        "surface-container-highest": "#e0e3e5",
        "surface-bright": "#f7f9fb",
        "surface-variant": "#e0e3e5",
        secondary: "#755a26",
        "surface-tint": "#565e74",
        "on-secondary": "#ffffff",
        "on-tertiary": "#ffffff",
        "on-secondary-fixed": "#271900",
        "tertiary-fixed-dim": "#b9c7df",
        "on-primary": "#ffffff",
        "inverse-on-surface": "#eff1f3",
        "on-primary-fixed": "#131b2e",
        error: "#ba1a1a",
        "on-secondary-container": "#785d29",
        "secondary-container": "#fdd898",
        "inverse-primary": "#bec6e0",
        "primary-fixed-dim": "#bec6e0",
        tertiary: "#000000",
        "on-tertiary-container": "#77859a",
        "secondary-fixed": "#ffdea7",
        "surface-dim": "#d8dadc",
        "error-container": "#ffdad6",
        outline: "#76777d",
        "inverse-surface": "#2d3133",
        surface: "#f7f9fb",
        "tertiary-container": "#0d1c2e",
        "tertiary-fixed": "#d5e3fc",
        "on-error-container": "#93000a",
        primary: "#000000",
        "surface-container-low": "#f2f4f6",
        "on-background": "#191c1e",
        "on-surface-variant": "#45464d",
        "outline-variant": "#c6c6cd",
        "surface-container-lowest": "#ffffff",
        "on-primary-container": "#7c839b",
        "on-surface": "#191c1e",
        "on-error": "#ffffff",
        "on-tertiary-fixed-variant": "#3a485b",
        "surface-container-high": "#e6e8ea",
        "on-tertiary-fixed": "#0d1c2e",
        "primary-container": "#131b2e",
        "primary-fixed": "#dae2fd",
        "on-secondary-fixed-variant": "#5b4311",
        "on-primary-fixed-variant": "#3f465c",
        "secondary-fixed-dim": "#e5c184",
        background: "#f7f9fb"
      },
      borderRadius: {
        DEFAULT: "0.125rem",
        lg: "0.25rem",
        xl: "0.5rem",
        full: "0.75rem"
      },
      spacing: {
        "stack-sm": "0.5rem",
        "stack-md": "1rem",
        "container-max": "1200px",
        "margin-mobile": "1rem",
        gutter: "1.5rem",
        "stack-lg": "2rem",
        "margin-desktop": "2.5rem"
      },
      fontFamily: {
        "body-md": ["IBM Plex Sans Arabic", "sans-serif"],
        "body-lg": ["IBM Plex Sans Arabic", "sans-serif"],
        "display-lg": ["IBM Plex Sans Arabic", "sans-serif"],
        "headline-md": ["IBM Plex Sans Arabic", "sans-serif"],
        "label-sm": ["Inter", "sans-serif"],
        "display-lg-mobile": ["IBM Plex Sans Arabic", "sans-serif"]
      },
      fontSize: {
        "kmt-display": ["40px", { lineHeight: "52px", letterSpacing: "0", fontWeight: "600" }],
        "kmt-title": ["24px", { lineHeight: "34px", letterSpacing: "0", fontWeight: "600" }],
        "kmt-body": ["16px", { lineHeight: "26px", letterSpacing: "0", fontWeight: "400" }],
        "kmt-label": ["13px", { lineHeight: "18px", letterSpacing: "0", fontWeight: "600" }],
        "body-md": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "body-lg": ["18px", { lineHeight: "28px", fontWeight: "400" }],
        "display-lg": [
          "48px",
          { lineHeight: "60px", letterSpacing: "-0.02em", fontWeight: "600" }
        ],
        "headline-md": ["24px", { lineHeight: "32px", fontWeight: "500" }],
        "label-sm": [
          "12px",
          { lineHeight: "16px", letterSpacing: "0.05em", fontWeight: "500" }
        ],
        "display-lg-mobile": ["32px", { lineHeight: "40px", fontWeight: "600" }]
      },
      boxShadow: {
        "kmt-popover": "0 10px 15px -3px rgba(15, 23, 42, 0.05), 0 4px 6px -4px rgba(15, 23, 42, 0.05)",
        "kmt-focus": "0 0 0 3px rgba(153, 123, 68, 0.18)"
      }
    }
  },
  plugins: [
    forms,
    containerQueries,
    plugin(({ addBase }) => addBase({ ":root": kmtStateCssVariables }))
  ]
};

export default config;
