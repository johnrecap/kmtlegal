export const kmtTokens = {
  color: {
    navy: "#0f172a",
    gold: "#997b44",
    goldDark: "#755a26",
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
  50: "#faf6ee",
  100: "#f4ebda",
  200: "#e8d6b1",
  300: "#dcbd85",
  400: "#c7a363",
  500: "#b08e50",
  600: "#997b44",
  700: "#755a26",
  800: "#5d471e",
  900: "#483718"
} as const;

export const kmtSemanticLight = {
  background: "#f7f9fb",
  foreground: "#191c1e",
  surface: "#ffffff",
  "surface-muted": "#eceef0",
  border: "#e2e8f0",
  "muted-foreground": "#45464d",
  primary: "#997b44",
  "primary-foreground": "#17130d",
  accent: "#755a26",
  ring: "#997b44"
} as const;

export const kmtSemanticDark = {
  background: "#0b0c0e",
  foreground: "#f8f3ea",
  surface: "#15171c",
  "surface-muted": "#1e2127",
  border: "#2e323d",
  "muted-foreground": "#a7b0bf",
  primary: "#c7a363",
  "primary-foreground": "#1a1409",
  accent: "#c7a363",
  ring: "#c7a363"
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
    ...kmtSemanticDarkCssVariables
  }
} as const;

export type KmtTokens = typeof kmtTokens;
