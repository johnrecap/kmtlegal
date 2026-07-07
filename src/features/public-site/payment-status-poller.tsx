"use client";

import { useEffect, useMemo, useState } from "react";
import { MaterialSymbol } from "@/components/ui";

type PaymentStatusPollerProps = {
  attemptId: string;
  token?: string | null;
  expiresAt: string;
  initialStatus: string;
  labels: {
    pending: string;
    countdown: string;
    expired: string;
  };
};

export function PaymentStatusPoller({ attemptId, token, expiresAt, initialStatus, labels }: PaymentStatusPollerProps) {
  const [status, setStatus] = useState(initialStatus);
  const [now, setNow] = useState(() => Date.now());
  const shouldPoll = status === "CREATED" || status === "PENDING";

  const statusUrl = useMemo(() => {
    const params = new URLSearchParams({ attemptId });
    if (token) {
      params.set("token", token);
    }
    return `/api/public/payments/status?${params.toString()}`;
  }, [attemptId, token]);

  useEffect(() => {
    if (!shouldPoll) {
      return;
    }

    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(tick);
  }, [shouldPoll]);

  useEffect(() => {
    if (!shouldPoll) {
      return;
    }

    let stopped = false;
    const poll = async () => {
      try {
        const response = await fetch(statusUrl, { cache: "no-store" });
        const body = (await response.json().catch(() => null)) as { data?: { status?: string } } | null;
        const nextStatus = body?.data?.status;
        if (!stopped && nextStatus && nextStatus !== status) {
          setStatus(nextStatus);
          window.location.reload();
        }
      } catch {
        // The server-rendered status remains visible; the next poll can recover.
      }
    };

    const interval = window.setInterval(poll, 4000);
    void poll();
    return () => {
      stopped = true;
      window.clearInterval(interval);
    };
  }, [shouldPoll, status, statusUrl]);

  if (!shouldPoll) {
    return null;
  }

  const remainingMs = Math.max(0, new Date(expiresAt).getTime() - now);
  const remainingMinutes = Math.floor(remainingMs / 60_000);
  const remainingSeconds = Math.floor((remainingMs % 60_000) / 1000);
  const remainingText =
    remainingMs > 0
      ? `${String(remainingMinutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`
      : labels.expired;

  return (
    <div className="rounded-2xl border border-kmt-gold/25 bg-kmt-gold/10 px-4 py-3 text-sm leading-7 text-amber-50">
      <div className="flex flex-wrap items-center gap-2">
        <MaterialSymbol name="sync" className="text-kmt-gold" />
        <span>{labels.pending}</span>
        <span className="rounded-full border border-kmt-gold/30 px-3 py-0.5 font-semibold text-kmt-gold" dir="ltr">
          {remainingText}
        </span>
      </div>
      <p className="mt-1 text-amber-50/70">{labels.countdown}</p>
    </div>
  );
}
