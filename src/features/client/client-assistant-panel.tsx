"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import { KmtBrandLogo } from "@/components/brand";
import { ClientPortalPanel, ClientPortalRow, clientPortalPrimaryActionClass, clientPortalSecondaryActionClass } from "@/components/layout";
import { Badge, Button, MaterialSymbol, Textarea } from "@/components/ui";
import {
  formatBytes,
  formatDate,
  formatDateTime,
  formatMoney
} from "@/lib/legal-format";
import { cn } from "@/lib/cn";
import { ClientTeamChatPanel } from "./client-team-chat-panel";
import {
  clientErrorMessage,
  getClientContent,
  type ClientContent,
  type ClientLocale
} from "@/content/client-content";

type AssistantAppointment = {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  status: string;
  mode: string;
  lawyer?: { name: string } | null;
  case?: { title: string; internalFileNumber: string } | null;
};

type AssistantCase = {
  id: string;
  internalFileNumber: string;
  title: string;
  status: string;
  priority: string;
  nextSessionAt: string | null;
  assignedLawyer?: { name: string } | null;
};

type AssistantSession = {
  id: string;
  courtName: string | null;
  sessionDate: string;
  decision: string | null;
  nextSessionDate: string | null;
  case: { title: string; internalFileNumber: string };
};

type AssistantDocument = {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  category: string;
  status: string;
  createdAt: string;
  case?: { title: string; internalFileNumber: string } | null;
};

type AssistantPayment = {
  id: string;
  invoiceNumber: string;
  amount: string;
  currency: string;
  status: string;
  issueDate: string;
  dueDate: string | null;
  paidAt: string | null;
  case?: { title: string; internalFileNumber: string } | null;
};

type AssistantResponse = {
  action?: string;
  message?: string;
  disclaimer?: string;
  appointments?: AssistantAppointment[];
  cases?: AssistantCase[];
  sessions?: AssistantSession[];
  documents?: AssistantDocument[];
  payments?: AssistantPayment[];
};

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
  tone?: "default" | "error";
  data?: AssistantResponse;
};

type ApiBody = {
  data?: AssistantResponse;
  error?: {
    code?: string;
  };
};

async function parseAssistantResponse(response: Response, locale: ClientLocale, copy: ClientContent) {
  const body = (await response.json().catch(() => ({}))) as ApiBody;
  if (!response.ok) {
    return { error: clientErrorMessage(locale, body.error?.code, copy.assistant.requestError) };
  }
  return { data: body.data };
}

export function ClientAssistantPanel({ locale }: { locale: ClientLocale }) {
  const copy = getClientContent(locale);
  const logEndRef = useRef<HTMLDivElement | null>(null);
  const [surface, setSurface] = useState<"assistant" | "team">("assistant");
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: "initial",
    role: "assistant",
    text: copy.assistant.intro
  }]);
  const [message, setMessage] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ block: "end" });
  }, [messages, isBusy]);

  function appendAssistantError(text: string) {
    setMessages((current) => [...current, { id: `assistant-error-${Date.now()}`, role: "assistant", text, tone: "error" }]);
  }

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isBusy) return;

    setMessage("");
    const userMessage: ChatMessage = { id: `user-${Date.now()}`, role: "user", text: trimmed };
    setMessages((current) => [...current, userMessage]);
    setIsBusy(true);

    try {
      const response = await fetch("/api/client/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale,
          message: trimmed
        })
      });
      const result = await parseAssistantResponse(response, locale, copy);
      if (result.error) {
        appendAssistantError(result.error);
        return;
      }
      const data = result.data ?? {};
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          text: data.message ?? copy.assistant.noData,
          data
        }
      ]);
    } catch {
      appendAssistantError(copy.assistant.networkError);
    } finally {
      setIsBusy(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sendMessage(message);
  }

  if (surface === "team") {
    return <ClientTeamChatPanel locale={locale} onBack={() => setSurface("assistant")} />;
  }

  return (
    <ClientPortalPanel description={copy.assistant.description} title={copy.assistant.title}>
      <div
        className="overflow-hidden rounded-lg border border-kmt-gold/20 bg-[linear-gradient(145deg,#17110a_0%,#0b0c0e_52%,#050505_100%)]"
        data-testid="client-assistant-shell"
      >
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 bg-black/25 px-4 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <KmtBrandLogo label={copy.assistant.assistantName} shape="circle" size="md" variant="mark" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{copy.assistant.assistantName}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-kmt-gold">{copy.assistant.status}</p>
            </div>
          </div>
          <p className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs leading-5 text-slate-300">{copy.assistant.scope}</p>
        </header>

        <div className="border-b border-white/10 bg-black/15 px-4 py-3">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {copy.assistant.quickActions.map((prompt) => (
              <Button
                key={prompt.message}
                className={cn(clientPortalSecondaryActionClass, "min-h-9 shrink-0 rounded-full border-kmt-gold/25 bg-white/[0.03] px-3 text-sm text-amber-100 hover:bg-kmt-gold hover:text-[#120d07]")}
                disabled={isBusy}
                size="sm"
                type="button"
                variant="secondary"
                onClick={() => sendMessage(prompt.message)}
              >
                <MaterialSymbol className="text-base" name={prompt.icon} />
                {prompt.label}
              </Button>
            ))}
            <Button
              className={cn(clientPortalSecondaryActionClass, "min-h-9 shrink-0 rounded-full border-kmt-gold/35 bg-kmt-gold/12 px-3 text-sm text-amber-100 hover:bg-kmt-gold hover:text-[#120d07]")}
              disabled={isBusy}
              size="sm"
              type="button"
              variant="secondary"
              onClick={() => setSurface("team")}
            >
              <MaterialSymbol className="text-base" name="forum" />
              {copy.assistant.talkToTeam}
            </Button>
          </div>
        </div>

        <div aria-busy={isBusy ? "true" : "false"} className="max-h-[36rem] space-y-4 overflow-y-auto px-4 py-5" data-testid="client-assistant-log" role="log">
          {messages.map((item) => (
            <ClientChatBubble copy={copy} item={item} key={item.id} locale={locale} />
          ))}
          {isBusy ? <TypingIndicator label={copy.assistant.typing} /> : null}
          <div ref={logEndRef} />
        </div>

        <form className="flex items-end gap-2 border-t border-white/10 bg-black/35 px-4 py-4" data-testid="client-assistant-composer" onSubmit={submit}>
          <div className="min-w-0 flex-1 [&_label]:sr-only">
            <Textarea
              className="min-h-12 resize-none rounded-2xl border-kmt-gold/25 bg-black/35 py-3 text-white placeholder:text-amber-100/45 focus:border-kmt-gold focus:ring-kmt-gold/25"
              label={copy.assistant.inputLabel}
              name="message"
              placeholder={copy.assistant.placeholder}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              required
            />
          </div>
          <Button
            aria-label={copy.assistant.send}
            className={cn(clientPortalPrimaryActionClass, "h-12 w-12 shrink-0 rounded-full px-0")}
            disabled={!message.trim()}
            loading={isBusy}
            type="submit"
          >
            <MaterialSymbol className="text-xl" name="send" />
            <span className="sr-only">{copy.assistant.send}</span>
          </Button>
        </form>
      </div>
    </ClientPortalPanel>
  );
}

function ClientChatBubble({ item, copy, locale }: { item: ChatMessage; copy: ClientContent; locale: ClientLocale }) {
  const isUser = item.role === "user";

  return (
    <div className={cn("flex items-end gap-2", isUser ? "justify-end" : "justify-start")}>
      {!isUser ? (
        item.tone === "error" ? (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-kmt-gold/25 bg-kmt-gold/10 text-kmt-gold">
            <MaterialSymbol className="text-lg" name="error" />
          </span>
        ) : (
          <KmtBrandLogo label="" shape="circle" size="sm" variant="mark" />
        )
      ) : null}
      <div
        className={cn(
          "max-w-[92%] break-words rounded-2xl px-4 py-3 text-sm leading-7 shadow-[0_16px_42px_-34px_rgba(0,0,0,0.95)]",
          isUser ? "rounded-ee-sm bg-kmt-gold text-[#120d07]" : "rounded-es-sm border border-white/10 bg-white/[0.05] text-slate-100",
          item.tone === "error" ? "border-red-300/35 bg-red-950/45 text-red-100" : undefined
        )}
        role={item.tone === "error" ? "alert" : undefined}
      >
        <p>{item.text}</p>
        {item.data?.disclaimer ? <p className="mt-2 border-t border-white/10 pt-2 text-xs text-amber-100">{item.data.disclaimer}</p> : null}
        <AssistantData copy={copy} locale={locale} response={item.data} />
      </div>
    </div>
  );
}

function TypingIndicator({ label }: { label: string }) {
  return (
    <div className="flex items-end gap-2 text-slate-300">
      <KmtBrandLogo label="" shape="circle" size="sm" variant="mark" />
      <div className="flex items-center gap-2 rounded-2xl rounded-es-sm border border-white/10 bg-white/[0.05] px-4 py-3 text-xs">
        <span>{label}</span>
        <span className="flex gap-1" aria-hidden="true">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-kmt-gold" />
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-kmt-gold [animation-delay:120ms]" />
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-kmt-gold [animation-delay:240ms]" />
        </span>
      </div>
    </div>
  );
}

function AssistantData({ response, copy, locale }: { response?: AssistantResponse; copy: ClientContent; locale: ClientLocale }) {
  if (!response) return null;

  return (
    <div className="mt-3 space-y-2">
      {response.appointments?.map((appointment) => <AppointmentCard copy={copy} key={appointment.id} locale={locale} appointment={appointment} />)}
      {response.sessions?.map((session) => <SessionCard copy={copy} key={session.id} locale={locale} session={session} />)}
      {response.cases?.map((legalCase) => <CaseCard copy={copy} key={legalCase.id} locale={locale} legalCase={legalCase} />)}
      {response.documents?.map((document) => <DocumentCard copy={copy} key={document.id} locale={locale} document={document} />)}
      {response.payments?.map((payment) => <PaymentCard copy={copy} key={payment.id} locale={locale} payment={payment} />)}
    </div>
  );
}

function AppointmentCard({ appointment, copy, locale }: { appointment: AssistantAppointment; copy: ClientContent; locale: ClientLocale }) {
  return (
    <ClientPortalRow>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold text-white">{appointment.title}</p>
        <Badge tone="pending">{copy.statuses.appointment[appointment.status as keyof typeof copy.statuses.appointment] ?? copy.common.unknown}</Badge>
      </div>
      <p className="mt-1 text-sm text-slate-300">{formatDateTime(appointment.startsAt, locale)}</p>
      <p className="mt-1 text-xs text-slate-400">
        {copy.statuses.mode[appointment.mode as keyof typeof copy.statuses.mode] ?? copy.common.unknown} · {appointment.lawyer?.name ?? copy.common.unknown}
      </p>
      {appointment.case ? <p className="mt-1 text-xs text-amber-100">{appointment.case.internalFileNumber} · {appointment.case.title}</p> : null}
    </ClientPortalRow>
  );
}

function SessionCard({ session, copy, locale }: { session: AssistantSession; copy: ClientContent; locale: ClientLocale }) {
  return (
    <ClientPortalRow>
      <p className="font-semibold text-white">{session.case.internalFileNumber} · {session.case.title}</p>
      <p className="mt-1 text-sm text-slate-300">{formatDateTime(session.sessionDate, locale)}</p>
      <p className="mt-1 text-xs text-slate-400">{session.courtName ?? copy.common.courtUnknown}</p>
      {session.nextSessionDate ? <p className="mt-1 text-xs text-amber-100">{copy.common.nextSession}: {formatDateTime(session.nextSessionDate, locale)}</p> : null}
      {session.decision ? <p className="mt-1 text-xs text-slate-300">{copy.common.sessionDecision}: {session.decision}</p> : null}
    </ClientPortalRow>
  );
}

function CaseCard({ legalCase, copy, locale }: { legalCase: AssistantCase; copy: ClientContent; locale: ClientLocale }) {
  return (
    <ClientPortalRow>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold text-white">{legalCase.internalFileNumber} · {legalCase.title}</p>
        <Badge tone="active">{copy.statuses.case[legalCase.status as keyof typeof copy.statuses.case] ?? copy.common.unknown}</Badge>
      </div>
      <p className="mt-1 text-xs text-slate-400">
        {copy.assistant.priority}: {copy.statuses.priority[legalCase.priority as keyof typeof copy.statuses.priority] ?? copy.common.unknown} · {copy.assistant.lawyer}: {legalCase.assignedLawyer?.name ?? copy.common.unknown}
      </p>
      <p className="mt-1 text-xs text-amber-100">{copy.assistant.nextSession}: {formatDateTime(legalCase.nextSessionAt, locale)}</p>
    </ClientPortalRow>
  );
}

function DocumentCard({ document, copy, locale }: { document: AssistantDocument; copy: ClientContent; locale: ClientLocale }) {
  return (
    <ClientPortalRow>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold text-white">{document.fileName}</p>
        <Badge tone="pending">{copy.statuses.document[document.status as keyof typeof copy.statuses.document] ?? copy.common.unknown}</Badge>
      </div>
      <p className="mt-1 text-xs text-slate-400">
        {copy.statuses.documentCategory[document.category as keyof typeof copy.statuses.documentCategory] ?? copy.common.unknown} · {formatBytes(document.fileSize)} · {formatDate(document.createdAt, locale)}
      </p>
      {document.case ? <p className="mt-1 text-xs text-amber-100">{document.case.internalFileNumber} · {document.case.title}</p> : null}
    </ClientPortalRow>
  );
}

function PaymentCard({ payment, copy, locale }: { payment: AssistantPayment; copy: ClientContent; locale: ClientLocale }) {
  return (
    <ClientPortalRow>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold text-white">{payment.invoiceNumber}</p>
        <Badge tone="pending">{copy.statuses.payment[payment.status as keyof typeof copy.statuses.payment] ?? copy.common.unknown}</Badge>
      </div>
      <p className="mt-1 text-sm text-slate-300">{formatMoney(payment.amount, payment.currency, locale)}</p>
      <p className="mt-1 text-xs text-slate-400">
        {copy.common.issueDate}: {formatDate(payment.issueDate, locale)} · {copy.common.dueDate}: {formatDate(payment.dueDate, locale)}
      </p>
      {payment.case ? <p className="mt-1 text-xs text-amber-100">{payment.case.internalFileNumber} · {payment.case.title}</p> : null}
    </ClientPortalRow>
  );
}
