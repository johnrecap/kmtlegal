"use client";

import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { AdminDialog } from "@/components/admin/admin-dialog";
import { Badge, Button, MaterialSymbol } from "@/components/ui";
import { cn } from "@/lib/cn";
import { conversationStatusLabels, formatDateTime, labelFrom } from "@/lib/legal-format";
import { readAdminApiResponse } from "@/features/admin/shared/admin-api-error";

type ConversationMessage = {
  id: string;
  senderType: "CLIENT" | "STAFF" | "SYSTEM";
  body: string;
  createdAt: string | Date;
  senderUser: { id: string; name: string } | null;
};

type ConversationThread = {
  id: string;
  status: string;
  subject: string | null;
  client: { id: string; fullName: string; phone: string; email: string | null };
  assignedTo: { id: string; name: string; email: string } | null;
  lastMessageAt: string | Date;
  closedAt: string | Date | null;
  messages: ConversationMessage[];
};

type ConversationAssignee = {
  id: string;
  name: string;
  email: string;
  role: { name: string };
};

type ThreadUpdate = { status?: string; assignedToId?: string | null };

function statusTone(status: string) {
  if (status === "WAITING_STAFF") return "pending" as const;
  if (status === "WAITING_CLIENT" || status === "OPEN") return "active" as const;
  if (status === "CLOSED" || status === "ARCHIVED") return "closed" as const;
  return "neutral" as const;
}

export function AdminMessageThreadPanel({
  initialThread,
  assignees,
  canAssign,
  canManage,
  canReply
}: {
  initialThread: ConversationThread;
  assignees: ConversationAssignee[];
  canAssign: boolean;
  canManage: boolean;
  canReply: boolean;
}) {
  const [thread, setThread] = useState(initialThread);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pollError, setPollError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const [draftStatus, setDraftStatus] = useState(initialThread.status);
  const [draftAssigneeId, setDraftAssigneeId] = useState(initialThread.assignedTo?.id ?? "");
  const [pendingManagementUpdate, setPendingManagementUpdate] = useState<ThreadUpdate | null>(null);
  const mutationVersion = useRef(0);
  const mutationPending = useRef(false);
  const mounted = useRef(true);
  const draftVersion = useRef(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const initializedScrollRef = useRef(false);
  const knownLatestMessageIdRef = useRef<string | null>(initialThread.messages.at(-1)?.id ?? null);
  const sentMessageIdRef = useRef<string | null>(null);
  const isClosed = thread.status === "CLOSED" || thread.status === "ARCHIVED";
  const managementDirty = draftStatus !== thread.status || draftAssigneeId !== (thread.assignedTo?.id ?? "");

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      mutationVersion.current += 1;
    };
  }, []);

  useEffect(() => {
    let disposed = false;
    let timer: number | undefined;
    let controller: AbortController | null = null;
    let failureCount = 0;

    const schedule = (delay: number) => {
      window.clearTimeout(timer);
      if (!disposed) timer = window.setTimeout(poll, delay);
    };

    const poll = async () => {
      if (disposed || controller) return;
      if (document.hidden || !navigator.onLine || mutationPending.current) {
        schedule(5000);
        return;
      }

      controller = new AbortController();
      const versionAtStart = mutationVersion.current;
      try {
        const response = await fetch(`/api/admin/messages/${thread.id}`, { cache: "no-store", signal: controller.signal });
        const data = await readAdminApiResponse<ConversationThread>(response);
        failureCount = 0;
        setPollError(null);
        if (!disposed && !mutationPending.current && versionAtStart === mutationVersion.current) setThread(data);
      } catch (pollFailure) {
        if (controller.signal.aborted || disposed) return;
        failureCount += 1;
        setPollError(pollFailure instanceof Error ? pollFailure.message : "تعذر تحديث المحادثة تلقائيًا.");
      } finally {
        controller = null;
        schedule(Math.min(30000, 5000 * 2 ** Math.min(failureCount, 3)));
      }
    };

    const resume = () => {
      if (!document.hidden && navigator.onLine) schedule(0);
    };
    document.addEventListener("visibilitychange", resume);
    window.addEventListener("online", resume);
    schedule(5000);
    return () => {
      disposed = true;
      window.clearTimeout(timer);
      controller?.abort();
      document.removeEventListener("visibilitychange", resume);
      window.removeEventListener("online", resume);
    };
  }, [thread.id]);

  const messages = useMemo(() => thread.messages ?? [], [thread.messages]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const latest = messages.at(-1)?.id ?? null;

    if (!initializedScrollRef.current) {
      container.scrollTop = container.scrollHeight;
      initializedScrollRef.current = true;
      knownLatestMessageIdRef.current = latest;
      return;
    }

    if (latest && latest !== knownLatestMessageIdRef.current) {
      if (sentMessageIdRef.current === latest || isNearBottomRef.current) {
        requestAnimationFrame(() => {
          const target = container.querySelector<HTMLElement>(`[data-message-id="${latest}"]`);
          target?.scrollIntoView({ block: "end", behavior: "smooth" });
        });
        sentMessageIdRef.current = null;
        setHasNewMessages(false);
      } else {
        setHasNewMessages(true);
      }
      knownLatestMessageIdRef.current = latest;
    }
  }, [messages]);

  function scrollToLatest() {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
    isNearBottomRef.current = true;
    setHasNewMessages(false);
  }

  async function sendReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || mutationPending.current || isSending || isUpdating || !canReply || isClosed) return;

    const operationVersion = ++mutationVersion.current;
    const sentDraftVersion = draftVersion.current;
    mutationPending.current = true;
    setIsSending(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/messages/${thread.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed })
      });
      const data = await readAdminApiResponse<ConversationThread>(response);
      sentMessageIdRef.current = data.messages.at(-1)?.id ?? null;
      if (mounted.current && operationVersion === mutationVersion.current) setThread(data);
      if (mounted.current && draftVersion.current === sentDraftVersion) setMessage("");
    } catch (replyError) {
      if (mounted.current) setError(replyError instanceof Error ? replyError.message : "تعذر إرسال الرد.");
    } finally {
      mutationPending.current = false;
      mutationVersion.current += 1;
      if (mounted.current) setIsSending(false);
    }
  }

  async function updateThread(body: ThreadUpdate) {
    if (mutationPending.current || isSending || isUpdating) return false;
    const operationVersion = ++mutationVersion.current;
    mutationPending.current = true;
    setIsUpdating(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/messages/${thread.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await readAdminApiResponse<ConversationThread>(response);
      if (mounted.current && operationVersion === mutationVersion.current) {
        setThread(data);
        setDraftStatus(data.status);
        setDraftAssigneeId(data.assignedTo?.id ?? "");
      }
      return true;
    } catch (updateError) {
      if (mounted.current) setError(updateError instanceof Error ? updateError.message : "تعذر تحديث المحادثة.");
      return false;
    } finally {
      mutationPending.current = false;
      mutationVersion.current += 1;
      if (mounted.current) setIsUpdating(false);
    }
  }

  function saveManagementDraft() {
    if (!managementDirty) return;
    const body: ThreadUpdate = {};
    if (canAssign && draftAssigneeId !== (thread.assignedTo?.id ?? "")) body.assignedToId = draftAssigneeId || null;
    if (canManage && draftStatus !== thread.status) body.status = draftStatus;
    if (body.status === "CLOSED" || body.status === "ARCHIVED") {
      setPendingManagementUpdate(body);
      return;
    }
    void updateThread(body);
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <section className="min-w-0 overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-primary">محادثة مباشرة</p>
            <h2 className="break-words text-xl font-semibold text-foreground">{thread.client.fullName}</h2>
            <p className="mt-1 break-words text-sm text-muted-foreground">{thread.subject ?? "محادثة مع فريق المكتب"}</p>
          </div>
          <Badge tone={statusTone(thread.status)}>{labelFrom(conversationStatusLabels, thread.status)}</Badge>
        </div>

        <div
          ref={scrollContainerRef}
          className="relative max-h-[36rem] min-h-[28rem] space-y-4 overflow-y-auto bg-background/70 p-4"
          onScroll={(event) => {
            const target = event.currentTarget;
            isNearBottomRef.current = target.scrollHeight - target.scrollTop - target.clientHeight < 96;
            if (isNearBottomRef.current) setHasNewMessages(false);
          }}
        >
          {messages.length ? messages.map((item) => {
            const isStaff = item.senderType === "STAFF";
            return (
              <div key={item.id} data-message-id={item.id} className={cn("flex gap-3", isStaff ? "justify-end" : "justify-start")}>
                {!isStaff ? <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-surface text-primary"><MaterialSymbol className="text-[19px]" name="person" /></div> : null}
                <div className={cn("max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-7 shadow-sm", isStaff ? "rounded-br-md bg-surface-strong text-surface-strong-foreground" : "rounded-bl-md border border-border bg-surface text-foreground")}>
                  <p className="whitespace-pre-wrap break-words">{item.body}</p>
                  <p className={cn("mt-2 text-xs", isStaff ? "text-surface-strong-foreground/70" : "text-muted-foreground")}>{item.senderUser?.name ?? (isStaff ? "الفريق" : thread.client.fullName)} · {formatDateTime(item.createdAt)}</p>
                </div>
                {isStaff ? <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"><MaterialSymbol className="text-[19px]" name="support_agent" /></div> : null}
              </div>
            );
          }) : <div className="flex min-h-60 items-center justify-center rounded-lg border border-dashed border-border bg-surface text-sm text-muted-foreground">لا توجد رسائل في هذه المحادثة بعد.</div>}
          {hasNewMessages ? <Button className="sticky bottom-2 mx-auto flex" onClick={scrollToLatest} size="sm" type="button">رسائل جديدة</Button> : null}
        </div>

        <form className="border-t border-border bg-surface p-4" onSubmit={sendReply}>
          {error ? <p id="admin-reply-error" className="mb-3 rounded border border-danger-border bg-danger-surface px-3 py-2 text-sm text-danger" role="alert">{error}</p> : null}
          {pollError ? <p className="mb-3 text-sm text-warning" role="status">التحديث التلقائي متوقف مؤقتًا: {pollError}</p> : null}
          <label className="mb-2 block text-sm font-semibold text-foreground" htmlFor="admin-message-reply">رد فريق المكتب</label>
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row">
            <textarea
              id="admin-message-reply"
              aria-describedby={error ? "admin-reply-error" : undefined}
              aria-invalid={Boolean(error)}
              className="min-h-24 min-w-0 flex-1 resize-y rounded border border-input bg-surface px-3 py-2 text-sm leading-6 text-foreground outline-none transition focus:border-primary motion-reduce:transition-none"
              value={message}
              onChange={(event) => { draftVersion.current += 1; setMessage(event.target.value); }}
              placeholder={isClosed ? "المحادثة مغلقة." : "اكتب رد الفريق للعميل..."}
              disabled={!canReply || isClosed || isSending || isUpdating}
              maxLength={2000}
            />
            <Button className="self-end" type="submit" loading={isSending} disabled={!message.trim() || !canReply || isClosed || isSending || isUpdating}>إرسال</Button>
          </div>
        </form>
      </section>

      <aside className="space-y-4">
        <div className="rounded-lg border border-border bg-surface p-4 shadow-sm">
          <h3 className="text-base font-semibold text-foreground">بيانات العميل</h3>
          <dl className="mt-4 space-y-3 text-sm">
            <div><dt className="font-semibold text-muted-foreground">الهاتف</dt><dd className="mt-1 text-foreground" dir="ltr"><bdi>{thread.client.phone}</bdi></dd></div>
            <div><dt className="font-semibold text-muted-foreground">البريد</dt><dd className="mt-1 break-words text-foreground" dir="ltr"><bdi>{thread.client.email ?? "غير محدد"}</bdi></dd></div>
            <div><dt className="font-semibold text-muted-foreground">آخر رسالة</dt><dd className="mt-1 text-foreground">{formatDateTime(thread.lastMessageAt)}</dd></div>
          </dl>
        </div>

        <div className="rounded-lg border border-border bg-surface p-4 shadow-sm">
          <h3 className="text-base font-semibold text-foreground">إدارة المحادثة</h3>
          <div className="mt-4 space-y-4">
            <label className="block text-sm font-semibold text-muted-foreground">المسؤول
              <select className="mt-2 min-h-11 w-full rounded border border-input bg-surface px-3 text-foreground outline-none focus:border-primary" value={draftAssigneeId} disabled={!canAssign || isUpdating || isSending} onChange={(event) => setDraftAssigneeId(event.target.value)}>
                <option value="">غير معين</option>{assignees.map((assignee) => <option key={assignee.id} value={assignee.id}>{assignee.name} - {assignee.role.name}</option>)}
              </select>
            </label>
            <label className="block text-sm font-semibold text-muted-foreground">الحالة
              <select className="mt-2 min-h-11 w-full rounded border border-input bg-surface px-3 text-foreground outline-none focus:border-primary" value={draftStatus} disabled={!canManage || isUpdating || isSending} onChange={(event) => setDraftStatus(event.target.value)}>
                {Object.entries(conversationStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <Button className="w-full" disabled={!managementDirty || isUpdating || isSending} loading={isUpdating} onClick={saveManagementDraft} type="button" variant="secondary">حفظ التغييرات</Button>
            {managementDirty ? <p className="text-xs text-warning" role="status">لديك تغييرات غير محفوظة.</p> : null}
          </div>
        </div>
      </aside>

      <AdminDialog
        variant="destructive"
        open={Boolean(pendingManagementUpdate)}
        onOpenChange={(open) => { if (!open) setPendingManagementUpdate(null); }}
        title={pendingManagementUpdate?.status === "ARCHIVED" ? "تأكيد أرشفة المحادثة" : "تأكيد إغلاق المحادثة"}
        description="لن يتمكن الفريق أو العميل من إضافة ردود جديدة حتى إعادة فتح المحادثة."
        confirmLabel={pendingManagementUpdate?.status === "ARCHIVED" ? "أرشفة المحادثة" : "إغلاق المحادثة"}
        confirmBusy={isUpdating}
        onConfirm={() => {
          const body = pendingManagementUpdate;
          if (!body) return;
          setPendingManagementUpdate(null);
          void updateThread(body);
        }}
      />
    </div>
  );
}
