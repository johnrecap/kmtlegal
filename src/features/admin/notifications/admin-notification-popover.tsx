"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge, Button, MaterialSymbol, StateBlock, buttonClasses } from "@/components/ui";
import { formatDateTime } from "@/lib/legal-format";
import { plan35NotificationUiCopy as copy } from "@/lib/ui-copy";
import type {
  GenericNotificationCenterItem,
  NotificationCenterItem,
  NotificationCenterSnapshot
} from "@/server/admin/notification-service";

type SnapshotResponse = { data?: NotificationCenterSnapshot };

function NotificationItemView({
  item,
  busyId,
  onMarkRead
}: {
  item: NotificationCenterItem;
  busyId: string | null;
  onMarkRead: (item: GenericNotificationCenterItem) => void;
}) {
  const isGeneric = item.kind === "generic";
  const title = isGeneric ? item.title : item.applicantDisplayName;
  const description = isGeneric ? item.body : item.reference;

  return (
    <li className="rounded border border-kmt-border bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {item.href ? (
            <Link className="break-words font-semibold text-kmt-navy hover:underline" dir="auto" href={item.href}>
              {title}
            </Link>
          ) : (
            <p className="break-words font-semibold text-kmt-ink" dir="auto">{title}</p>
          )}
          <p className="mt-1 break-words text-sm leading-6 text-kmt-muted" dir="auto">{description}</p>
          <p className="mt-2 text-xs text-kmt-muted">{formatDateTime(new Date(item.createdAt))}</p>
          {item.kind === "consultation-review" && item.startsAt ? (
            <p className="mt-1 text-xs text-kmt-muted">{formatDateTime(new Date(item.startsAt))}</p>
          ) : null}
        </div>
        {isGeneric && !item.readAt ? <Badge tone="pending">{copy.unreadGeneric}</Badge> : null}
      </div>
      {isGeneric && !item.readAt ? (
        <Button
          className="mt-3"
          disabled={busyId !== null}
          loading={busyId === item.id}
          onClick={() => onMarkRead(item)}
          size="sm"
          type="button"
          variant="ghost"
        >
          {copy.markRead}
        </Button>
      ) : null}
    </li>
  );
}

function NotificationList({
  items,
  busyId,
  onMarkRead
}: {
  items: NotificationCenterItem[];
  busyId: string | null;
  onMarkRead: (item: GenericNotificationCenterItem) => void;
}) {
  if (!items.length) {
    return <StateBlock description={copy.noAttention} title={copy.empty} tone="empty" />;
  }
  return (
    <ul className="space-y-2">
      {items.map((item) => <NotificationItemView busyId={busyId} item={item} key={`${item.kind}:${item.id}`} onMarkRead={onMarkRead} />)}
    </ul>
  );
}

function useNotificationRead(initialSnapshot: NotificationCenterSnapshot) {
  const [items, setItems] = useState(initialSnapshot.items);
  const [attentionCount, setAttentionCount] = useState(initialSnapshot.attentionCount);
  const [genericUnreadCount, setGenericUnreadCount] = useState(initialSnapshot.genericUnreadCount);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [retryItem, setRetryItem] = useState<GenericNotificationCenterItem | null>(null);

  async function markRead(item: GenericNotificationCenterItem) {
    setBusyId(item.id);
    setFeedback(null);
    setRetryItem(null);
    try {
      const response = await fetch(`/api/admin/notifications/${item.id}/read`, { method: "POST" });
      if (!response.ok) {
        setFeedback(copy.markReadFailed);
        setRetryItem(item);
        return;
      }
      setItems((current) => current.map((entry) =>
        entry.kind === "generic" && entry.id === item.id
          ? { ...entry, readAt: new Date().toISOString() }
          : entry
      ));
      setAttentionCount((current) => Math.max(0, current - 1));
      setGenericUnreadCount((current) => Math.max(0, current - 1));
      setFeedback(copy.markedRead);
    } catch {
      setFeedback(copy.markReadFailed);
      setRetryItem(item);
    } finally {
      setBusyId(null);
    }
  }

  return {
    items,
    setItems,
    attentionCount,
    setAttentionCount,
    genericUnreadCount,
    setGenericUnreadCount,
    busyId,
    feedback,
    retryItem,
    markRead
  };
}

export function AdminNotificationPopover({
  initialSnapshot,
  initialLoadFailed = false
}: {
  initialSnapshot: NotificationCenterSnapshot;
  initialLoadFailed?: boolean;
}) {
  const state = useNotificationRead(initialSnapshot);
  const [loadFailed, setLoadFailed] = useState(initialLoadFailed);

  async function reloadPreview() {
    try {
      const response = await fetch("/api/admin/notifications?limit=5", { headers: { Accept: "application/json" } });
      if (!response.ok) return;
      const body = (await response.json().catch(() => ({}))) as SnapshotResponse;
      if (!body.data) return;
      state.setItems(body.data.items);
      state.setAttentionCount(body.data.attentionCount);
      state.setGenericUnreadCount(body.data.genericUnreadCount);
      setLoadFailed(false);
    } catch {
      setLoadFailed(true);
    }
  }

  return (
    <details className="relative">
      <summary
        aria-label={copy.bellLabel}
        className={buttonClasses({
          variant: state.attentionCount ? "secondary" : "ghost",
          size: "sm",
          className: "min-w-9 list-none gap-2 px-2 sm:px-3 [&::-webkit-details-marker]:hidden"
        })}
      >
        <MaterialSymbol className="text-[20px]" name="notifications" />
        {state.attentionCount ? <Badge tone="pending">{state.attentionCount}</Badge> : null}
      </summary>
      <div className="absolute left-0 z-30 mt-2 w-[min(24rem,calc(100vw-2rem))] rounded border border-kmt-border bg-kmt-canvas p-3 text-sm shadow-xl">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold text-kmt-ink">{copy.popoverTitle}</p>
            <p className="mt-1 text-xs text-kmt-muted">
              {state.attentionCount ? `${state.attentionCount} ${copy.attentionSummary}` : copy.noAttention}
            </p>
          </div>
          <Link className="shrink-0 text-xs font-semibold text-kmt-navy hover:underline" href="/admin/notifications">
            {copy.openCenter}
          </Link>
        </div>
        <div className="max-h-[28rem] overflow-y-auto pe-1">
          {loadFailed ? (
            <StateBlock
              action={<Button onClick={reloadPreview} type="button" variant="secondary">{copy.retry}</Button>}
              description={copy.loadPreviewFailed}
              title={copy.loadPreviewFailed}
              tone="error"
            />
          ) : (
            <NotificationList busyId={state.busyId} items={state.items} onMarkRead={state.markRead} />
          )}
        </div>
        <div aria-live="polite" className="mt-2 min-h-5 text-xs text-kmt-muted" role="status">
          {state.feedback}
          {state.retryItem ? (
            <Button className="ms-2" onClick={() => state.markRead(state.retryItem!)} size="sm" type="button" variant="ghost">
              {copy.retry}
            </Button>
          ) : null}
        </div>
      </div>
    </details>
  );
}

export function AdminNotificationCenter({ initialSnapshot }: { initialSnapshot: NotificationCenterSnapshot }) {
  const state = useNotificationRead(initialSnapshot);
  const [nextCursor, setNextCursor] = useState(initialSnapshot.nextCursor);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState(false);

  async function loadMore() {
    if (!nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);
    setLoadError(false);
    try {
      const response = await fetch(
        `/api/admin/notifications?pageSize=20&cursor=${encodeURIComponent(nextCursor)}`,
        { headers: { Accept: "application/json" } }
      );
      if (!response.ok) {
        setLoadError(true);
        return;
      }
      const body = (await response.json().catch(() => ({}))) as SnapshotResponse;
      if (!body.data) {
        setLoadError(true);
        return;
      }
      state.setItems((current) => {
        const seen = new Set(current.map((item) => `${item.kind}:${item.id}`));
        return [...current, ...body.data!.items.filter((item) => !seen.has(`${item.kind}:${item.id}`))];
      });
      state.setAttentionCount(body.data.attentionCount);
      state.setGenericUnreadCount(body.data.genericUnreadCount);
      setNextCursor(body.data.nextCursor);
    } catch {
      setLoadError(true);
    } finally {
      setIsLoadingMore(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded border border-kmt-border bg-white p-4">
          <p className="text-sm text-kmt-muted">{copy.attentionSummary}</p>
          <p className="mt-2 text-2xl font-bold text-kmt-ink">{state.attentionCount}</p>
        </div>
        <div className="rounded border border-kmt-border bg-white p-4">
          <p className="text-sm text-kmt-muted">{copy.unreadGeneric}</p>
          <p className="mt-2 text-2xl font-bold text-kmt-ink">{state.genericUnreadCount}</p>
        </div>
        <div className="rounded border border-kmt-border bg-white p-4">
          <p className="text-sm text-kmt-muted">{copy.consultationReview}</p>
          <p className="mt-2 text-2xl font-bold text-kmt-ink">{initialSnapshot.consultationReviewCount}</p>
        </div>
      </div>

      <NotificationList busyId={state.busyId} items={state.items} onMarkRead={state.markRead} />
      <div aria-live="polite" className="min-h-6 text-sm text-kmt-muted" role="status">
        {state.feedback}
      </div>

      {loadError ? (
        <StateBlock
          action={<Button onClick={loadMore} type="button" variant="secondary">{copy.retry}</Button>}
          description={copy.loadMoreFailed}
          title={copy.loadMoreFailed}
          tone="error"
        />
      ) : null}
      {nextCursor ? (
        <Button disabled={isLoadingMore} loading={isLoadingMore} onClick={loadMore} type="button" variant="secondary">
          {isLoadingMore ? copy.loadingMore : copy.loadMore}
        </Button>
      ) : state.items.length ? (
        <p className="text-center text-sm text-kmt-muted" role="status">{copy.exhausted}</p>
      ) : null}
    </div>
  );
}
