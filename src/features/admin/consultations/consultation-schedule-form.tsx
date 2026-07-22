"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { Button, InlineFeedback, Select, TextInput } from "@/components/ui";
import { cairoLocalDateTimeToIso } from "@/lib/legal-format";
import {
  localizeApiMessage,
  plan36ConsultationOutcomeCopy,
  plan37ConsultationOverdueCopy as copy
} from "@/lib/ui-copy";

type LawyerOption = { id: string; name: string; email: string };
type ApiErrorBody = { error?: { code?: string; message?: string } };
type Feedback = { tone: "success" | "error"; text: string; code?: string };

export function ConsultationScheduleForm({
  consultationId,
  lawyers,
  outcomeVersion
}: {
  consultationId: string;
  lawyers: LawyerOption[];
  outcomeVersion: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const fields = plan36ConsultationOutcomeCopy.reopenForm;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const startsAt = cairoLocalDateTimeToIso(String(formData.get("startsAt") || ""));
    if (!startsAt) {
      setFeedback({ tone: "error", text: fields.futureHint });
      return;
    }

    setBusy(true);
    setFeedback(null);
    try {
      const response = await fetch(`/api/admin/consultations/${consultationId}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignedLawyerId: formData.get("assignedLawyerId"),
          startsAt,
          durationMinutes: formData.get("durationMinutes"),
          mode: formData.get("mode"),
          location: formData.get("location"),
          expectedOutcomeVersion: outcomeVersion
        })
      });
      const body = (await response.json().catch(() => ({}))) as ApiErrorBody;
      if (!response.ok) {
        const code = body.error?.code;
        setFeedback({
          tone: "error",
          code,
          text:
            code === "APPOINTMENT_CONFLICT"
              ? copy.feedback.conflict
              : code === "CONSULTATION_STATE_CHANGED"
                ? copy.feedback.stale
                : body.error?.message
                  ? localizeApiMessage(body.error.message, "ar")
                  : copy.feedback.failed
        });
        return;
      }

      setFeedback({ tone: "success", text: copy.feedback.scheduled });
      router.refresh();
    } catch {
      setFeedback({ tone: "error", text: copy.feedback.failed });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={submit}>
      <Select
        disabled={busy}
        idPrefix={`consultation-schedule-${consultationId}`}
        label={fields.lawyer}
        name="assignedLawyerId"
        required
      >
        <option value="">{fields.chooseLawyer}</option>
        {lawyers.map((lawyer) => (
          <option key={lawyer.id} value={lawyer.id}>{lawyer.name}</option>
        ))}
      </Select>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput
          disabled={busy}
          hint={fields.futureHint}
          idPrefix={`consultation-schedule-${consultationId}`}
          label={fields.startsAt}
          name="startsAt"
          required
          type="datetime-local"
        />
        <TextInput
          defaultValue="60"
          disabled={busy}
          idPrefix={`consultation-schedule-${consultationId}`}
          label={fields.duration}
          max={240}
          min={15}
          name="durationMinutes"
          required
          step={15}
          type="number"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          defaultValue="ONLINE"
          disabled={busy}
          idPrefix={`consultation-schedule-${consultationId}`}
          label={fields.mode}
          name="mode"
          required
        >
          <option value="ONLINE">{fields.modes.ONLINE}</option>
          <option value="PHONE">{fields.modes.PHONE}</option>
          <option value="OFFICE">{fields.modes.OFFICE}</option>
        </Select>
        <TextInput
          disabled={busy}
          idPrefix={`consultation-schedule-${consultationId}`}
          label={fields.location}
          name="location"
        />
      </div>
      <Button disabled={!lawyers.length} loading={busy} type="submit">
        {copy.scheduleForm.submit}
      </Button>
      {!lawyers.length ? (
        <InlineFeedback title={copy.scheduleForm.unavailable} tone="info" />
      ) : null}
      {feedback ? (
        <InlineFeedback
          action={feedback.code === "CONSULTATION_STATE_CHANGED" ? (
            <Button onClick={() => router.refresh()} size="sm" type="button" variant="secondary">
              {plan36ConsultationOutcomeCopy.outcomeForm.refresh}
            </Button>
          ) : undefined}
          title={feedback.text}
          tone={feedback.tone}
        />
      ) : null}
      <span aria-live="polite" className="sr-only">
        {busy ? copy.feedback.scheduling : feedback?.text ?? ""}
      </span>
    </form>
  );
}
