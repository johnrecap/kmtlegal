import type { Metadata } from "next";
import Link from "next/link";
import { DashboardShell } from "@/components/layout";
import { AdminNotificationBell } from "@/features/admin/notifications/admin-notification-bell";
import { AdminPagination, MobileFiltersSheet, MoreFiltersPopover } from "@/components/admin";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, FilterBar, SearchInput, Select, StateBlock } from "@/components/ui";
import { TaskCreateForm, TaskUpdateForm } from "@/features/admin/task-documents/task-document-forms";
import { formatDate, labelFrom, taskPriorityLabels, taskStatusLabels } from "@/lib/legal-format";
import { plan35AdminListAccessibilityCopy } from "@/lib/ui-copy";
import {
  canCreateAdminTask,
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
type TaskRow = Awaited<ReturnType<typeof listAdminTasks>>["items"][number];

const taskStatusOptions = ["NEW", "IN_PROGRESS", "REVIEW", "OVERDUE", "COMPLETED", "ARCHIVED"];
const taskPriorityOptions = ["LOW", "NORMAL", "HIGH", "URGENT"];

function flattenSearchParams(searchParams: SearchParams) {
  return Object.fromEntries(
    Object.entries(searchParams).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value ?? ""])
  );
}

function priorityTone(priority: string) {
  return priority === "URGENT" || priority === "HIGH" ? ("pending" as const) : ("neutral" as const);
}

function statusTone(status: string) {
  if (status === "COMPLETED") {
    return "active" as const;
  }
  if (status === "ARCHIVED") {
    return "closed" as const;
  }
  if (status === "OVERDUE") {
    return "danger" as const;
  }
  return "pending" as const;
}

function listHref(filters: {
  q?: string;
  view?: string;
  status?: string;
  priority?: string;
  assignedToId?: string;
  caseId?: string;
  sortBy?: string;
  sortDirection?: string;
  pageSize?: number;
}, page: number) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) {
      params.set(key, String(value));
    }
  }
  params.set("page", String(page));
  return `/admin/tasks?${params.toString()}`;
}

function groupTasks(tasks: TaskRow[]) {
  return taskStatusOptions.map((status) => ({
    status,
    items: tasks.filter((task) => task.status === status)
  }));
}

function TaskCard({
  task,
  options
}: {
  task: TaskRow;
  options: Awaited<ReturnType<typeof getAdminTaskOptions>>;
}) {
  return (
    <article className="rounded border border-kmt-border bg-white p-3" data-task-id={task.id}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold leading-6 text-kmt-ink">{task.title}</h3>
          <p className="mt-1 text-xs text-kmt-muted">
            {task.assignedTo.name} · {formatDate(task.dueDate)}
          </p>
        </div>
        <Badge tone={priorityTone(task.priority)}>{labelFrom(taskPriorityLabels, task.priority)}</Badge>
      </div>
      {task.description ? <p className="mt-2 text-sm leading-6 text-kmt-muted">{task.description}</p> : null}
      {task.case ? (
        <Link className="mt-2 block text-sm font-semibold text-kmt-navy hover:underline" href={`/admin/cases/${task.case.id}`}>
          {task.case.internalFileNumber} - {task.case.title}
        </Link>
      ) : (
        <p className="mt-2 text-sm text-kmt-muted">بدون قضية مرتبطة</p>
      )}
      <details className="mt-3">
        <summary className="cursor-pointer text-sm font-semibold text-kmt-navy">تعديل المهمة</summary>
        <TaskUpdateForm
          assignees={options.assignees}
          cases={options.cases}
          task={{
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
          }}
        />
      </details>
    </article>
  );
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
  const grouped = groupTasks(result.items);

  return (
    <DashboardShell
      eyebrow="لوحة المكتب"
      mode="admin"
      navItems={adminNavForPath("/admin/tasks")}
      title="مهام المكتب"
      userLabel={guard.context.user.name}
      principal={guard.context.principal}
      notificationBell={<AdminNotificationBell principal={guard.context.principal} />}
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_25rem]">
        <div className="space-y-5">
          <div className="flex flex-wrap items-start gap-3">
          <form action="/admin/tasks" className="min-w-0 flex-1" method="get">
            <FilterBar ariaLabel={plan35AdminListAccessibilityCopy.tasks.filters}>
              <SearchInput ariaLabel={plan35AdminListAccessibilityCopy.tasks.search} className="min-w-0 flex-1 sm:min-w-80" defaultValue={result.filters.q ?? ""} name="q" placeholder="ابحث في المهام أو رقم القضية أو المسؤول" />
              <span className="hidden lg:contents">
              <Select className="min-w-36" defaultValue={result.filters.view} label="النطاق" name="view">
                <option value="all">كل النطاق</option>
                <option value="mine">مهامي</option>
                <option value="overdue">متأخرة</option>
              </Select>
              </span>
              <span className="hidden lg:contents">
              <Select className="min-w-40" defaultValue={result.filters.status ?? ""} label="الحالة" name="status">
                <option value="">كل الحالات</option>
                {taskStatusOptions.map((status) => (
                  <option key={status} value={status}>
                    {labelFrom(taskStatusLabels, status)}
                  </option>
                ))}
              </Select>
              </span>
              <input type="hidden" name="priority" value={result.filters.priority ?? ""} />
              <input type="hidden" name="assignedToId" value={result.filters.assignedToId ?? ""} />
              <input type="hidden" name="sortBy" value={result.filters.sortBy} />
              <input type="hidden" name="sortDirection" value={result.filters.sortDirection} />
              <span className="hidden lg:contents">
              <Button type="submit" variant="secondary">
                تطبيق
              </Button>
              </span>
            </FilterBar>
          </form>
          <MoreFiltersPopover triggerLabel="المزيد من الفلاتر">
            <form action="/admin/tasks" className="space-y-3" method="get">
              <input type="hidden" name="q" value={result.filters.q ?? ""} />
              <input type="hidden" name="view" value={result.filters.view} />
              <input type="hidden" name="status" value={result.filters.status ?? ""} />
              <Select className="w-full" defaultValue={result.filters.priority ?? ""} label="الأولوية" name="priority">
                <option value="">كل الأولويات</option>
                {taskPriorityOptions.map((priority) => (
                  <option key={priority} value={priority}>
                    {labelFrom(taskPriorityLabels, priority)}
                  </option>
                ))}
              </Select>
              {options.assignees.length > 1 ? (
                <Select className="w-full" defaultValue={result.filters.assignedToId ?? ""} label="المسؤول" name="assignedToId">
                  <option value="">كل المسؤولين</option>
                  {options.assignees.map((assignee) => (
                    <option key={assignee.id} value={assignee.id}>
                      {assignee.name}
                    </option>
                  ))}
                </Select>
              ) : null}
              <Select className="w-full" defaultValue={result.filters.sortBy} label="الترتيب" name="sortBy">
                <option value="dueDate">الاستحقاق</option>
                <option value="updatedAt">آخر تحديث</option>
                <option value="createdAt">تاريخ الإنشاء</option>
                <option value="priority">الأولوية</option>
                <option value="status">الحالة</option>
              </Select>
              <Select className="w-full" defaultValue={result.filters.sortDirection} label="الاتجاه" name="sortDirection">
                <option value="asc">تصاعدي</option>
                <option value="desc">تنازلي</option>
              </Select>
              <Button className="w-full" type="submit" variant="secondary">
                تطبيق
              </Button>
            </form>
          </MoreFiltersPopover>
          <MobileFiltersSheet description="ابحث وصفِّ مهام المكتب." title="فلاتر المهام" triggerLabel="الفلاتر">
            <form action="/admin/tasks" className="space-y-3" method="get">
              <SearchInput ariaLabel={plan35AdminListAccessibilityCopy.tasks.search} className="w-full" defaultValue={result.filters.q ?? ""} name="q" placeholder="ابحث في المهام أو رقم القضية أو المسؤول" />
              <Select className="w-full" defaultValue={result.filters.view} label="النطاق" name="view">
                <option value="all">كل النطاق</option>
                <option value="mine">مهامي</option>
                <option value="overdue">متأخرة</option>
              </Select>
              <Select className="w-full" defaultValue={result.filters.status ?? ""} label="الحالة" name="status">
                <option value="">كل الحالات</option>
                {taskStatusOptions.map((status) => (
                  <option key={status} value={status}>
                    {labelFrom(taskStatusLabels, status)}
                  </option>
                ))}
              </Select>
              <Select className="w-full" defaultValue={result.filters.priority ?? ""} label="الأولوية" name="priority">
                <option value="">كل الأولويات</option>
                {taskPriorityOptions.map((priority) => (
                  <option key={priority} value={priority}>
                    {labelFrom(taskPriorityLabels, priority)}
                  </option>
                ))}
              </Select>
              {options.assignees.length > 1 ? (
                <Select className="w-full" defaultValue={result.filters.assignedToId ?? ""} label="المسؤول" name="assignedToId">
                  <option value="">كل المسؤولين</option>
                  {options.assignees.map((assignee) => (
                    <option key={assignee.id} value={assignee.id}>
                      {assignee.name}
                    </option>
                  ))}
                </Select>
              ) : null}
              <Select className="w-full" defaultValue={result.filters.sortBy} label="الترتيب" name="sortBy">
                <option value="dueDate">الاستحقاق</option>
                <option value="updatedAt">آخر تحديث</option>
                <option value="createdAt">تاريخ الإنشاء</option>
                <option value="priority">الأولوية</option>
                <option value="status">الحالة</option>
              </Select>
              <Select className="w-full" defaultValue={result.filters.sortDirection} label="الاتجاه" name="sortDirection">
                <option value="asc">تصاعدي</option>
                <option value="desc">تنازلي</option>
              </Select>
              <Button className="w-full" type="submit" variant="secondary">
                تطبيق
              </Button>
            </form>
          </MobileFiltersSheet>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-kmt-muted">
            <p>{result.total} مهمة داخل الفلاتر الحالية</p>
            <p>
              صفحة {result.page} من {totalPages}
            </p>
          </div>

          {result.items.length ? (
            <div className="grid gap-4 xl:grid-cols-3 2xl:grid-cols-6">
              {grouped.map((column) => (
                <section key={column.status} className="min-w-0 rounded-lg border border-kmt-border bg-slate-50 p-3" aria-labelledby={`tasks-${column.status}`}>
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <h2 id={`tasks-${column.status}`} className="text-sm font-semibold text-kmt-ink">
                      {labelFrom(taskStatusLabels, column.status)}
                    </h2>
                    <Badge tone={statusTone(column.status)}>{column.items.length}</Badge>
                  </div>
                  <div className="space-y-3">
                    {column.items.length ? column.items.map((task) => <TaskCard key={task.id} options={options} task={task} />) : <p className="text-sm leading-6 text-kmt-muted">لا توجد مهام هنا.</p>}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <StateBlock title="لا توجد مهام" description="غيّر الفلاتر أو أنشئ مهمة جديدة مرتبطة بقضية داخل نطاقك." />
          )}

          <AdminPagination
            page={result.page}
            pageSize={result.pageSize}
            total={result.total}
            hrefForPage={(page) => listHref(result.filters, page)}
            resetHref="/admin/tasks"
            resetLabel="مسح الفلاتر"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>مهمة جديدة</CardTitle>
            <CardDescription>إنشاء مهمة داخلية وربطها بقضية عند الحاجة. كل تعديل يتم تسجيله في audit log.</CardDescription>
          </CardHeader>
          <CardContent>
            {canCreateAdminTask(guard.context.principal) ? (
              <TaskCreateForm assignees={options.assignees} cases={options.cases} />
            ) : (
              <StateBlock tone="permission" title="إنشاء المهام غير متاح" description="هذا الحساب يمكنه قراءة المهام داخل نطاقه فقط." />
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
