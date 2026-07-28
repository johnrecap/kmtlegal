"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { ClientPortalPanel, clientPortalPrimaryActionClass } from "@/components/layout";
import { Button, TextInput } from "@/components/ui";
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
          <Button className={clientPortalPrimaryActionClass} loading={isSaving} type="submit">
            {copy.profile.save}
          </Button>
          {message ? (
            <div className="rounded border border-blue-300/35 bg-blue-950/45 px-3 py-2 text-sm leading-6 text-blue-100" role="status">
              {message}
            </div>
          ) : null}
        </form>
    </ClientPortalPanel>
  );
}
