import type { Metadata } from "next";
import Link from "next/link";
import { DashboardShell } from "@/components/layout";
import { AdminPagination, MobileFiltersSheet, MoreFiltersPopover } from "@/components/admin";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/animate-ui/components/radix/sheet";
import {
  Badge,
  Button,
  DataTable,
  FilterBar,
  SearchInput,
  Select,
  StateBlock,
  type DataTableColumn
} from "@/components/ui";
import { buttonClasses } from "@/components/ui/button";
import { AdminNotificationBell } from "@/features/admin/notifications/admin-notification-bell";
import { TaskCreateForm, TaskUpdateForm } from "@/features/admin/task-documents/task-document-forms";
import { TaskBoard, TaskCard, TaskUpdateSheet, type TaskBoardOptions, type TaskBoardTask } from "@/features/admin/task-documents/task-board";
import { formatDate, labelFrom, taskPriorityLabels, taskStatusLabels } from "@/lib/legal-format";
import { plan35AdminListAccessibilityCopy } from "@/lib/ui-copy";
import {
  adminTaskStatusValues,
  getAdminTaskOptions,
  listAdminTasks
} from "@/server/admin/task-document-service";
import { AdminPermissionBlocked as PermissionBlocked, requireAdminRoutePage } from "@/server/auth/page-guards";
import { adminNavForPath } from "../admin-navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "مهام المكتب | KMT Legal",
  description: "لوحة مهام داخلية للقضايا مع فلاتر وتشغيل يومي."
};

type SearchParams = Record<string, string | string[] | undefined>;
type TaskResult = Awaited<ReturnType<typeof listAdminTasks>>;
type TaskRow = TaskResult["items"][number];
type TaskOptions = Awaited<ReturnType<typeof getAdminTaskOptions>>;

const taskPriorityOptions = ["LOW", "NORMAL", "HIGH", "URGENT"] as const;

function flattenSearchParams(searchParams: SearchParams) {
  return Object.fromEntries(
    Object.entries(searchParams).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value ?? ""])
  );
}

function priorityTone(priority: string) {
  return priority === "URGENT" || priority === "HIGH" ? ("pending" as const) : ("neutral" as const);
}

function statusTone(status: string) {
  if (status === "COMPLETED") return "active" as const;
  if (status === "ARCHIVED") return "closed" as const;
  if (status === "OVERDUE") return "danger" as const;
  return "pending" as const;
}

type TaskHrefFilters = {
  q?: string;
  view?: string;
  display?: string;
  status?: string;
  priority?: string;
  assignedToId?: string;
  caseId?: string;
  sortBy?: string;
  sortDirection?: string;
  pageSize?: number;
};

function tasksHref(filters: TaskHrefFilters, overrides: Record<string, string | number | undefined> = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...filters, ...overrides })) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  return `/admin/tasks?${params.toString()}`;
}

function CreateTaskSheet({ options }: { options: TaskOptions }) {
  return (
    <Sheet>
      <SheetTrigger className={buttonClasses()}>مهمة جديدة</SheetTrigger>
      <SheetContent aria-label="مهمة جديدة" className="overflow-y-auto" side="right">
        <SheetHeader>
          <SheetTitle>مهمة جديدة</SheetTitle>
          <SheetDescription>أنشئ مهمة داخلية واربطها بقضية عند الحاجة.</SheetDescription>
        </SheetHeader>
        <div className="mt-5">
          <TaskCreateForm assignees={options.assignees} cases={options.cases} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

function taskColumns(options: TaskBoardOptions): Array<DataTableColumn<TaskBoardTask>> {
  return [
    {
      key: "task",
      header: "المهمة",
      render: (task) => (
        <div className="min-w-56">
          <p className="font-semibold text-foreground">{task.title}</p>
          {task.description ? <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{task.description}</p> : null}
        </div>
      )
    },
    {
      key: "case",
      header: "القضية",
      render: (task) => task.case ? (
        <Link className="font-semibold text-primary hover:underline" href={`/admin/cases/${task.case.id}`}>
          <bdi>{task.case.internalFileNumber}</bdi>
        </Link>
      ) : "—"
    },
    { key: "assignee", header: "المسؤول", render: (task) => task.assignedTo.name },
    { key: "dueDate", header: "الاستحقاق", render: (task) => formatDate(task.dueDate) },
    {
      key: "status",
      header: "الحالة",
      render: (task) => <Badge tone={statusTone(task.status)}>{labelFrom(taskStatusLabels, task.status)}</Badge>
    },
    {
      key: "priority",
      header: "الأولوية",
      render: (task) => <Badge tone={priorityTone(task.priority)}>{labelFrom(taskPriorityLabels, task.priority)}</Badge>
    },
    { key: "actions", header: "الإجراء", render: (task) => <TaskUpdateSheet options={options} task={task} /> }
  ];
}

export default async function AdminTasksPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const guard = await requireAdminRoutePage("/admin/tasks");
  if (guard.status === "forbidden") {
    return <PermissionBlocked title={guard.title} description={guard.description} />;
  }

  const query = flattenSearchParams((await searchParams) ?? {});
  const [result, options] = await Promise.all([
    listAdminTasks({ actor: guard.context.principal, query }),
    getAdminTaskOptions(guard.context.principal)
  ]);
  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));
  const display = result.filters.display;

  return (
    <DashboardShell
      action={result.access.canCreate ? <CreateTaskSheet options={options} /> : undefined}
      eyebrow="لوحة المكتب"
      mode="admin"
      navItems={adminNavForPath("/admin/tasks")}
      title="مهام المكتب"
      userLabel={guard.context.user.name}
      principal={guard.context.principal}
      notificationBell={<AdminNotificationBell principal={guard.context.principal} />}
    >
      <div className="space-y-5">
        {!result.access.canCreate ? (
          <StateBlock tone="permission" title="إنشاء المهام غير متاح" description="يمكن لهذا الحساب قراءة المهام داخل نطاقه دون تعديلها." />
        ) : null}

        <div className="flex flex-wrap items-start gap-3">
          <form action="/admin/tasks" className="min-w-0 flex-1" method="get">
            <FilterBar ariaLabel={plan35AdminListAccessibilityCopy.tasks.filters}>
              <SearchInput ariaLabel={plan35AdminListAccessibilityCopy.tasks.search} className="min-w-0 flex-1 sm:min-w-80" defaultValue={result.filters.q ?? ""} name="q" placeholder="ابحث في المهام أو رقم القضية أو المسؤول" />
              <Select className="hidden min-w-36 lg:block" defaultValue={result.filters.view} label="النطاق" name="view">
                <option value="all">كل النطاق</option>
                <option value="mine">مهامي</option>
                <option value="overdue">متأخرة</option>
              </Select>
              <Select className="hidden min-w-40 lg:block" defaultValue={result.filters.status ?? ""} label="الحالة" name="status">
                <option value="">كل الحالات</option>
                {adminTaskStatusValues.map((status) => <option key={status} value={status}>{labelFrom(taskStatusLabels, status)}</option>)}
              </Select>
              <input type="hidden" name="display" value={display} />
              <input type="hidden" name="priority" value={result.filters.priority ?? ""} />
              <input type="hidden" name="assignedToId" value={result.filters.assignedToId ?? ""} />
              <input type="hidden" name="sortBy" value={result.filters.sortBy} />
              <input type="hidden" name="sortDirection" value={result.filters.sortDirection} />
              <Button className="hidden lg:inline-flex" type="submit" variant="secondary">تطبيق</Button>
            </FilterBar>
          </form>

          <MoreFiltersPopover triggerLabel="المزيد من الفلاتر">
            <form action="/admin/tasks" className="space-y-3" method="get">
              <input type="hidden" name="q" value={result.filters.q ?? ""} />
              <input type="hidden" name="view" value={result.filters.view} />
              <input type="hidden" name="display" value={display} />
              <input type="hidden" name="status" value={result.filters.status ?? ""} />
              <Select className="w-full" defaultValue={result.filters.priority ?? ""} label="الأولوية" name="priority">
                <option value="">كل الأولويات</option>
                {taskPriorityOptions.map((priority) => <option key={priority} value={priority}>{labelFrom(taskPriorityLabels, priority)}</option>)}
              </Select>
              {options.assignees.length > 1 ? (
                <Select className="w-full" defaultValue={result.filters.assignedToId ?? ""} label="المسؤول" name="assignedToId">
                  <option value="">كل المسؤولين</option>
                  {options.assignees.map((assignee) => <option key={assignee.id} value={assignee.id}>{assignee.name}</option>)}
                </Select>
              ) : null}
              <Select className="w-full" defaultValue={result.filters.sortBy} label="الترتيب" name="sortBy">
                <option value="dueDate">الاستحقاق</option><option value="updatedAt">آخر تحديث</option><option value="createdAt">تاريخ الإنشاء</option><option value="priority">الأولوية</option><option value="status">الحالة</option>
              </Select>
              <Select className="w-full" defaultValue={result.filters.sortDirection} label="الاتجاه" name="sortDirection">
                <option value="asc">تصاعدي</option><option value="desc">تنازلي</option>
              </Select>
              <Button className="w-full" type="submit" variant="secondary">تطبيق</Button>
            </form>
          </MoreFiltersPopover>

          <MobileFiltersSheet description="ابحث وصفِّ مهام المكتب." title="فلاتر المهام" triggerLabel="الفلاتر">
            <form action="/admin/tasks" className="space-y-3" method="get">
              <input type="hidden" name="display" value={display} />
              <SearchInput ariaLabel={plan35AdminListAccessibilityCopy.tasks.search} className="w-full" defaultValue={result.filters.q ?? ""} name="q" placeholder="ابحث في المهام أو رقم القضية أو المسؤول" />
              <Select className="w-full" defaultValue={result.filters.view} label="النطاق" name="view"><option value="all">كل النطاق</option><option value="mine">مهامي</option><option value="overdue">متأخرة</option></Select>
              <Select className="w-full" defaultValue={result.filters.status ?? ""} label="الحالة" name="status">
                <option value="">كل الحالات</option>{adminTaskStatusValues.map((status) => <option key={status} value={status}>{labelFrom(taskStatusLabels, status)}</option>)}
              </Select>
              <Select className="w-full" defaultValue={result.filters.priority ?? ""} label="الأولوية" name="priority"><option value="">كل الأولويات</option>{taskPriorityOptions.map((priority) => <option key={priority} value={priority}>{labelFrom(taskPriorityLabels, priority)}</option>)}</Select>
              {options.assignees.length > 1 ? <Select className="w-full" defaultValue={result.filters.assignedToId ?? ""} label="المسؤول" name="assignedToId"><option value="">كل المسؤولين</option>{options.assignees.map((assignee) => <option key={assignee.id} value={assignee.id}>{assignee.name}</option>)}</Select> : null}
              <Select className="w-full" defaultValue={result.filters.sortBy} label="الترتيب" name="sortBy"><option value="dueDate">الاستحقاق</option><option value="updatedAt">آخر تحديث</option><option value="createdAt">تاريخ الإنشاء</option><option value="priority">الأولوية</option><option value="status">الحالة</option></Select>
              <Select className="w-full" defaultValue={result.filters.sortDirection} label="الاتجاه" name="sortDirection"><option value="asc">تصاعدي</option><option value="desc">تنازلي</option></Select>
              <Button className="w-full" type="submit" variant="secondary">تطبيق</Button>
            </form>
          </MobileFiltersSheet>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">{result.total} مهمة داخل الفلاتر الحالية</p>
          <div aria-label="طريقة عرض المهام" className="flex rounded-lg border border-border bg-surface p-1" role="group">
            <Link aria-current={display === "list" ? "page" : undefined} className={buttonClasses({ variant: display === "list" ? "primary" : "ghost", size: "sm" })} href={tasksHref(result.filters, { display: "list", page: 1 })}>قائمة</Link>
            <Link aria-current={display === "board" ? "page" : undefined} className={buttonClasses({ variant: display === "board" ? "primary" : "ghost", size: "sm" })} href={tasksHref(result.filters, { display: "board", page: 1 })}>لوحة</Link>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-6" aria-label="توزيع حالات المهام">
          {adminTaskStatusValues.map((status) => (
            <Link key={status} className="rounded-lg border border-border bg-surface p-3 transition-colors motion-reduce:transition-none hover:bg-surface-muted" href={tasksHref(result.filters, { display: "list", status, page: 1 })}>
              <span className="block text-xs text-muted-foreground">{labelFrom(taskStatusLabels, status)}</span>
              <strong className="mt-1 block text-xl text-foreground">{result.statusTotals[status]}</strong>
            </Link>
          ))}
        </div>

        {display === "board" ? (
          result.boardColumns?.some((column) => column.items.length) ? (
            <TaskBoard
              key={JSON.stringify(result.filters)}
              filters={result.filters}
              initialColumns={result.boardColumns}
              options={options}
            />
          ) : <StateBlock title="لا توجد مهام" description="غيّر الفلاتر أو أنشئ مهمة جديدة مرتبطة بقضية داخل نطاقك." />
        ) : (
          <>
            <DataTable columns={taskColumns(options)} rows={result.items} caption="قائمة مهام المكتب" mobileBreakpoint="lg" mobileRender={(task) => <TaskCard options={options} task={task} />} empty={<StateBlock title="لا توجد مهام" description="غيّر الفلاتر أو أنشئ مهمة جديدة مرتبطة بقضية داخل نطاقك." />} stickyHeader />
            <AdminPagination page={result.page} pageSize={result.pageSize} total={result.total} hrefForPage={(page) => tasksHref(result.filters, { page })} resetHref="/admin/tasks" resetLabel="مسح الفلاتر" summary={`صفحة ${result.page} من ${totalPages}`} />
          </>
        )}
      </div>
    </DashboardShell>
  );
}
