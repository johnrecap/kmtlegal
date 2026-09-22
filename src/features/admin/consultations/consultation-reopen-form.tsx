"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { Button, InlineFeedback, Select, Textarea, TextInput } from "@/components/ui";
import { buttonClasses } from "@/components/ui/button";
import { Button as StatefulButton } from "@/components/ui/stateful-button";
import { cairoLocalDateTimeToIso } from "@/lib/legal-format";
import {
  plan36ConsultationOutcomeCopy as copy
} from "@/lib/ui-copy";
import { AdminApiError, readAdminApiResponse } from "@/features/admin/shared/admin-api-error";

type LawyerOption = { id: string; name: string; email: string };
type Feedback = { tone: "success" | "error"; text: string; code?: string };
const reopenReasons = [
  "REOPEN_CLIENT_REQUEST",
  "REOPEN_OFFICE_FOLLOW_UP",
  "REOPEN_SCHEDULING_ERROR",
  "OTHER"
] as const;

export function ConsultationReopenForm({
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

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const startsAt = cairoLocalDateTimeToIso(String(formData.get("startsAt") || ""));
    if (!startsAt) {
      setFeedback({ tone: "error", text: copy.reopenForm.futureHint });
      return;
    }

    setBusy(true);
    setFeedback(null);
    try {
      const response = await fetch(`/api/admin/consultations/${consultationId}/reopen`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignedLawyerId: formData.get("assignedLawyerId"),
          startsAt,
          durationMinutes: formData.get("durationMinutes"),
          mode: formData.get("mode"),
          location: formData.get("location"),
          reasonCode: formData.get("reasonCode"),
          note: formData.get("note"),
          expectedOutcomeVersion: outcomeVersion
        })
      });
      await readAdminApiResponse(response);
      setFeedback({ tone: "success", text: copy.feedback.reopened });
      router.refresh();
    } catch (error) {
      setFeedback({
        tone: "error",
        code: error instanceof AdminApiError ? error.code : undefined,
        text: error instanceof AdminApiError ? error.message : copy.feedback.failed
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={submit}>
      <Select disabled={busy} idPrefix={`consultation-reopen-${consultationId}`} label={copy.reopenForm.lawyer} name="assignedLawyerId" required>
        <option value="">{copy.reopenForm.chooseLawyer}</option>
        {lawyers.map((lawyer) => <option key={lawyer.id} value={lawyer.id}>{lawyer.name}</option>)}
      </Select>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput
          disabled={busy}
          hint={copy.reopenForm.futureHint}
          idPrefix={`consultation-reopen-${consultationId}`}
          label={copy.reopenForm.startsAt}
          name="startsAt"
          required
          type="datetime-local"
        />
        <TextInput
          defaultValue="60"
          disabled={busy}
          idPrefix={`consultation-reopen-${consultationId}`}
          label={copy.reopenForm.duration}
          max={240}
          min={15}
          name="durationMinutes"
          required
          step={15}
          type="number"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Select defaultValue="ONLINE" disabled={busy} idPrefix={`consultation-reopen-${consultationId}`} label={copy.reopenForm.mode} name="mode" required>
          <option value="ONLINE">{copy.reopenForm.modes.ONLINE}</option>
          <option value="PHONE">{copy.reopenForm.modes.PHONE}</option>
          <option value="OFFICE">{copy.reopenForm.modes.OFFICE}</option>
        </Select>
        <TextInput disabled={busy} idPrefix={`consultation-reopen-${consultationId}`} label={copy.reopenForm.location} name="location" />
      </div>
      <Select defaultValue={reopenReasons[0]} disabled={busy} idPrefix={`consultation-reopen-${consultationId}`} label={copy.reopenForm.reason} name="reasonCode" required>
        {reopenReasons.map((reason) => <option key={reason} value={reason}>{copy.reasons[reason]}</option>)}
      </Select>
      <Textarea disabled={busy} idPrefix={`consultation-reopen-${consultationId}`} label={copy.reopenForm.note} maxLength={800} name="note" />
      <StatefulButton
        aria-busy={busy}
        className={buttonClasses()}
        disabled={!lawyers.length || busy}
        type="submit"
      >
        {copy.reopenForm.submit}
      </StatefulButton>
      {feedback ? (
        <InlineFeedback
          action={feedback.code === "CONSULTATION_STATE_CHANGED" ? (
            <Button onClick={() => router.refresh()} size="sm" type="button" variant="secondary">
              {copy.outcomeForm.refresh}
            </Button>
          ) : undefined}
          description={feedback.code === "APPOINTMENT_CONFLICT" ? copy.feedback.conflict : undefined}
          title={feedback.text}
          tone={feedback.tone}
        />
      ) : null}
    </form>
  );
}
