export const kmtTokens = {
  color: {
    navy: "#0f172a",
    gold: "#997b44",
    goldDark: "#755a26",
    paper: "#ffffff",
    canvas: "#f8fafc",
    ink: "#0f172a",
    muted: "#64748b",
    border: "#e2e8f0",
    success: "#166534",
    warning: "#92400e",
    danger: "#991b1b"
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

export type KmtTokens = typeof kmtTokens;
