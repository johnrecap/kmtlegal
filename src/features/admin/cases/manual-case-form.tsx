"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useRef, useState } from "react";
import {
  Button,
  ButtonLink,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  InlineFeedback,
  Select,
  StateBlock,
  Textarea,
  TextInput
} from "@/components/ui";
import { labelFrom, partyTypeLabels, priorityLabels } from "@/lib/legal-format";
import {
  plan35ApiErrorCopy,
  plan35ManualCaseUiCopy as copy
} from "@/lib/ui-copy";

export const MANUAL_CASE_PARTY_TYPES = [
  "CLIENT",
  "OPPOSING_PARTY",
  "WITNESS",
  "EXPERT",
  "OTHER"
] as const;

const casePriorities = ["LOW", "NORMAL", "HIGH", "URGENT"] as const;

export type ManualCaseClientOption = {
  id: string;
  fullName: string;
  phone: string;
};

export type ManualCaseLawyerOption = {
  id: string;
  name: string;
};

export type ManualCaseEditRecord = {
  id: string;
  assignedLawyerId: string;
  assignedLawyerName: string;
  title: string;
  caseType: string;
  courtName: string | null;
  externalCaseNumber: string | null;
  priority: (typeof casePriorities)[number];
  summary: string | null;
  updatedAt: string;
};

type InitialParty = {
  name: string;
  partyType: (typeof MANUAL_CASE_PARTY_TYPES)[number];
  notes: string | null;
};

type CreatePayload = {
  clientId: string;
  assignedLawyerId: string;
  title: string;
  caseType: string;
  courtName: string | null;
  externalCaseNumber: string | null;
  priority: (typeof casePriorities)[number];
  summary: string | null;
  parties: InitialParty[];
};

type Feedback = {
  tone: "info" | "success" | "warning" | "error";
  title: string;
  description?: string;
  collision?: boolean;
};

type ApiEnvelope<T> = {
  data?: T;
  error?: { code?: string; message?: string };
};

function formText(form: FormData, name: string) {
  return String(form.get(name) ?? "").trim();
}

function optionalFormText(form: FormData, name: string) {
  return formText(form, name) || null;
}

function partiesFromForm(form: FormData, rowIds: readonly number[]) {
  return rowIds
    .map((rowId) => ({
      name: formText(form, `party-${rowId}-name`),
      partyType: formText(form, `party-${rowId}-partyType`) as InitialParty["partyType"],
      notes: optionalFormText(form, `party-${rowId}-notes`)
    }))
    .filter((party) => party.name || party.notes);
}

function createPayloadFromForm(formElement: HTMLFormElement, rowIds: readonly number[]): CreatePayload {
  const form = new FormData(formElement);
  return {
    clientId: formText(form, "clientId"),
    assignedLawyerId: formText(form, "assignedLawyerId"),
    title: formText(form, "title"),
    caseType: formText(form, "caseType"),
    courtName: optionalFormText(form, "courtName"),
    externalCaseNumber: optionalFormText(form, "externalCaseNumber"),
    priority: formText(form, "priority") as CreatePayload["priority"],
    summary: optionalFormText(form, "summary"),
    parties: partiesFromForm(form, rowIds)
  };
}

function createPayloadIssue(payload: CreatePayload) {
  if (!payload.clientId) return copy.validation.clientRequired;
  if (!payload.assignedLawyerId) return copy.validation.lawyerRequired;
  if (payload.title.length < 3 || payload.caseType.length < 2) return copy.validation.required;
  if (payload.parties.some((party) => !party.name)) return copy.validation.partyNameRequired;
  return null;
}

async function responseEnvelope<T>(response: Response) {
  return (await response.json().catch(() => ({}))) as ApiEnvelope<T>;
}

function failedFeedback(): Feedback {
  return {
    tone: "error",
    title: copy.feedback.failed,
    description: copy.validation.invalid
  };
}

function collisionFeedback(): Feedback {
  return {
    tone: "warning",
    title: copy.collisionTitle,
    description: plan35ApiErrorCopy.CASE_REFERENCE_CONFLICT.message,
    collision: true
  };
}

function FeedbackRegion({
  feedback,
  onCollisionRetry,
  isBusy
}: {
  feedback: Feedback | null;
  onCollisionRetry?: () => void;
  isBusy: boolean;
}) {
  return (
    <div aria-live="polite" className="min-h-6">
      {feedback ? (
        <div className="space-y-3">
          <InlineFeedback
            description={feedback.description}
            title={feedback.title}
            tone={feedback.tone}
          />
          {feedback.collision && onCollisionRetry ? (
            <Button disabled={isBusy} onClick={onCollisionRetry} size="sm" type="button" variant="secondary">
              {copy.retryWithNewRequest}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function CaseCoreFields({
  disabled,
  record
}: {
  disabled: boolean;
  record?: ManualCaseEditRecord;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <TextInput defaultValue={record?.title ?? ""} disabled={disabled} idPrefix="manual-case" label={copy.title} name="title" required />
      <TextInput defaultValue={record?.caseType ?? ""} disabled={disabled} idPrefix="manual-case" label={copy.caseType} name="caseType" required />
      <TextInput defaultValue={record?.courtName ?? ""} disabled={disabled} idPrefix="manual-case" label={copy.courtName} name="courtName" />
      <TextInput defaultValue={record?.externalCaseNumber ?? ""} dir="ltr" disabled={disabled} idPrefix="manual-case" label={copy.externalCaseNumber} name="externalCaseNumber" />
      <Select defaultValue={record?.priority ?? "NORMAL"} disabled={disabled} idPrefix="manual-case" label={copy.priority} name="priority">
        {casePriorities.map((priority) => (
          <option key={priority} value={priority}>{labelFrom(priorityLabels, priority)}</option>
        ))}
      </Select>
      <div className="md:col-span-2">
        <Textarea defaultValue={record?.summary ?? ""} disabled={disabled} hint={copy.summaryHint} idPrefix="manual-case" label={copy.summary} name="summary" />
      </div>
    </div>
  );
}

function PartyFields({
  disabled,
  rowId,
  onRemove
}: {
  disabled: boolean;
  rowId: number;
  onRemove: () => void;
}) {
  const prefix = `manual-case-party-${rowId}`;
  return (
    <div className="rounded-lg border border-kmt-border bg-kmt-canvas/60 p-4">
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_14rem]">
        <TextInput disabled={disabled} idPrefix={prefix} label={copy.partyName} name={`party-${rowId}-name`} />
        <Select defaultValue="OPPOSING_PARTY" disabled={disabled} idPrefix={prefix} label={copy.partyType} name={`party-${rowId}-partyType`}>
          {MANUAL_CASE_PARTY_TYPES.map((partyType) => (
            <option key={partyType} value={partyType}>{labelFrom(partyTypeLabels, partyType)}</option>
          ))}
        </Select>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        <Textarea disabled={disabled} idPrefix={prefix} label={copy.partyNotes} name={`party-${rowId}-notes`} />
        <Button disabled={disabled} onClick={onRemove} type="button" variant="ghost">{copy.removeParty}</Button>
      </div>
    </div>
  );
}

export function ManualCaseCreateForm({
  clients,
  lawyers,
  initialRequestToken,
  defaultClientId
}: {
  clients: ManualCaseClientOption[];
  lawyers: ManualCaseLawyerOption[];
  initialRequestToken: string;
  defaultClientId?: string;
}) {
  const router = useRouter();
  const [clientSearch, setClientSearch] = useState("");
  const [partyRows, setPartyRows] = useState([0]);
  const [requestToken, setRequestToken] = useState(initialRequestToken);
  const [lastPayload, setLastPayload] = useState<CreatePayload | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const nextPartyRow = useRef(1);
  const normalizedSearch = clientSearch.trim().toLocaleLowerCase("ar");
  const visibleClients = normalizedSearch
    ? clients.filter((client) => `${client.fullName} ${client.phone}`.toLocaleLowerCase("ar").includes(normalizedSearch))
    : clients;
  const unavailable = clients.length === 0 || lawyers.length === 0;

  async function submitCreate(payload: CreatePayload, token = requestToken) {
    setIsBusy(true);
    setFeedback({ tone: "info", title: copy.feedback.creating });
    try {
      const response = await fetch("/api/admin/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestToken: token, ...payload })
      });
      const envelope = await responseEnvelope<{ case: { id: string }; replayed: boolean }>(response);
      if (!response.ok || !envelope.data) {
        setFeedback(envelope.error?.code === "CASE_REFERENCE_CONFLICT" ? collisionFeedback() : failedFeedback());
        return;
      }
      setFeedback({
        tone: "success",
        title: envelope.data.replayed ? copy.feedback.replayed : copy.feedback.created
      });
      router.push(`/admin/cases/${envelope.data.case.id}`);
      router.refresh();
    } catch {
      setFeedback({ tone: "error", title: copy.feedback.network });
    } finally {
      setIsBusy(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = createPayloadFromForm(event.currentTarget, partyRows);
    const issue = createPayloadIssue(payload);
    if (issue) {
      setFeedback({ tone: "error", title: issue });
      return;
    }
    setLastPayload(payload);
    void submitCreate(payload);
  }

  function retryCollision() {
    if (!lastPayload) return;
    const nextToken = crypto.randomUUID();
    setRequestToken(nextToken);
    void submitCreate(lastPayload, nextToken);
  }

  function addParty() {
    const rowId = nextPartyRow.current;
    nextPartyRow.current += 1;
    setPartyRows((current) => [...current, rowId]);
  }

  return (
    <form className="space-y-5" noValidate onSubmit={submit}>
      <Card>
        <CardHeader>
          <CardTitle>{copy.createTitle}</CardTitle>
          <CardDescription>{copy.createDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <h2 className="text-base font-semibold text-kmt-ink">{copy.clientSection}</h2>
          <TextInput
            disabled={isBusy}
            idPrefix="manual-case"
            label={copy.clientSearch}
            onChange={(event) => setClientSearch(event.target.value)}
            placeholder={copy.clientSearchPlaceholder}
            type="search"
          />
          <div className="grid gap-4 md:grid-cols-2">
            <Select defaultValue={defaultClientId ?? ""} disabled={isBusy || clients.length === 0} idPrefix="manual-case" label={copy.client} name="clientId" required>
              <option value="">{copy.chooseClient}</option>
              {visibleClients.map((client) => (
                <option key={client.id} value={client.id}>{client.fullName} — {client.phone}</option>
              ))}
            </Select>
            <Select disabled={isBusy || lawyers.length === 0} idPrefix="manual-case" label={copy.assignedLawyer} name="assignedLawyerId" required>
              <option value="">{copy.chooseLawyer}</option>
              {lawyers.map((lawyer) => <option key={lawyer.id} value={lawyer.id}>{lawyer.name}</option>)}
            </Select>
          </div>
          {clients.length === 0 ? <StateBlock description={copy.validation.clientRequired} title={copy.noClients} tone="warning" /> : null}
          {lawyers.length === 0 ? <StateBlock description={copy.validation.lawyerRequired} title={copy.noLawyers} tone="warning" /> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{copy.caseSection}</CardTitle></CardHeader>
        <CardContent><CaseCoreFields disabled={isBusy} /></CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{copy.partiesSection}</CardTitle>
          <CardDescription>{copy.partiesDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {partyRows.map((rowId) => (
            <PartyFields
              disabled={isBusy}
              key={rowId}
              onRemove={() => setPartyRows((current) => current.filter((candidate) => candidate !== rowId))}
              rowId={rowId}
            />
          ))}
          <Button disabled={isBusy} onClick={addParty} type="button" variant="secondary">{copy.addParty}</Button>
        </CardContent>
      </Card>

      <FeedbackRegion feedback={feedback} isBusy={isBusy} onCollisionRetry={retryCollision} />
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <ButtonLink href="/admin/cases" variant="secondary">{copy.cancel}</ButtonLink>
        <Button disabled={unavailable} loading={isBusy} type="submit">{copy.create}</Button>
      </div>
    </form>
  );
}

function editPayloadFromForm(formElement: HTMLFormElement, updatedAt: string, canTransfer: boolean) {
  const form = new FormData(formElement);
  return {
    title: formText(form, "title"),
    caseType: formText(form, "caseType"),
    courtName: optionalFormText(form, "courtName"),
    externalCaseNumber: optionalFormText(form, "externalCaseNumber"),
    priority: formText(form, "priority"),
    summary: optionalFormText(form, "summary"),
    ...(canTransfer ? { assignedLawyerId: formText(form, "assignedLawyerId") } : {}),
    updatedAt
  };
}

export function ManualCaseEditForm({
  caseRecord,
  lawyers,
  canTransfer
}: {
  caseRecord: ManualCaseEditRecord;
  lawyers: ManualCaseLawyerOption[];
  canTransfer: boolean;
}) {
  const router = useRouter();
  const [updatedAt, setUpdatedAt] = useState(caseRecord.updatedAt);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = editPayloadFromForm(event.currentTarget, updatedAt, canTransfer);
    if (payload.title.length < 3 || payload.caseType.length < 2) {
      setFeedback({ tone: "error", title: copy.validation.required });
      return;
    }
    setIsBusy(true);
    setFeedback({ tone: "info", title: copy.feedback.updating });
    try {
      const response = await fetch(`/api/admin/cases/${caseRecord.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const envelope = await responseEnvelope<{ updatedAt: string }>(response);
      if (!response.ok || !envelope.data) {
        setFeedback(response.status === 409
          ? { tone: "warning", title: copy.feedback.stale }
          : failedFeedback());
        return;
      }
      setUpdatedAt(envelope.data.updatedAt);
      setFeedback({ tone: "success", title: copy.feedback.updated });
      router.refresh();
    } catch {
      setFeedback({ tone: "error", title: copy.feedback.network });
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{copy.editTitle}</CardTitle>
        <CardDescription>{copy.editDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" noValidate onSubmit={submit}>
          <CaseCoreFields disabled={isBusy} record={caseRecord} />
          {canTransfer ? (
            <Select defaultValue={caseRecord.assignedLawyerId} disabled={isBusy} idPrefix="manual-case-edit" label={copy.assignedLawyer} name="assignedLawyerId">
              {lawyers.map((lawyer) => <option key={lawyer.id} value={lawyer.id}>{lawyer.name}</option>)}
            </Select>
          ) : (
            <InlineFeedback description={copy.assignedOnly} title={caseRecord.assignedLawyerName} tone="info" />
          )}
          <FeedbackRegion feedback={feedback} isBusy={isBusy} />
          <div className="flex justify-end">
            <Button loading={isBusy} type="submit">{copy.save}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
