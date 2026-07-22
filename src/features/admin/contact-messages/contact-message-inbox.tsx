"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Badge,
  Button,
  DataRecordCard,
  DataTable,
  FilterBar,
  SearchInput,
  Select,
  StateBlock,
  type DataTableColumn
} from "@/components/ui";
import { buttonClasses } from "@/components/ui/button";
import { formatDateTime } from "@/lib/legal-format";
import { plan35ContactInboxUiCopy as copy } from "@/lib/ui-copy";

export type ContactMessageInboxItem = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  topic: string;
  message: string;
  status: "NEW" | "REVIEWED" | "ARCHIVED";
  createdAt: string;
  reviewedAt: string | null;
  reviewedBy: { id: string; name: string } | null;
};

export type ContactMessageInboxData = {
  items: ContactMessageInboxItem[];
  total: number;
  filters: {
    q?: string;
    status?: "NEW" | "REVIEWED" | "ARCHIVED" | "";
    topic?: "consultation" | "documents" | "media" | "other" | "";
    sortBy: "createdAt" | "status" | "topic";
    sortDirection: "asc" | "desc";
    page: number;
    pageSize: number;
  };
  page: number;
  pageSize: number;
};

type ApiResponse = {
  data?: ContactMessageInboxItem;
};

function statusTone(status: ContactMessageInboxItem["status"]) {
  if (status === "NEW") return "pending" as const;
  if (status === "REVIEWED") return "active" as const;
  return "closed" as const;
}

function statusLabel(status: ContactMessageInboxItem["status"]) {
  return copy.statuses[status];
}

function topicLabel(topic: string) {
  return copy.topics[topic as keyof typeof copy.topics] ?? topic;
}

function listHref(filters: ContactMessageInboxData["filters"], page: number) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.status) params.set("status", filters.status);
  if (filters.topic) params.set("topic", filters.topic);
  params.set("sortBy", filters.sortBy);
  params.set("sortDirection", filters.sortDirection);
  params.set("page", String(page));
  params.set("pageSize", String(filters.pageSize));
  return `/admin/contact-messages?${params.toString()}`;
}

export function ContactMessageInbox({
  initialData,
  canManage
}: {
  initialData: ContactMessageInboxData;
  canManage: boolean;
}) {
  const [data, setData] = useState(initialData);
  const [busyMessageId, setBusyMessageId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const isBusy = busyMessageId !== null;
  const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize));

  async function updateStatus(messageId: string, status: "REVIEWED" | "ARCHIVED") {
    setBusyMessageId(messageId);
    setFeedback(copy.updating);
    try {
      const response = await fetch(`/api/admin/contact-messages/${messageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (!response.ok) {
        setFeedback(copy.updateFailed);
        return;
      }
      const body = (await response.json().catch(() => ({}))) as ApiResponse;
      if (!body.data) {
        setFeedback(copy.updateFailed);
        return;
      }
      setData((current) => ({
        ...current,
        items: current.items.map((item) => (item.id === messageId ? body.data! : item))
      }));
      setFeedback(copy.updateSucceeded);
    } catch {
      setFeedback(copy.updateFailed);
    } finally {
      setBusyMessageId(null);
    }
  }

  function actionsFor(row: ContactMessageInboxItem) {
    if (!canManage || row.status === "ARCHIVED") return null;
    return (
      <div className="flex flex-wrap gap-2">
        {row.status === "NEW" ? (
          <Button
            disabled={isBusy}
            loading={busyMessageId === row.id}
            onClick={() => updateStatus(row.id, "REVIEWED")}
            size="sm"
            type="button"
            variant="secondary"
          >
            {copy.markReviewed}
          </Button>
        ) : null}
        <Button
          disabled={isBusy}
          loading={busyMessageId === row.id}
          onClick={() => updateStatus(row.id, "ARCHIVED")}
          size="sm"
          type="button"
          variant="ghost"
        >
          {copy.archive}
        </Button>
      </div>
    );
  }

  const columns: Array<DataTableColumn<ContactMessageInboxItem>> = [
    {
      key: "sender",
      header: copy.sender,
      render: (row) => (
        <div className="min-w-44">
          <p className="font-semibold text-kmt-ink" dir="auto">{row.fullName}</p>
          <a className="mt-1 block break-all text-xs text-kmt-navy hover:underline" dir="ltr" href={`mailto:${row.email}`}>
            {row.email}
          </a>
          {row.phone ? (
            <a className="mt-1 block text-xs text-kmt-muted hover:underline" dir="ltr" href={`tel:${row.phone}`}>
              {row.phone}
            </a>
          ) : null}
        </div>
      )
    },
    {
      key: "message",
      header: copy.message,
      render: (row) => (
        <div className="min-w-64 max-w-xl">
          <p className="text-xs font-semibold text-kmt-muted">{topicLabel(row.topic)}</p>
          <details className="mt-2 group">
            <summary className="cursor-pointer text-sm font-semibold text-kmt-navy hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kmt-gold">
              {copy.openDetails}
            </summary>
            <p className="mt-2 break-words text-sm leading-7 text-kmt-ink" dir="auto">{row.message}</p>
          </details>
        </div>
      )
    },
    {
      key: "status",
      header: copy.status,
      render: (row) => <Badge tone={statusTone(row.status)}>{statusLabel(row.status)}</Badge>
    },
    {
      key: "reviewer",
      header: copy.reviewer,
      render: (row) => row.reviewedBy?.name ?? "—"
    },
    {
      key: "receivedAt",
      header: copy.receivedAt,
      render: (row) => formatDateTime(new Date(row.createdAt))
    },
  ];
  if (canManage) columns.push({ key: "actions", header: copy.actions, render: actionsFor });

  return (
    <div className="space-y-5">
      <form action="/admin/contact-messages" method="get">
        <FilterBar ariaLabel={copy.filtersLabel}>
          <SearchInput
            ariaLabel={copy.searchLabel}
            className="min-w-0 flex-1 sm:min-w-80"
            defaultValue={data.filters.q ?? ""}
            name="q"
            placeholder={copy.searchPlaceholder}
          />
          <Select className="min-w-40" defaultValue={data.filters.status ?? ""} label={copy.status} name="status">
            <option value="">{copy.allStatuses}</option>
            {Object.entries(copy.statuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </Select>
          <Select className="min-w-40" defaultValue={data.filters.topic ?? ""} label={copy.topic} name="topic">
            <option value="">{copy.allTopics}</option>
            {Object.entries(copy.topics).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </Select>
          <Select className="min-w-40" defaultValue={data.filters.sortBy} label={copy.sort} name="sortBy">
            {Object.entries(copy.sortOptions).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </Select>
          <Select className="min-w-40" defaultValue={data.filters.sortDirection} label={copy.direction} name="sortDirection">
            {Object.entries(copy.directions).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </Select>
          <input name="pageSize" type="hidden" value={data.pageSize} />
          <Button type="submit" variant="secondary">{copy.apply}</Button>
        </FilterBar>
      </form>

      {!canManage ? <StateBlock description={copy.readerOnly} title={copy.title} tone="permission" /> : null}
      <div aria-live="polite" className="min-h-6 text-sm text-kmt-muted" role="status">
        {feedback}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-kmt-muted">
        <p>{data.total} {copy.totalSuffix}</p>
        <p>{copy.page} {data.page} {copy.of} {totalPages}</p>
      </div>

      <DataTable
        caption={copy.tableCaption}
        columns={columns}
        empty={copy.empty}
        rows={data.items}
        mobileRender={(row) => (
          <DataRecordCard
            title={<span dir="auto">{row.fullName}</span>}
            description={<span dir="ltr">{row.email}</span>}
            badges={<Badge tone={statusTone(row.status)}>{statusLabel(row.status)}</Badge>}
            fields={[
              { label: copy.topic, value: topicLabel(row.topic) },
              { label: copy.message, value: <span className="break-words" dir="auto">{row.message}</span> },
              { label: copy.receivedAt, value: formatDateTime(new Date(row.createdAt)) }
            ]}
            action={actionsFor(row)}
          />
        )}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link className="text-sm font-semibold text-kmt-navy hover:underline" href="/admin/contact-messages">
          {copy.clearFilters}
        </Link>
        <div className="flex gap-3">
          {data.page > 1 ? (
            <Link className={buttonClasses({ variant: "secondary", size: "sm" })} href={listHref(data.filters, data.page - 1)}>
              {copy.previous}
            </Link>
          ) : null}
          {data.page < totalPages ? (
            <Link className={buttonClasses({ variant: "secondary", size: "sm" })} href={listHref(data.filters, data.page + 1)}>
              {copy.next}
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
