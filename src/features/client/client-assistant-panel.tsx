"use client";

import { type FormEvent, useState } from "react";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Textarea } from "@/components/ui";
import { formatDateTime } from "@/lib/legal-format";

type AssistantAppointment = {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  status: string;
  mode: string;
  lawyer?: { name: string } | null;
};

type AssistantResponse = {
  message?: string;
  appointments?: AssistantAppointment[];
};

type ApiBody = {
  data?: AssistantResponse;
  error?: {
    message?: string;
  };
};

async function responseMessage(response: Response) {
  const body = (await response.json().catch(() => ({}))) as ApiBody;
  if (!response.ok) {
    return { error: body.error?.message ?? "تعذر تنفيذ الطلب الآن." };
  }
  return { data: body.data };
}

export function ClientAssistantPanel() {
  const [message, setMessage] = useState("ما هي مواعيد الاستشارات القادمة؟");
  const [reply, setReply] = useState<AssistantResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsBusy(true);

    try {
      const response = await fetch("/api/client/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale: "ar",
          intent: "appointment_inquiry",
          message
        })
      });
      const result = await responseMessage(response);
      if (result.error) {
        setError(result.error);
        return;
      }
      setReply(result.data ?? null);
    } catch {
      setError("لا يمكن الوصول إلى الخادم الآن.");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
      <Card>
        <CardHeader>
          <CardTitle>المساعد</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={submit}>
            <Textarea label="رسالتك" name="message" value={message} onChange={(event) => setMessage(event.target.value)} required />
            <Button loading={isBusy} type="submit">
              إرسال
            </Button>
          </form>
          {error ? (
            <div className="mt-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm leading-6 text-red-900" role="alert">
              {error}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>الرد</CardTitle>
        </CardHeader>
        <CardContent>
          {reply ? (
            <div className="space-y-3">
              <p className="text-sm leading-7 text-kmt-ink">{reply.message}</p>
              {reply.appointments?.length ? (
                <div className="space-y-2">
                  {reply.appointments.map((appointment) => (
                    <div key={appointment.id} className="rounded border border-kmt-border p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-kmt-ink">{appointment.title}</p>
                        <Badge tone="pending">{appointment.status}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-kmt-muted">{formatDateTime(appointment.startsAt)}</p>
                      <p className="mt-1 text-xs text-kmt-muted">{appointment.lawyer?.name ?? "غير محدد"}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-kmt-muted">لا يوجد رد بعد.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
