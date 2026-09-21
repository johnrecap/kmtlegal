export const kmtTokens = {
  color: {
    navy: "#0f172a",
    // Logo-anchored gold (extracted from public/brand/kmt-logo-*.webp|png
    // via sharp bucket analysis: core #A87830, bright #D0A048).
    gold: "#a87830",
    goldDark: "#7c5a24",
    paper: "#ffffff",
    canvas: "#f8fafc",
    ink: "#0f172a",
    muted: "#64748b",
    border: "#e2e8f0"
  },
  state: {
    info: { foreground: "#1e40af", surface: "#eff6ff", border: "#bfdbfe", strong: "#1e3a8a" },
    success: { foreground: "#166534", surface: "#f0fdf4", border: "#bbf7d0", strong: "#14532d" },
    warning: { foreground: "#92400e", surface: "#fffbeb", border: "#fde68a", strong: "#78350f" },
    danger: { foreground: "#991b1b", surface: "#fef2f2", border: "#fecaca", strong: "#7f1d1d" }
  },
  radius: {
    control: "4px",
    panel: "8px",
    pill: "9999px"
  },
  shadow: {
    popover: "0 10px 15px -3px rgba(15, 23, 42, 0.05), 0 4px 6px -4px rgba(15, 23, 42, 0.05)"
  },
  layout: {
    container: "1200px",
    desktopMargin: "40px",
    mobileMargin: "16px"
  }
} as const;

export const kmtGoldRamp = {
  50: "#fbf5ea",
  100: "#f4e6c9",
  200: "#e9cf9e",
  300: "#d8a850",
  400: "#c79a52",
  500: "#b8893b",
  600: "#a87830",
  700: "#7c5a24",
  800: "#5c421c",
  900: "#473318"
} as const;

/**
 * Locked public visual direction: deep-black surface family. The public dark
 * theme reads as deep black (canvas #050505); elevated panels step through
 * this scale with deliberately subtle differences. Light theme keeps paper.
 */
export const kmtBlackScale = {
  0: "#050505",
  1: "#080808",
  2: "#0b0b0b",
  3: "#101010",
  hover: "#141414"
} as const;

/**
 * KMT logo gold family. Source of truth: public/brand/kmt-logo-source.jpg,
 * kmt-logo-full.webp, kmt-logo-icon.png (avg #765a2c–#7d602e, highlights
 * #b6893e/#cca556). Core #a87830, bright #d0a048. Gold signals hierarchy,
 * interaction, premium detail, and conversion — never large fills.
 */
export const kmtGoldFamily = {
  primary: "#a87830",
  bright: "#d0a048",
  muted: "#8a6a35",
  border: "rgb(208 160 72 / 35%)",
  glow: "rgb(208 160 72 / 14%)",
  text: "#eac987"
} as const;

export const kmtSemanticLight = {
  background: "#f7f9fb",
  foreground: "#191c1e",
  surface: "#ffffff",
  "surface-muted": "#eceef0",
  border: "#e2e8f0",
  "muted-foreground": "#45464d",
  primary: "#a87830",
  "primary-foreground": "#0d0a06",
  accent: "#7c5a24",
  ring: "#a87830"
} as const;

export const kmtSemanticDark = {
  background: "#0b0c0e",
  foreground: "#f8f3ea",
  surface: "#15171c",
  "surface-muted": "#1e2127",
  border: "#2e323d",
  "muted-foreground": "#a7b0bf",
  primary: "#d0a048",
  "primary-foreground": "#1a1409",
  accent: "#d0a048",
  ring: "#d0a048"
} as const;

export const kmtStateDark = {
  info: { foreground: "#a5c4f6", surface: "#16213a", border: "#2b4a7d", strong: "#c9dcfb" },
  success: { foreground: "#8fd9a4", surface: "#122a1b", border: "#275c3a", strong: "#b8ecc6" },
  warning: { foreground: "#f4cf7a", surface: "#2f2509", border: "#6e5518", strong: "#f7e2ab" },
  danger: { foreground: "#f4a5a0", surface: "#331615", border: "#7d2a26", strong: "#f8c9c5" }
} as const;

export const kmtMotion = {
  duration: { fast: "150ms", normal: "300ms", slow: "600ms" },
  ease: {
    out: "cubic-bezier(0.22, 1, 0.36, 1)",
    expo: "cubic-bezier(0.16, 1, 0.3, 1)"
  }
} as const;

export const kmtRadiusRamp = {
  DEFAULT: "0.25rem",
  lg: "0.5rem",
  xl: "0.75rem",
  full: "9999px"
} as const;

/**
 * Stage A foundation rules (design-system source of truth; see QA gate).
 * Radius: controls 4px / panels rounded-lg (8px) / feature canvases
 * rounded-2xl (picker, docket, chat console) / pills full. No other radii.
 * Gold alpha: rest borders /25, chips + strong borders /35, emphasis /45,
 * hover + active /70, fills /10 + /15. Section density: compact py-12/lg:16
 * for ledger content, roomy py-16/lg:24 for statement + feature moments.
 */
export const kmtFoundation = {
  radius: { control: "rounded", panel: "rounded-lg", feature: "rounded-2xl", pill: "rounded-full" },
  goldAlpha: { rest: 25, chip: 35, emphasis: 45, hover: 70, fill: 10, fillStrong: 15 },
  section: { compact: "py-12 lg:py-16", roomy: "py-16 lg:py-24", container: "max-w-[1200px]" },
  motion: { entranceStaggerMs: 80, revealThreshold: 0.12 }
} as const;

export const kmtStateCssVariables = {
  "--kmt-state-info": kmtTokens.state.info.foreground,
  "--kmt-state-info-surface": kmtTokens.state.info.surface,
  "--kmt-state-info-border": kmtTokens.state.info.border,
  "--kmt-state-info-strong": kmtTokens.state.info.strong,
  "--kmt-state-success": kmtTokens.state.success.foreground,
  "--kmt-state-success-surface": kmtTokens.state.success.surface,
  "--kmt-state-success-border": kmtTokens.state.success.border,
  "--kmt-state-success-strong": kmtTokens.state.success.strong,
  "--kmt-state-warning": kmtTokens.state.warning.foreground,
  "--kmt-state-warning-surface": kmtTokens.state.warning.surface,
  "--kmt-state-warning-border": kmtTokens.state.warning.border,
  "--kmt-state-warning-strong": kmtTokens.state.warning.strong,
  "--kmt-state-danger": kmtTokens.state.danger.foreground,
  "--kmt-state-danger-surface": kmtTokens.state.danger.surface,
  "--kmt-state-danger-border": kmtTokens.state.danger.border,
  "--kmt-state-danger-strong": kmtTokens.state.danger.strong
} as const;

export const kmtStateDarkCssVariables = {
  "--kmt-state-info": kmtStateDark.info.foreground,
  "--kmt-state-info-surface": kmtStateDark.info.surface,
  "--kmt-state-info-border": kmtStateDark.info.border,
  "--kmt-state-info-strong": kmtStateDark.info.strong,
  "--kmt-state-success": kmtStateDark.success.foreground,
  "--kmt-state-success-surface": kmtStateDark.success.surface,
  "--kmt-state-success-border": kmtStateDark.success.border,
  "--kmt-state-success-strong": kmtStateDark.success.strong,
  "--kmt-state-warning": kmtStateDark.warning.foreground,
  "--kmt-state-warning-surface": kmtStateDark.warning.surface,
  "--kmt-state-warning-border": kmtStateDark.warning.border,
  "--kmt-state-warning-strong": kmtStateDark.warning.strong,
  "--kmt-state-danger": kmtStateDark.danger.foreground,
  "--kmt-state-danger-surface": kmtStateDark.danger.surface,
  "--kmt-state-danger-border": kmtStateDark.danger.border,
  "--kmt-state-danger-strong": kmtStateDark.danger.strong
} as const;

type KmtSemanticPalette = {
  background: string;
  foreground: string;
  surface: string;
  "surface-muted": string;
  border: string;
  "muted-foreground": string;
  primary: string;
  "primary-foreground": string;
  accent: string;
  ring: string;
};

type KmtStatePalette = {
  info: { foreground: string; surface: string; border: string; strong: string };
  success: { foreground: string; surface: string; border: string; strong: string };
  warning: { foreground: string; surface: string; border: string; strong: string };
  danger: { foreground: string; surface: string; border: string; strong: string };
};

function toSemanticVars(semantic: KmtSemanticPalette, states: KmtStatePalette) {
  return {
    "--background": semantic.background,
    "--foreground": semantic.foreground,
    "--surface": semantic.surface,
    "--surface-muted": semantic["surface-muted"],
    "--border": semantic.border,
    "--muted-foreground": semantic["muted-foreground"],
    "--primary": semantic.primary,
    "--primary-foreground": semantic["primary-foreground"],
    "--accent": semantic.accent,
    "--ring": semantic.ring,
    "--state-info": states.info.foreground,
    "--state-info-surface": states.info.surface,
    "--state-info-border": states.info.border,
    "--state-info-strong": states.info.strong,
    "--state-success": states.success.foreground,
    "--state-success-surface": states.success.surface,
    "--state-success-border": states.success.border,
    "--state-success-strong": states.success.strong,
    "--state-warning": states.warning.foreground,
    "--state-warning-surface": states.warning.surface,
    "--state-warning-border": states.warning.border,
    "--state-warning-strong": states.warning.strong,
    "--state-danger": states.danger.foreground,
    "--state-danger-surface": states.danger.surface,
    "--state-danger-border": states.danger.border,
    "--state-danger-strong": states.danger.strong
  } as const;
}

export const kmtSemanticLightCssVariables = toSemanticVars(kmtSemanticLight, kmtTokens.state);

export const kmtSemanticDarkCssVariables = toSemanticVars(kmtSemanticDark, kmtStateDark);

export const kmtMotionCssVariables = {
  "--kmt-duration-fast": kmtMotion.duration.fast,
  "--kmt-duration-normal": kmtMotion.duration.normal,
  "--kmt-duration-slow": kmtMotion.duration.slow,
  "--kmt-ease-out": kmtMotion.ease.out,
  "--kmt-ease-expo": kmtMotion.ease.expo
} as const;

export const kmtSemanticBaseStyles = {
  ":root": {
    ...kmtSemanticLightCssVariables,
    ...kmtStateCssVariables,
    ...kmtMotionCssVariables
  },
  ".dark": {
    colorScheme: "dark",
    ...kmtSemanticDarkCssVariables,
    ...kmtStateDarkCssVariables
  }
} as const;

export type KmtTokens = typeof kmtTokens;
