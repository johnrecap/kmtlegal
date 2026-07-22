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

export type KmtTokens = typeof kmtTokens;
