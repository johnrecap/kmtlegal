"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { Button, InlineFeedback, Select, Textarea } from "@/components/ui";
import {
  localizeApiMessage,
  plan36ConsultationOutcomeCopy as copy
} from "@/lib/ui-copy";

type FinalOutcome = "SUCCESSFUL" | "NO_SHOW" | "CANCELLED";
type Feedback = { tone: "success" | "error"; text: string; code?: string };
type ApiErrorBody = { error?: { code?: string; message?: string } };

const initialReasons = [
  "COMPLETED_AS_SCHEDULED",
  "CLIENT_NO_SHOW",
  "CANCELLED_BY_CLIENT",
  "CANCELLED_BY_OFFICE",
  "TECHNICAL_ISSUE",
  "OTHER"
] as const;
const correctionReasons = [
  "CORRECTED_OPERATOR_ERROR",
  "CORRECTED_AFTER_VERIFICATION",
  "CORRECTED_CLIENT_UPDATE",
  "OTHER"
] as const;
const finalOutcomes: FinalOutcome[] = ["SUCCESSFUL", "NO_SHOW", "CANCELLED"];

export function ConsultationOutcomeForm({
  consultationId,
  currentOutcome,
  outcomeVersion
}: {
  consultationId: string;
  currentOutcome: string;
  outcomeVersion: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const isCorrection = finalOutcomes.includes(currentOutcome as FinalOutcome);
  const reasons = isCorrection ? correctionReasons : initialReasons;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    if (formData.get("confirm") !== "yes") {
      setFeedback({ tone: "error", text: copy.outcomeForm.confirmRequired });
      return;
    }

    setBusy(true);
    setFeedback(null);
    try {
      const response = await fetch(`/api/admin/consultations/${consultationId}/outcome`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: formData.get("status"),
          expectedOutcomeVersion: outcomeVersion,
          reasonCode: formData.get("reasonCode"),
          note: formData.get("note")
        })
      });
      const body = (await response.json().catch(() => ({}))) as ApiErrorBody;
      if (!response.ok) {
        setFeedback({
          tone: "error",
          code: body.error?.code,
          text: body.error?.message
            ? localizeApiMessage(body.error.message, "ar")
            : copy.feedback.failed
        });
        return;
      }
      setFeedback({
        tone: "success",
        text: isCorrection ? copy.feedback.outcomeCorrected : copy.feedback.outcomeSaved
      });
      router.refresh();
    } catch {
      setFeedback({ tone: "error", text: copy.feedback.failed });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={submit}>
      <Select
        defaultValue={isCorrection ? "" : "SUCCESSFUL"}
        disabled={busy}
        idPrefix={`consultation-outcome-${consultationId}`}
        label={copy.outcomeForm.result}
        name="status"
        required
      >
        {isCorrection ? <option value="">{copy.outcomeForm.chooseDifferentResult}</option> : null}
        {finalOutcomes
          .filter((status) => status !== currentOutcome)
          .map((status) => (
            <option key={status} value={status}>{copy.statuses[status]}</option>
          ))}
      </Select>
      <Select
        defaultValue={reasons[0]}
        disabled={busy}
        idPrefix={`consultation-outcome-${consultationId}`}
        label={isCorrection ? copy.outcomeForm.correctionReason : copy.outcomeForm.reason}
        name="reasonCode"
        required
      >
        {reasons.map((reason) => (
          <option key={reason} value={reason}>{copy.reasons[reason]}</option>
        ))}
      </Select>
      <Textarea
        disabled={busy}
        hint={copy.outcomeForm.noteHint}
        idPrefix={`consultation-outcome-${consultationId}`}
        label={copy.outcomeForm.note}
        maxLength={800}
        name="note"
      />
      <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded border border-kmt-border p-3 text-sm leading-6 text-kmt-ink">
        <input className="mt-1 h-5 w-5 shrink-0" disabled={busy} name="confirm" required type="checkbox" value="yes" />
        <span>{copy.outcomeForm.confirm}</span>
      </label>
      <Button loading={busy} type="submit" variant={isCorrection ? "danger" : "primary"}>
        {isCorrection ? copy.outcomeForm.saveCorrection : copy.outcomeForm.save}
      </Button>
      {feedback ? (
        <InlineFeedback
          action={feedback.code === "CONSULTATION_STATE_CHANGED" ? (
            <Button onClick={() => router.refresh()} size="sm" type="button" variant="secondary">
              {copy.outcomeForm.refresh}
            </Button>
          ) : undefined}
          title={feedback.text}
          tone={feedback.tone}
        />
      ) : null}
    </form>
  );
}
