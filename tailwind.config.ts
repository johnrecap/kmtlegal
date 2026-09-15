import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";
import containerQueries from "@tailwindcss/container-queries";
import plugin from "tailwindcss/plugin";
import {
  kmtGoldRamp,
  kmtMotion,
  kmtRadiusRamp,
  kmtSemanticBaseStyles,
  kmtStateCssVariables,
  kmtTokens
} from "./src/lib/design-system/tokens";

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
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: {
          DEFAULT: "var(--surface)",
          muted: "var(--surface-muted)"
        },
        border: "var(--border)",
        "muted-foreground": "var(--muted-foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)"
        },
        accent: "var(--accent)",
        ring: "var(--ring)",
        gold: kmtGoldRamp,
        info: {
          DEFAULT: "var(--state-info)",
          surface: "var(--state-info-surface)",
          border: "var(--state-info-border)",
          strong: "var(--state-info-strong)"
        },
        success: {
          DEFAULT: "var(--state-success)",
          surface: "var(--state-success-surface)",
          border: "var(--state-success-border)",
          strong: "var(--state-success-strong)"
        },
        warning: {
          DEFAULT: "var(--state-warning)",
          surface: "var(--state-warning-surface)",
          border: "var(--state-warning-border)",
          strong: "var(--state-warning-strong)"
        },
        danger: {
          DEFAULT: "var(--state-danger)",
          surface: "var(--state-danger-surface)",
          border: "var(--state-danger-border)",
          strong: "var(--state-danger-strong)"
        },
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
        }
      },
      borderRadius: {
        DEFAULT: kmtRadiusRamp.DEFAULT,
        lg: kmtRadiusRamp.lg,
        xl: kmtRadiusRamp.xl,
        full: kmtRadiusRamp.full
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
        "label-sm": ["Inter", "sans-serif"]
      },
      fontSize: {
        "label-sm": [
          "12px",
          { lineHeight: "16px", letterSpacing: "0.05em", fontWeight: "500" }
        ]
      },
      transitionDuration: {
        "kmt-fast": kmtMotion.duration.fast,
        "kmt-normal": kmtMotion.duration.normal,
        "kmt-slow": kmtMotion.duration.slow
      },
      transitionTimingFunction: {
        "kmt-out": kmtMotion.ease.out,
        "kmt-expo": kmtMotion.ease.expo
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
    plugin(({ addBase }) => addBase(kmtSemanticBaseStyles)),
    plugin(({ addBase }) => addBase({ ":root": kmtStateCssVariables }))
  ]
};

export default config;
