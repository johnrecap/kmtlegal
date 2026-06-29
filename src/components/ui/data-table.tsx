import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type DataTableColumn<Row> = {
  key: string;
  header: ReactNode;
  render: (row: Row) => ReactNode;
  className?: string;
};

export function DataTable<Row extends { id: string }>({
  columns,
  rows,
  empty,
  className,
  emptyClassName,
  mobileRender
}: {
  columns: Array<DataTableColumn<Row>>;
  rows: Row[];
  empty?: ReactNode;
  className?: string;
  emptyClassName?: string;
  mobileRender?: (row: Row) => ReactNode;
}) {
  if (rows.length === 0) {
    return <div className={cn("rounded-lg border border-kmt-border bg-white p-6 text-sm text-kmt-muted", className, emptyClassName)}>{empty || "لا توجد بيانات."}</div>;
  }

  const table = (
    <div className={cn("max-w-full min-w-0 overflow-x-auto rounded-lg border border-kmt-border bg-white", mobileRender ? "hidden md:block" : undefined, className)}>
      <table className="min-w-full border-collapse text-sm">
        <thead className="bg-slate-50 text-kmt-muted">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className={cn("border-b border-kmt-border px-4 py-3 text-start font-semibold", column.className)}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-kmt-border">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-slate-50">
              {columns.map((column) => (
                <td key={column.key} className={cn("px-4 py-3 align-middle text-kmt-ink", column.className)}>
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
      <div className="space-y-3 md:hidden">
        {rows.map((row) => (
          <div key={row.id}>{mobileRender(row)}</div>
        ))}
      </div>
      {table}
    </>
  );
}
