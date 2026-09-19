"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  clientErrorMessage,
  getClientContent,
  type ClientLocale
} from "@/content/client-content";

type PreferenceResponse = {
  error?: { code?: string };
  requestId?: string;
};

export function ClientLanguageSwitch({ locale }: { locale: ClientLocale }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const copy = getClientContent(locale).shell;
  const nextLocale: ClientLocale = locale === "ar" ? "en" : "ar";

  async function changeLanguage() {
    setBusy(true);
    setFeedback(null);
    try {
      const response = await fetch("/api/client/preferences", {
        method: "PATCH",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ locale: nextLocale })
      });
      const body = (await response.json().catch(() => ({}))) as PreferenceResponse;
      if (!response.ok) {
        setFeedback(clientErrorMessage(locale, body.error?.code, copy.languageFailed));
        return;
      }
      router.refresh();
    } catch {
      setFeedback(copy.languageFailed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        aria-label={`${copy.language}: ${copy.switchTo}`}
        className="inline-flex min-h-11 items-center justify-center border border-[var(--kmt-client-line)] px-3 text-xs font-semibold text-[var(--kmt-client-text)] transition-colors hover:border-kmt-gold/60 hover:text-kmt-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kmt-gold disabled:cursor-wait disabled:opacity-60"
        disabled={busy}
        lang={nextLocale}
        onClick={changeLanguage}
        type="button"
      >
        {busy ? copy.switchingLanguage : copy.switchTo}
      </button>
      <p aria-live="polite" className="sr-only" role="status">{feedback}</p>
    </div>
  );
}
