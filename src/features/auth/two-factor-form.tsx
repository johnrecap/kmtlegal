"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, InlineFeedback, TextInput } from "@/components/ui";
import { Button as StatefulButton } from "@/components/ui/stateful-button";
import { getAuthContent } from "@/content/auth-content";
import type { ClientLocale } from "@/content/client-content";
import { useHydrated } from "@/lib/use-hydrated";
import { signedInRedirectPath } from "@/lib/auth-routing";

type Phase = "loading" | "verify" | "enroll" | "failed";

type StatusResponse = { data?: { enrolled?: boolean } };
type EnrollResponse = { data?: { setupKey?: string; otpauthUri?: string } };
type SuccessResponse = { data?: { user?: { role?: string } }; error?: { code?: string } };

async function readJson(response: Response) {
  return (await response.json().catch(() => ({}))) as StatusResponse & EnrollResponse & SuccessResponse;
}

export function TwoFactorForm({ locale, next }: { locale: ClientLocale; next?: string | null }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const copy = getAuthContent(locale).twoFactor;
  const effectiveNext = next ?? searchParams.get("next");
  const isHydrated = useHydrated();
  const [phase, setPhase] = useState<Phase>("loading");
  const [code, setCode] = useState("");
  const [setupKey, setSetupKey] = useState("");
  const [setupUri, setSetupUri] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const loadStatus = useCallback(async () => {
    setPhase("loading");
    setError(null);
    try {
      const statusResponse = await fetch("/api/auth/2fa/totp/status", { headers: { "Cache-Control": "no-store" } });
      const status = await readJson(statusResponse);
      if (!statusResponse.ok) {
        setPhase("failed");
        setError(copy.statusFailed);
        return;
      }
      if (status.data?.enrolled) {
        setPhase("verify");
        return;
      }
      const enrollResponse = await fetch("/api/auth/2fa/totp/enroll", { method: "POST" });
      const enroll = await readJson(enrollResponse);
      if (!enrollResponse.ok || !enroll.data?.setupKey) {
        setPhase("failed");
        setError(copy.enrollFailed);
        return;
      }
      setSetupKey(enroll.data.setupKey);
      setSetupUri(enroll.data.otpauthUri ?? "");
      setPhase("enroll");
    } catch {
      setPhase("failed");
      setError(copy.statusFailed);
    }
  }, [copy]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  function redirectAfterSuccess(role: string | undefined) {
    if (!role) {
      setError(copy.invalidCode);
      return;
    }
    router.push(signedInRedirectPath(role, effectiveNext));
    router.refresh();
  }

  async function submitCode(event: FormEvent<HTMLFormElement>, path: "/api/auth/2fa/totp/verify" | "/api/auth/2fa/totp/enroll/confirm") {
    event.preventDefault();
    setError(null);
    setIsBusy(true);
    try {
      const response = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code })
      });
      const data = await readJson(response);
      if (!response.ok) {
        setError(data.error?.code === "TWO_FACTOR_EXPIRED" ? copy.lockedSession : copy.invalidCode);
        return;
      }
      redirectAfterSuccess(data.data?.user?.role);
    } catch {
      setError(copy.invalidCode);
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <Card className="w-full max-w-md shadow-sm">
      <CardHeader>
        <CardTitle>{phase === "enroll" ? copy.enrollTitle : copy.formTitle}</CardTitle>
        <CardDescription>{phase === "enroll" ? copy.enrollDescription : copy.formDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        {phase === "loading" ? <p className="text-sm text-kmt-muted">{copy.loading}</p> : null}
        {phase === "failed" ? (
          <div className="space-y-4">
            <InlineFeedback title={error ?? copy.statusFailed} tone="error" />
            <Link className="text-sm font-semibold text-kmt-navy hover:underline" href="/login">
              {copy.backToLogin}
            </Link>
          </div>
        ) : null}
        {phase === "enroll" ? (
          <div className="mb-4 space-y-3">
            <TextInput dir="ltr" idPrefix="totp-enroll" label={copy.setupKeyLabel} name="setupKey" readOnly value={setupKey} />
            {setupUri ? (
              <TextInput dir="ltr" idPrefix="totp-enroll" label={copy.setupUriLabel} name="setupUri" readOnly value={setupUri} />
            ) : null}
          </div>
        ) : null}
        {phase === "verify" || phase === "enroll" ? (
          <form
            className="space-y-5"
            method="post"
            noValidate
            onSubmit={(event) =>
              submitCode(event, phase === "enroll" ? "/api/auth/2fa/totp/enroll/confirm" : "/api/auth/2fa/totp/verify")
            }
          >
            <TextInput
              autoComplete="one-time-code"
              dir="ltr"
              disabled={!isHydrated || isBusy}
              idPrefix="totp-code"
              inputMode="numeric"
              label={copy.codeLabel}
              maxLength={12}
              name="code"
              onChange={(event) => {
                setCode(event.target.value);
                setError(null);
              }}
              placeholder={copy.codePlaceholder}
              required
              type="text"
              value={code}
            />
            {error ? <InlineFeedback title={error} tone="error" /> : null}
            <StatefulButton
              aria-busy={isBusy}
              className="w-full bg-kmt-gold font-semibold text-[#120d07] hover:ring-kmt-gold disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
              disabled={!isHydrated || isBusy}
              type="submit"
            >
              {phase === "enroll" ? copy.confirmEnroll : copy.submitVerify}
            </StatefulButton>
          </form>
        ) : null}
      </CardContent>
    </Card>
  );
}
