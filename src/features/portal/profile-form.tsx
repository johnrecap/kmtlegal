"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { ClientPortalPanel, clientPortalPrimaryActionClass } from "@/components/layout";
import { TextInput } from "@/components/ui";
import { Button as StatefulButton } from "@/components/ui/stateful-button";
import {
  clientErrorMessage,
  getClientContent,
  type ClientLocale
} from "@/content/client-content";

type ProfileFormValue = {
  fullName: string;
  phone: string;
  email?: string | null;
  city?: string | null;
};

type ApiErrorBody = {
  error?: {
    code?: string;
  };
  requestId?: string;
};

export function ProfileForm({ profile, locale }: { profile: ProfileFormValue; locale: ClientLocale }) {
  const router = useRouter();
  const copy = getClientContent(locale);
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setIsSaving(true);

    const formData = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/client/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: formData.get("fullName"),
          phone: formData.get("phone"),
          email: formData.get("email"),
          city: formData.get("city")
        })
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as ApiErrorBody;
        setMessage(clientErrorMessage(locale, body.error?.code, copy.profile.saveFailed));
        return;
      }

      setMessage(copy.profile.saved);
      router.refresh();
    } catch {
      setMessage(copy.profile.networkError);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ClientPortalPanel description={copy.profile.formDescription} title={copy.profile.formTitle}>
        <form className="grid gap-4" onSubmit={save}>
          <TextInput defaultValue={profile.fullName} label={copy.profile.fullName} name="fullName" required />
          <TextInput defaultValue={profile.phone} label={copy.profile.phone} name="phone" required />
          <TextInput defaultValue={profile.email ?? ""} label={copy.profile.email} name="email" type="email" />
          <TextInput defaultValue={profile.city ?? ""} label={copy.profile.city} name="city" />
          {/* Genuine async mutation (PATCH /api/client/profile): Aceternity
            Stateful Button drives the submit interaction. The form onSubmit
            above stays the single authority for validation, status message,
            and refresh; the button carries no onClick so Enter-key submits
            behave identically. */}
          <StatefulButton aria-busy={isSaving} className={clientPortalPrimaryActionClass} disabled={isSaving} type="submit">
            {copy.profile.save}
          </StatefulButton>
          {message ? (
            <div className="rounded border border-[var(--kmt-state-info-border)] bg-[var(--kmt-state-info-surface)] px-3 py-2 text-sm leading-6 text-[var(--kmt-state-info)]" role="status">
              {message}
            </div>
          ) : null}
        </form>
    </ClientPortalPanel>
  );
}
