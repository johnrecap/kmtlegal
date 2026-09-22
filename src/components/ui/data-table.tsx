import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type DataTableColumn<Row> = {
  key: string;
  header: ReactNode;
  render: (row: Row) => ReactNode;
  className?: string;
};

export type DataTableProps<Row extends { id: string }> = {
  columns: Array<DataTableColumn<Row>>;
  rows: Row[];
  caption?: ReactNode;
  empty?: ReactNode;
  className?: string;
  emptyClassName?: string;
  mobileRender?: (row: Row) => ReactNode;
  mobileBreakpoint?: "md" | "lg";
  stickyHeader?: boolean;
};

export function DataTable<Row extends { id: string }>({
  columns,
  rows,
  caption,
  empty,
  className,
  emptyClassName,
  mobileRender,
  mobileBreakpoint = "md",
  stickyHeader = false
}: DataTableProps<Row>) {
  if (rows.length === 0) {
    return (
      <div className={cn("rounded-lg p-6 text-sm text-muted-foreground", className, emptyClassName)} role="status">
        {caption ? <span className="sr-only">{caption}: </span> : null}
        {empty || "لا توجد بيانات."}
      </div>
    );
  }

  const tableVisibility = mobileRender
    ? mobileBreakpoint === "lg" ? "hidden lg:block" : "hidden md:block"
    : undefined;
  const mobileVisibility = mobileBreakpoint === "lg" ? "space-y-3 lg:hidden" : "space-y-3 md:hidden";

  const table = (
    <div className={cn("max-w-full min-w-0 overflow-x-auto rounded-lg border border-border bg-surface", tableVisibility, className)}>
      <table className="min-w-full border-collapse text-sm">
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <thead className={cn("bg-surface-muted text-muted-foreground", stickyHeader && "sticky top-0 z-10")}>
          <tr>
            {columns.map((column) => (
              <th key={column.key} className={cn("border-b border-border px-4 py-3 text-start font-semibold", column.className)} scope="col">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => (
            <tr key={row.id} className="transition-colors duration-kmt-fast ease-kmt-out motion-reduce:transition-none hover:bg-surface-muted">
              {columns.map((column) => (
                <td key={column.key} className={cn("px-4 py-3 align-middle text-foreground", column.className)}>
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  if (!mobileRender) {
    return table;
  }

  return (
    <>
      <div className={mobileVisibility}>
        {rows.map((row) => (
          <div key={row.id}>{mobileRender(row)}</div>
        ))}
      </div>
      {table}
    </>
  );
}
