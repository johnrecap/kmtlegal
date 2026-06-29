"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { ClientPortalPanel, clientPortalPrimaryActionClass } from "@/components/layout";
import { Button, TextInput } from "@/components/ui";

type ProfileFormValue = {
  fullName: string;
  phone: string;
  email?: string | null;
  city?: string | null;
};

type ApiErrorBody = {
  error?: {
    message?: string;
  };
};

export function ProfileForm({ profile }: { profile: ProfileFormValue }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setIsSaving(true);

    const formData = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/portal/profile", {
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
        setMessage(body.error?.message ?? "تعذر حفظ البيانات.");
        return;
      }

      setMessage("تم حفظ بيانات الملف الشخصي.");
      router.refresh();
    } catch {
      setMessage("لا يمكن الوصول إلى الخادم الآن.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ClientPortalPanel description="هذه البيانات تستخدم للتواصل وتنظيم مواعيد القضية." title="بيانات الملف الشخصي">
        <form className="grid gap-4" onSubmit={save}>
          <TextInput defaultValue={profile.fullName} label="الاسم الكامل" name="fullName" required />
          <TextInput defaultValue={profile.phone} label="رقم الهاتف" name="phone" required />
          <TextInput defaultValue={profile.email ?? ""} label="البريد الإلكتروني" name="email" type="email" />
          <TextInput defaultValue={profile.city ?? ""} label="المدينة" name="city" />
          <Button className={clientPortalPrimaryActionClass} loading={isSaving} type="submit">
            حفظ البيانات
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
