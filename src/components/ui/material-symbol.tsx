import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type MaterialSymbolProps = {
  name: string;
  className?: string;
  filled?: boolean;
  "aria-hidden"?: boolean;
};

type IconNode = ReactNode;

const strokeProps = {
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  strokeWidth: 1.9
} as const;

const icons: Record<string, IconNode> = {
  account_balance: (
    <>
      <path {...strokeProps} d="M4 10h16M5 20h14M7 10v7m5-7v7m5-7v7" />
      <path {...strokeProps} d="M3.5 8 12 4l8.5 4" />
    </>
  ),
  account_balance_wallet: (
    <>
      <path {...strokeProps} d="M4 7.5h14.5A2.5 2.5 0 0 1 21 10v7a2.5 2.5 0 0 1-2.5 2.5h-12A2.5 2.5 0 0 1 4 17V7.5Z" />
      <path {...strokeProps} d="M4 8.5 16.5 5v3.5" />
      <path {...strokeProps} d="M16 13h5" />
      <circle cx="16.6" cy="13" r="0.8" fill="currentColor" />
    </>
  ),
  account_circle: (
    <>
      <circle {...strokeProps} cx="12" cy="12" r="8.5" />
      <circle {...strokeProps} cx="12" cy="9.5" r="2.4" />
      <path {...strokeProps} d="M7.8 17a4.6 4.6 0 0 1 8.4 0" />
    </>
  ),
  add: <path {...strokeProps} d="M12 5v14M5 12h14" />,
  arrow_back: <path {...strokeProps} d="M19 12H6m6-6-6 6 6 6" />,
  arrow_forward: <path {...strokeProps} d="M5 12h13m-6-6 6 6-6 6" />,
  badge: (
    <>
      <rect {...strokeProps} x="5" y="4.5" width="14" height="15" rx="2" />
      <path {...strokeProps} d="M9 8h6M8.5 16.5a3.7 3.7 0 0 1 7 0" />
      <circle {...strokeProps} cx="12" cy="12" r="2" />
    </>
  ),
  balance: (
    <>
      <path {...strokeProps} d="M12 4v16M7 20h10M5 7h14M8 7 5 14h6L8 7Zm8 0-3 7h6l-3-7Z" />
    </>
  ),
  block: (
    <>
      <circle {...strokeProps} cx="12" cy="12" r="8.5" />
      <path {...strokeProps} d="m6.3 6.3 11.4 11.4" />
    </>
  ),
  bolt: <path {...strokeProps} d="m13 3-7 11h5l-1 7 8-12h-5l1-6Z" />,
  call: (
    <>
      <path {...strokeProps} d="M7 5.5 9.4 5l1.3 4-1.6 1.1a10 10 0 0 0 4.8 4.8l1.1-1.6 4 1.3-.5 2.4c-.2 1-1.1 1.7-2.1 1.6C10 18 6 14 5.4 7.6c-.1-1 .6-1.9 1.6-2.1Z" />
    </>
  ),
  campaign: (
    <>
      <path {...strokeProps} d="M5 13h3l8 4V7l-8 4H5v2Zm3 0v5" />
      <path {...strokeProps} d="M19 9.5a3.5 3.5 0 0 1 0 5" />
    </>
  ),
  cases: <path {...strokeProps} d="M6 7.5h12a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9.5a2 2 0 0 1 2-2Zm3 0V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5" />,
  check_circle: (
    <>
      <circle {...strokeProps} cx="12" cy="12" r="8.5" />
      <path {...strokeProps} d="m8.2 12.4 2.4 2.4 5.2-5.5" />
    </>
  ),
  contract: (
    <>
      <path {...strokeProps} d="M7 4h7l3 3v13H7V4Z" />
      <path {...strokeProps} d="M14 4v4h4M9.5 11h5M9.5 14h5M9.5 17h3" />
    </>
  ),
  contract_edit: (
    <>
      <path {...strokeProps} d="M6 4h8l3 3v6" />
      <path {...strokeProps} d="M14 4v4h4M8.5 11h5M8.5 14h3" />
      <path {...strokeProps} d="m13 19 5.8-5.8 2 2L15 21h-2v-2Z" />
    </>
  ),
  dashboard: (
    <>
      <rect {...strokeProps} x="4" y="4.5" width="6" height="6" rx="1.5" />
      <rect {...strokeProps} x="14" y="4.5" width="6" height="6" rx="1.5" />
      <rect {...strokeProps} x="4" y="14" width="6" height="6" rx="1.5" />
      <rect {...strokeProps} x="14" y="14" width="6" height="6" rx="1.5" />
    </>
  ),
  description: (
    <>
      <path {...strokeProps} d="M7 4h7l3 3v13H7V4Z" />
      <path {...strokeProps} d="M14 4v4h4M9.5 12h5M9.5 15h5M9.5 18h3" />
    </>
  ),
  edit: <path {...strokeProps} d="m5 18.5.8-3.7L16 4.6a2 2 0 0 1 2.8 2.8L8.6 17.6 5 18.5ZM14.5 6.1l3.4 3.4" />,
  error: (
    <>
      <circle {...strokeProps} cx="12" cy="12" r="8.5" />
      <path {...strokeProps} d="M12 7.5v5.2" />
      <circle cx="12" cy="16.3" r="1" fill="currentColor" />
    </>
  ),
  event: (
    <>
      <rect {...strokeProps} x="5" y="5.5" width="14" height="14" rx="2" />
      <path {...strokeProps} d="M8 3.5v4M16 3.5v4M5 10h14" />
    </>
  ),
  event_available: (
    <>
      <rect {...strokeProps} x="5" y="5.5" width="14" height="14" rx="2" />
      <path {...strokeProps} d="M8 3.5v4M16 3.5v4M5 10h14m4 5.1 2 2 4-4.4" />
    </>
  ),
  event_note: (
    <>
      <rect {...strokeProps} x="5" y="5.5" width="14" height="14" rx="2" />
      <path {...strokeProps} d="M8 3.5v4M16 3.5v4M5 10h14M8.5 14h7M8.5 17h4" />
    </>
  ),
  expand_more: <path {...strokeProps} d="m7 9.5 5 5 5-5" />,
  fact_check: (
    <>
      <rect {...strokeProps} x="4" y="5" width="16" height="14" rx="2" />
      <path {...strokeProps} d="m7.5 10 1.5 1.5 2.5-3M13.5 10h3M7.5 15l1.5 1.5 2.5-3M13.5 15h3" />
    </>
  ),
  file: (
    <>
      <path {...strokeProps} d="M7 4h7l3 3v13H7V4Z" />
      <path {...strokeProps} d="M14 4v4h4" />
    </>
  ),
  folder: <path {...strokeProps} d="M4 7.5h6l2 2h8v8.5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7.5Z" />,
  folder_open: <path {...strokeProps} d="M4 8h6l2 2h8v3M4 11h17l-2.4 7.2A2.5 2.5 0 0 1 16.2 20H5.8A1.8 1.8 0 0 1 4 18.2V8Z" />,
  forum: (
    <>
      <path {...strokeProps} d="M5 5h11a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H9l-4 4V5Z" />
      <path {...strokeProps} d="M9 9h5M9 12h4" />
    </>
  ),
  gavel: (
    <>
      <path {...strokeProps} d="m13 5 6 6m-8 4 8 8M8 10l6-6 4 4-6 6-4-4Zm-3 7 4-4 2 2-4 4H5v-2Z" />
    </>
  ),
  groups: (
    <>
      <circle {...strokeProps} cx="12" cy="8.5" r="2.4" />
      <path {...strokeProps} d="M7.5 18a4.8 4.8 0 0 1 9 0" />
      <path {...strokeProps} d="M5.5 9.5a2 2 0 1 0 0 4M18.5 9.5a2 2 0 1 1 0 4M3.5 18a3.5 3.5 0 0 1 4-3.3M20.5 18a3.5 3.5 0 0 0-4-3.3" />
    </>
  ),
  history_edu: (
    <>
      <path {...strokeProps} d="M5 19c3-1.8 6-1.8 9 0V5c-3-1.8-6-1.8-9 0v14Z" />
      <path {...strokeProps} d="M14 5c1.7-.8 3.3-.9 5-.2V18c-1.7-.7-3.3-.6-5 .2M8 9h3M8 12h3" />
    </>
  ),
  home: <path {...strokeProps} d="M4 11.5 12 5l8 6.5V20h-5v-5H9v5H4v-8.5Z" />,
  location_on: (
    <>
      <path {...strokeProps} d="M12 21s6-5.2 6-10a6 6 0 0 0-12 0c0 4.8 6 10 6 10Z" />
      <circle {...strokeProps} cx="12" cy="11" r="2.2" />
    </>
  ),
  lock: (
    <>
      <rect {...strokeProps} x="5" y="10" width="14" height="10" rx="2" />
      <path {...strokeProps} d="M8 10V8a4 4 0 0 1 8 0v2" />
    </>
  ),
  logout: <path {...strokeProps} d="M10 5H6v14h4M13 8l4 4-4 4M17 12H9" />,
  mail: (
    <>
      <rect {...strokeProps} x="4" y="6" width="16" height="12" rx="2" />
      <path {...strokeProps} d="m5 8 7 5 7-5" />
    </>
  ),
  manage_accounts: (
    <>
      <circle {...strokeProps} cx="9.5" cy="9" r="3" />
      <path {...strokeProps} d="M4.5 18a5.2 5.2 0 0 1 8-4.4" />
      <path {...strokeProps} d="M16.5 13.5v2m0 4v1m-3.4-4.8 1.7 1m3.4 2 1.7 1m0-4-1.7 1m-3.4 2-1.7 1" />
    </>
  ),
  monitoring: (
    <>
      <path {...strokeProps} d="M4 19h16M6 16v-5m6 5V7m6 9v-8" />
      <path {...strokeProps} d="m6 10 4-3 4 3 4-5" />
    </>
  ),
  payments: (
    <>
      <rect {...strokeProps} x="4" y="6" width="16" height="12" rx="2" />
      <path {...strokeProps} d="M4 10h16M8 15h3" />
    </>
  ),
  pending_actions: (
    <>
      <path {...strokeProps} d="M7 4h8l3 3v5" />
      <path {...strokeProps} d="M14 4v4h4M8.5 12h4" />
      <circle {...strokeProps} cx="16" cy="17" r="4" />
      <path {...strokeProps} d="M16 14.7V17l1.7 1" />
    </>
  ),
  person: (
    <>
      <circle {...strokeProps} cx="12" cy="8.5" r="3" />
      <path {...strokeProps} d="M6.5 19a5.8 5.8 0 0 1 11 0" />
    </>
  ),
  person_add: (
    <>
      <circle {...strokeProps} cx="9.5" cy="8.5" r="2.8" />
      <path {...strokeProps} d="M4.5 19a5.3 5.3 0 0 1 8.5-4.2M17 8v6M14 11h6" />
    </>
  ),
  person_check: (
    <>
      <circle {...strokeProps} cx="9.5" cy="8.5" r="2.8" />
      <path {...strokeProps} d="M4.5 19a5.3 5.3 0 0 1 8.5-4.2m2.5 1.1 1.8 1.8 3.7-4" />
    </>
  ),
  public: (
    <>
      <circle {...strokeProps} cx="12" cy="12" r="8.5" />
      <path {...strokeProps} d="M4 12h16M12 3.5c2.4 2.4 3.5 5.2 3.5 8.5S14.4 18.1 12 20.5C9.6 18.1 8.5 15.3 8.5 12S9.6 5.9 12 3.5Z" />
    </>
  ),
  rate_review: (
    <>
      <path {...strokeProps} d="M5 5h13a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-4 3V5Z" />
      <path {...strokeProps} d="M9 10h6M9 13h4" />
    </>
  ),
  real_estate_agent: (
    <>
      <path {...strokeProps} d="M4 12 12 5l8 7" />
      <path {...strokeProps} d="M6 11v9h12v-9M10 20v-5h4v5" />
    </>
  ),
  receipt_long: (
    <>
      <path {...strokeProps} d="M7 4h10v16l-2-1.2-2 1.2-2-1.2-2 1.2-2-1.2V4Z" />
      <path {...strokeProps} d="M9.5 8h5M9.5 11h5M9.5 14h3" />
    </>
  ),
  save: (
    <>
      <path {...strokeProps} d="M5 5h12l2 2v12H5V5Z" />
      <path {...strokeProps} d="M8 5v5h7V5M8 19v-5h8v5" />
    </>
  ),
  schedule: (
    <>
      <circle {...strokeProps} cx="12" cy="12" r="8.5" />
      <path {...strokeProps} d="M12 7v5l3.5 2" />
    </>
  ),
  search: (
    <>
      <circle {...strokeProps} cx="10.5" cy="10.5" r="5.5" />
      <path {...strokeProps} d="m15 15 5 5" />
    </>
  ),
  send: <path {...strokeProps} d="M4 5.5 20 12 4 18.5l2.2-6.5L4 5.5Zm2.4 6.5H20" />,
  settings: (
    <>
      <circle {...strokeProps} cx="12" cy="12" r="3" />
      <path {...strokeProps} d="M12 3.8v2.1m0 12.2v2.1m8.2-8.2h-2.1M5.9 12H3.8m14-5.8-1.5 1.5M7.7 16.3l-1.5 1.5m11.6 0-1.5-1.5M7.7 7.7 6.2 6.2" />
    </>
  ),
  shield: <path {...strokeProps} d="M12 3.8 19 7v5.3c0 4.2-2.7 7.2-7 8.2-4.3-1-7-4-7-8.2V7l7-3.2Z" />,
  smart_toy: (
    <>
      <rect {...strokeProps} x="5" y="8" width="14" height="10" rx="3" />
      <path {...strokeProps} d="M12 5v3M9 13h.1M15 13h.1M9 17h6" />
    </>
  ),
  strategy: (
    <>
      <path {...strokeProps} d="M5 19V5h9l-1.5 3L14 11H5" />
      <path {...strokeProps} d="M17 8h3v11h-3zM13 13h3v6h-3zM9 15h3v4H9z" />
    </>
  ),
  support_agent: (
    <>
      <circle {...strokeProps} cx="12" cy="10" r="5" />
      <path {...strokeProps} d="M5 12v2a2 2 0 0 0 2 2h1m9-4v2a2 2 0 0 1-2 2h-1M8 19a6 6 0 0 1 8 0" />
    </>
  ),
  supervisor_account: (
    <>
      <circle {...strokeProps} cx="9.5" cy="8.5" r="2.7" />
      <path {...strokeProps} d="M4.5 18.5a5.2 5.2 0 0 1 9.8-2.4" />
      <circle {...strokeProps} cx="16.5" cy="10" r="2.2" />
      <path {...strokeProps} d="M13.5 18.5a4.3 4.3 0 0 1 7 0" />
    </>
  ),
  target: (
    <>
      <circle {...strokeProps} cx="12" cy="12" r="8.5" />
      <circle {...strokeProps} cx="12" cy="12" r="4.6" />
      <circle cx="12" cy="12" r="1.3" fill="currentColor" />
    </>
  ),
  task_alt: (
    <>
      <circle {...strokeProps} cx="12" cy="12" r="8.5" />
      <path {...strokeProps} d="m8.2 12.4 2.4 2.4 5.2-5.5" />
    </>
  ),
  translate: (
    <>
      <path {...strokeProps} d="M4 6h9M8.5 4v2M6.5 6c.6 2.6 2.2 4.7 5 6.5M11.5 6c-.8 2.9-2.9 5.2-6.2 6.8" />
      <path {...strokeProps} d="M14 20l3.5-8 3.5 8M15.2 17.2h4.6" />
    </>
  ),
  upload_file: (
    <>
      <path {...strokeProps} d="M7 4h7l3 3v13H7V4Z" />
      <path {...strokeProps} d="M14 4v4h4M12 17v-6m-3 3 3-3 3 3" />
    </>
  ),
  verified_user: (
    <>
      <path {...strokeProps} d="M12 3.8 19 7v5.3c0 4.2-2.7 7.2-7 8.2-4.3-1-7-4-7-8.2V7l7-3.2Z" />
      <path {...strokeProps} d="m8.8 12.3 2 2 4.4-4.8" />
    </>
  )
};

icons.calendar_month = icons.event;
icons.calendar_today = icons.event;
icons.domain = icons.account_balance;
icons.family_home = icons.home;
icons.group = icons.groups;
icons.help = icons.forum;
icons.language = icons.translate;
icons.more_horiz = icons.expand_more;
icons.more_vert = icons.expand_more;
icons.notifications = icons.campaign;
icons.request_quote = icons.receipt_long;
icons.warning = icons.error;
icons.work = icons.cases;

export function MaterialSymbol({
  name,
  className,
  filled = false,
  "aria-hidden": ariaHidden = true
}: MaterialSymbolProps) {
  return (
    <svg
      aria-hidden={ariaHidden}
      className={cn("inline-flex h-[1em] w-[1em] shrink-0 select-none overflow-visible align-middle leading-none", className)}
      data-icon={name}
      fill={filled ? "currentColor" : "none"}
      focusable="false"
      role={ariaHidden ? undefined : "img"}
      viewBox="0 0 24 24"
    >
      {icons[name] ?? icons.error}
    </svg>
  );
}
