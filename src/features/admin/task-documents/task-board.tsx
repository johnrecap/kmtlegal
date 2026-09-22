"use client";

import Link from "next/link";
import { Badge, Button } from "@/components/ui";
import type { ComponentProps } from "react";
import { useEffect, useRef, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/animate-ui/components/radix/sheet";
import { buttonClasses } from "@/components/ui/button";
import { formatDate, labelFrom, taskPriorityLabels, taskStatusLabels } from "@/lib/legal-format";
import { TaskUpdateForm } from "./task-document-forms";
import { readAdminApiResponse } from "@/features/admin/shared/admin-api-error";
import { taskRepairCopy } from "./task-repair-copy";

type TaskUpdateValue = ComponentProps<typeof TaskUpdateForm>["task"];

export type TaskBoardTask = TaskUpdateValue & {
  id: string;
  title: string;
  status: NonNullable<TaskUpdateValue["status"]>;
  priority: NonNullable<TaskUpdateValue["priority"]>;
  assignedTo: { id: string; name: string; email: string };
  canUpdate: boolean;
};

export type TaskBoardOptions = {
  assignees: Array<{ id: string; name: string; email: string }>;
  cases: Array<{ id: string; internalFileNumber: string; title: string; client: { id: string; fullName: string } }>;
};

type TaskFilters = {
  q?: string;
  view?: string;
  priority?: string;
  assignedToId?: string;
  caseId?: string;
  sortBy?: string;
  sortDirection?: string;
};

type TaskLane = {
  status: string;
  total: number;
  items: TaskBoardTask[];
  loading?: boolean;
  error?: boolean;
  page?: number;
};

function priorityTone(priority: string) {
  return priority === "URGENT" || priority === "HIGH" ? ("pending" as const) : ("neutral" as const);
}

function statusTone(status: string) {
  if (status === "COMPLETED") return "active" as const;
  if (status === "ARCHIVED") return "closed" as const;
  if (status === "OVERDUE") return "danger" as const;
  return "pending" as const;
}

function taskFormValue(task: TaskBoardTask) {
  return {
    id: task.id,
    updatedAt: task.updatedAt,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    assignedToId: task.assignedToId,
    caseId: task.caseId,
    case: task.case,
    dueDate: task.dueDate
  };
}

export function TaskUpdateSheet({ task, options }: { task: TaskBoardTask; options: TaskBoardOptions }) {
  if (!task.canUpdate) {
    return <span className="text-xs font-semibold text-muted-foreground">{taskRepairCopy.readOnly}</span>;
  }

  return (
    <Sheet>
      <SheetTrigger className={buttonClasses({ variant: "secondary", size: "sm" })}>تعديل</SheetTrigger>
      <SheetContent aria-label={taskRepairCopy.editTaskAria(task.title)} className="overflow-y-auto" side="right">
        <SheetHeader>
          <SheetTitle>تعديل المهمة</SheetTitle>
          <SheetDescription>{task.title}</SheetDescription>
        </SheetHeader>
        <TaskUpdateForm assignees={options.assignees} cases={options.cases} task={taskFormValue(task)} />
      </SheetContent>
    </Sheet>
  );
}

export function TaskCard({ task, options }: { task: TaskBoardTask; options: TaskBoardOptions }) {
  return (
    <article className="rounded-lg border border-border bg-surface p-4" data-task-id={task.id}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-semibold leading-6 text-foreground">{task.title}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{task.assignedTo.name} · {formatDate(task.dueDate)}</p>
        </div>
        <Badge tone={priorityTone(task.priority)}>{labelFrom(taskPriorityLabels, task.priority)}</Badge>
      </div>
      {task.description ? <p className="mt-2 text-sm leading-6 text-muted-foreground">{task.description}</p> : null}
      {task.case ? (
        <Link className="mt-2 block text-sm font-semibold text-primary hover:underline" href={`/admin/cases/${task.case.id}`}>
          <bdi>{task.case.internalFileNumber}</bdi> - {task.case.title}
        </Link>
      ) : <p className="mt-2 text-sm text-muted-foreground">بدون قضية مرتبطة</p>}
      <div className="mt-4 flex items-center justify-between gap-2">
        <Badge tone={statusTone(task.status)}>{labelFrom(taskStatusLabels, task.status)}</Badge>
        <TaskUpdateSheet options={options} task={task} />
      </div>
    </article>
  );
}

function taskApiHref(filters: TaskFilters, status: string, page: number) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }
  params.set("display", "list");
  params.set("status", status);
  params.set("pageSize", "12");
  params.set("page", String(page));
  return `/api/admin/tasks?${params.toString()}`;
}

export function TaskBoard({ initialColumns, filters, options }: {
  initialColumns: TaskLane[];
  filters: TaskFilters;
  options: TaskBoardOptions;
}) {
  const [lanes, setLanes] = useState(initialColumns);
  const requestIds = useRef<Record<string, number>>({});
  const controllers = useRef<Record<string, AbortController>>({});
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const active = controllers.current;
    return () => {
      mounted.current = false;
      Object.values(active).forEach(controller => controller.abort());
    };
  }, []);

  async function loadMore(status: string) {
    const lane = lanes.find((entry) => entry.status === status);
    if (!lane || lane.loading || controllers.current[status] || lane.items.length >= lane.total) return;
    const controller = new AbortController();
    controllers.current[status] = controller;
    const nextPage = (lane.page ?? 1) + 1;
    const requestId = (requestIds.current[status] ?? 0) + 1;
    requestIds.current[status] = requestId;
    setLanes((current) => current.map((entry) => entry.status === status ? { ...entry, loading: true, error: false } : entry));

    try {
      const response = await fetch(taskApiHref(filters, status, nextPage), { cache: "no-store", signal: controller.signal });
      const payload = await readAdminApiResponse<{ items: TaskBoardTask[]; total: number }>(response);
      if (!mounted.current || controller.signal.aborted || requestIds.current[status] !== requestId) return;
      const nextItems = payload.items;
      setLanes((current) => current.map((entry) => {
        if (entry.status !== status) return entry;
        const seen = new Set(entry.items.map((task) => task.id));
        return {
          ...entry,
          total: payload.total,
          page: nextPage,
          items: [...entry.items, ...nextItems.filter((task) => {
            if (seen.has(task.id)) return false;
            seen.add(task.id);
            return true;
          })],
          loading: false,
          error: false
        };
      }));
    } catch {
      if (!mounted.current || controller.signal.aborted || requestIds.current[status] !== requestId) return;
      setLanes((current) => current.map((entry) => entry.status === status ? { ...entry, loading: false, error: true } : entry));
    } finally {
      if (controllers.current[status] === controller) delete controllers.current[status];
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-3 2xl:grid-cols-6">
      {lanes.map((column) => (
        <section key={column.status} className="min-w-0 rounded-lg border border-border bg-surface-muted p-3" aria-labelledby={`tasks-${column.status}`}>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 id={`tasks-${column.status}`} className="text-sm font-semibold text-foreground">{labelFrom(taskStatusLabels, column.status)}</h2>
            <Badge tone={statusTone(column.status)}>{column.items.length} من {column.total}</Badge>
          </div>
          <div className="space-y-3">
            {column.items.length ? column.items.map((task) => <TaskCard key={task.id} options={options} task={task} />) : <p className="text-sm leading-6 text-muted-foreground">{taskRepairCopy.noTasksInColumn}</p>}
          </div>
          {column.error ? <p className="mt-3 text-sm text-kmt-danger">{taskRepairCopy.loadMoreFailed}</p> : null}
          {column.total > column.items.length ? (
            <Button className="mt-3" disabled={column.loading} size="sm" type="button" variant="secondary" onClick={() => loadMore(column.status)}>
              {column.loading ? taskRepairCopy.loadingMore : taskRepairCopy.loadMore}
            </Button>
          ) : null}
        </section>
      ))}
    </div>
  );
}
