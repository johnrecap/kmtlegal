"use client";

import type { ClientAnalyticsEventName } from "./analytics-events";

export function trackClientAnalyticsEvent(name: ClientAnalyticsEventName, properties: Record<string, unknown> = {}) {
  const payload = JSON.stringify({ name, source: "PUBLIC", properties });

  if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    const sent = navigator.sendBeacon("/api/analytics/events", new Blob([payload], { type: "application/json" }));
    if (sent) {
      return;
    }
  }

  void fetch("/api/analytics/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true
  }).catch(() => {
    // Analytics must never interrupt the user flow.
  });
}
