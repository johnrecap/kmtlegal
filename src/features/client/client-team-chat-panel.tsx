"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { KmtBrandLogo } from "@/components/brand";
import { ClientPortalPanel, clientPortalPrimaryActionClass, clientPortalSecondaryActionClass } from "@/components/layout";
import { Badge, Button, MaterialSymbol, Textarea } from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/legal-format";
import {
  clientErrorMessage,
  getClientContent,
  type ClientContent,
  type ClientLocale
} from "@/content/client-content";

type TeamMessage = {
  id: string;
  senderType: "CLIENT" | "STAFF" | "SYSTEM";
  body: string;
  createdAt: string;
  senderUser: { id: string; name: string } | null;
};

type TeamThread = {
  id: string;
  status: string;
  subject: string | null;
  lastMessageAt: string;
  messages: TeamMessage[];
};

type ListBody = {
  data?: {
    items: TeamThread[];
  };
  error?: { code?: string };
};

type DetailBody = {
  data?: TeamThread;
  error?: { code?: string };
};

async function readJson<T>(
  response: Response,
  locale: ClientLocale,
  copy: ClientContent
): Promise<T> {
  const payload = (await response.json().catch(() => null)) as T & { error?: { code?: string } };
  if (!response.ok) {
    throw new Error(clientErrorMessage(locale, payload?.error?.code, copy.teamChat.requestError));
  }
  return payload;
}

function statusTone(status?: string) {
  if (status === "WAITING_STAFF") {
    return "pending" as const;
  }
  if (status === "OPEN" || status === "WAITING_CLIENT") {
    return "active" as const;
  }
  if (status === "CLOSED" || status === "ARCHIVED") {
    return "closed" as const;
  }
  return "neutral" as const;
}

export function ClientTeamChatPanel({ onBack, locale }: { onBack: () => void; locale: ClientLocale }) {
  const copy = getClientContent(locale);
  const logEndRef = useRef<HTMLDivElement | null>(null);
  const [thread, setThread] = useState<TeamThread | null>(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadVersion, setReloadVersion] = useState(0);
  const mutationVersion = useRef(0);
  const mutationPending = useRef(false);
  const contextVersion = useRef(0);
  const mounted = useRef(true);
  const draftVersion = useRef(0);
  const isClosed = thread?.status === "CLOSED" || thread?.status === "ARCHIVED";
  const messages = useMemo(() => thread?.messages ?? [], [thread?.messages]);

  useEffect(() => {
    contextVersion.current += 1;
    return () => { contextVersion.current += 1; };
  }, [locale]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      mutationVersion.current += 1;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const versionAtStart = mutationVersion.current;
      setIsLoading(true);
      try {
        const response = await fetch("/api/client/messages", { cache: "no-store" });
        const payload = await readJson<ListBody>(response, locale, copy);
        const latest = payload.data?.items?.[0];
        if (!latest) {
          if (
            mounted &&
            !mutationPending.current &&
            versionAtStart === mutationVersion.current
          ) {
            setThread(null);
          }
          return;
        }
        const detailResponse = await fetch(`/api/client/messages/${latest.id}`, { cache: "no-store" });
        const detailPayload = await readJson<DetailBody>(detailResponse, locale, copy);
        if (
          mounted &&
          !mutationPending.current &&
          versionAtStart === mutationVersion.current
        ) {
          setThread(detailPayload.data ?? null);
        }
      } catch (loadError) {
        if (
          mounted &&
          !mutationPending.current &&
          versionAtStart === mutationVersion.current
        ) {
          setError(loadError instanceof Error ? loadError.message : copy.teamChat.networkError);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [copy, locale, reloadVersion]);

  useEffect(() => {
    if (!thread?.id || isClosed) {
      return;
    }
    let mounted = true;
    let pollInFlight = false;
    const timer = window.setInterval(async () => {
      if (pollInFlight || mutationPending.current) return;
      pollInFlight = true;
      const versionAtStart = mutationVersion.current;
      try {
        const response = await fetch(`/api/client/messages/${thread.id}`, { cache: "no-store" });
        const payload = await readJson<DetailBody>(response, locale, copy);
        if (
          mounted &&
          payload.data &&
          !mutationPending.current &&
          versionAtStart === mutationVersion.current
        ) {
          setThread(payload.data);
        }
      } catch {
        if (
          mounted &&
          !mutationPending.current &&
          versionAtStart === mutationVersion.current
        ) {
          setError(copy.teamChat.refreshError);
        }
      } finally {
        pollInFlight = false;
      }
    }, 5000);
    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, [copy, isClosed, locale, thread?.id]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ block: "end" });
  }, [messages, isSending]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || mutationPending.current || isSending) {
      return;
    }

    const operationVersion = ++mutationVersion.current;
    const sentDraftVersion = draftVersion.current;
    const operationContext = contextVersion.current;
    mutationPending.current = true;
    setIsSending(true);
    setError(null);
    try {
      const endpoint = thread?.id && !isClosed ? `/api/client/messages/${thread.id}/messages` : "/api/client/messages";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(thread?.id && !isClosed ? { message: trimmed } : { message: trimmed, subject: "Client team chat" })
      });
      const payload = await readJson<DetailBody>(response, locale, copy);
      if (mounted.current && operationContext === contextVersion.current && operationVersion === mutationVersion.current) {
        setThread(payload.data ?? null);
      }
      if (mounted.current && draftVersion.current === sentDraftVersion) {
        setMessage("");
      }
    } catch (sendError) {
      if (mounted.current && operationContext === contextVersion.current) {
        setError(sendError instanceof Error ? sendError.message : copy.teamChat.networkError);
      }
    } finally {
      mutationPending.current = false;
      mutationVersion.current += 1;
      if (mounted.current) {
        setIsSending(false);
        if (operationContext !== contextVersion.current) {
          setReloadVersion((version) => version + 1);
        }
      }
    }
  }

  return (
    <ClientPortalPanel description={copy.teamChat.description} title={copy.teamChat.title}>
      <div className="overflow-hidden rounded-[1.35rem] border border-kmt-gold/35 bg-[linear-gradient(145deg,#17110a_0%,#090b0d_52%,#050505_100%)]">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 bg-black/25 px-5 py-5">
          <div className="flex min-w-0 items-center gap-3">
            <KmtBrandLogo label={copy.teamChat.assistantName} shape="circle" size="md" variant="mark" />
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-white">{copy.teamChat.assistantName}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-kmt-gold">{copy.teamChat.status}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {thread ? <Badge tone={statusTone(thread.status)}>{copy.statuses.conversation[thread.status as keyof typeof copy.statuses.conversation] ?? copy.common.unknown}</Badge> : null}
            <Button className={cn(clientPortalSecondaryActionClass, "min-h-9 rounded-full border-kmt-gold/25 px-3 text-sm text-amber-100")} size="sm" type="button" variant="secondary" onClick={onBack}>
              <MaterialSymbol className="text-base" name="arrow_back" />
              {copy.teamChat.back}
            </Button>
          </div>
        </header>

        <div className="border-b border-white/10 bg-black/15 px-5 py-3 text-sm leading-7 text-slate-300">
          {isClosed ? copy.teamChat.closed : copy.teamChat.scope}
        </div>

        <div aria-busy={isLoading || isSending ? "true" : "false"} className="max-h-[34rem] min-h-[26rem] space-y-4 overflow-y-auto px-5 py-5" role="log">
          {isLoading ? (
            <p className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-slate-300">{copy.teamChat.loading}</p>
          ) : messages.length ? (
            messages.map((item) => <TeamBubble copy={copy} key={item.id} locale={locale} item={item} />)
          ) : (
            <p className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm leading-7 text-slate-300">{copy.teamChat.empty}</p>
          )}
          {isSending ? <TeamTyping /> : null}
          <div ref={logEndRef} />
        </div>

        <form className="border-t border-white/10 bg-black/35 px-5 py-5" onSubmit={submit}>
          {error ? <p className="mb-3 rounded border border-red-300/30 bg-red-950/45 px-3 py-2 text-sm text-red-100">{error}</p> : null}
          <div className="flex min-w-0 items-end gap-3">
            <div className="min-w-0 flex-1 [&_label]:sr-only">
              <Textarea
                className="min-h-14 resize-none rounded-2xl border-kmt-gold/35 bg-black/35 py-3 text-white placeholder:text-amber-100/45 focus:border-kmt-gold focus:ring-kmt-gold/25"
                label={copy.teamChat.inputLabel}
                name="teamMessage"
                placeholder={copy.teamChat.placeholder}
                value={message}
                onChange={(event) => {
                  draftVersion.current += 1;
                  setMessage(event.target.value);
                }}
                maxLength={2000}
                required
              />
            </div>
            <Button
              aria-label={copy.teamChat.send}
              className={cn(clientPortalPrimaryActionClass, "h-14 w-14 shrink-0 rounded-full px-0")}
              disabled={!message.trim() || isLoading || isSending}
              loading={isSending}
              type="submit"
            >
              <MaterialSymbol className="text-xl" name="send" />
              <span className="sr-only">{copy.teamChat.send}</span>
            </Button>
          </div>
          <p className="mt-3 flex items-center justify-center gap-2 text-center text-xs text-amber-100/70">
            <MaterialSymbol className="text-base" name="lock" />
            {copy.teamChat.privacy}
          </p>
        </form>
      </div>
    </ClientPortalPanel>
  );
}

function TeamBubble({ item, copy, locale }: { item: TeamMessage; copy: ClientContent; locale: ClientLocale }) {
  const isClient = item.senderType === "CLIENT";
  return (
    <div className={cn("flex items-end gap-3", isClient ? "justify-end" : "justify-start")}>
      {!isClient ? <KmtBrandLogo label="" shape="circle" size="sm" variant="mark" /> : null}
      <div
        className={cn(
          "max-w-[86%] break-words rounded-2xl px-4 py-3 text-sm leading-7 shadow-[0_16px_42px_-34px_rgba(0,0,0,0.95)]",
          isClient ? "rounded-ee-sm bg-kmt-gold text-[#120d07]" : "rounded-es-sm border border-white/10 bg-white/[0.05] text-slate-100"
        )}
      >
        <p className="whitespace-pre-wrap">{item.body}</p>
        <p className={cn("mt-2 text-xs", isClient ? "text-black/60" : "text-slate-400")}>
          {item.senderUser?.name ?? (isClient ? copy.teamChat.you : copy.teamChat.team)} · {formatDateTime(item.createdAt, locale)}
        </p>
      </div>
    </div>
  );
}

function TeamTyping() {
  return (
    <div className="flex justify-end">
      <div className="flex items-center gap-1 rounded-2xl bg-kmt-gold px-4 py-3" aria-hidden="true">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white [animation-delay:120ms]" />
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white [animation-delay:240ms]" />
      </div>
    </div>
  );
}
