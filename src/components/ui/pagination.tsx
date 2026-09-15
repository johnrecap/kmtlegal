import Link from "next/link";
import { cn } from "@/lib/cn";
import { MaterialSymbol } from "./material-symbol";

export type PaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  hrefForPage: (page: number) => string;
  summary?: string;
  resetHref?: string;
  resetLabel?: string;
  previousLabel?: string;
  nextLabel?: string;
  className?: string;
};

export function Pagination({
  page,
  pageSize,
  total,
  hrefForPage,
  summary,
  resetHref,
  resetLabel,
  previousLabel = "السابق",
  nextLabel = "التالي",
  className
}: PaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / Math.max(1, pageSize)));
  const currentPage = Math.min(Math.max(1, page), pageCount);
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < pageCount;

  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-3", className)}>
      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        {summary ? <span>{summary}</span> : null}
        {resetHref ? (
          <Link className="font-semibold text-accent underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring" href={resetHref}>
            {resetLabel ?? "مسح الفلاتر"}
          </Link>
        ) : null}
      </div>
      <nav aria-label="تصفح الصفحات" className="flex items-center gap-2">
        {hasPrev ? (
          <Link
            aria-label={`${previousLabel} (صفحة ${currentPage - 1})`}
            className="inline-flex min-h-11 items-center gap-1 rounded border border-border bg-surface px-3 text-sm font-semibold text-foreground transition-colors duration-kmt-fast ease-kmt-out hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            href={hrefForPage(currentPage - 1)}
          >
            <MaterialSymbol aria-hidden className="text-base" name="arrow_back" />
            <span>{previousLabel}</span>
          </Link>
        ) : null}
        {hasNext ? (
          <Link
            aria-label={`${nextLabel} (صفحة ${currentPage + 1})`}
            className="inline-flex min-h-11 items-center gap-1 rounded border border-border bg-surface px-3 text-sm font-semibold text-foreground transition-colors duration-kmt-fast ease-kmt-out hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            href={hrefForPage(currentPage + 1)}
          >
            <span>{nextLabel}</span>
            <MaterialSymbol aria-hidden className="text-base rtl:rotate-180" name="arrow_forward" />
          </Link>
        ) : null}
      </nav>
    </div>
  );
}
