import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink
} from "@/components/ui/pagination-shadcn";
import { cn } from "@/lib/cn";

export type AdminPaginationProps = {
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

/**
 * Shared admin pagination (Phase 09) over the vendored shadcn Pagination.
 * Props mirror the hand-rolled page contract (`listHref(filters, page)` →
 * `hrefForPage`, conditional prev/next, reset link, count summary) so the
 * Phase 10 list migration is mechanical with zero behavior drift. Page
 * numbers render with an ellipsis window; prev/next chevrons mirror in RTL.
 * Below the `sm` breakpoint only prev + current + next stay visible (the
 * full number window overflows 390px viewports — verified by probe).
 * Labels arrive via props (Arabic defaults match the strings already in
 * production on every admin list page) — no new copy here.
 */
export function AdminPagination({
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
}: AdminPaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / Math.max(1, pageSize)));
  const current = Math.min(Math.max(1, page), pageCount);

  const windowPages: Array<number | "ellipsis"> = [];
  if (pageCount <= 7) {
    for (let index = 1; index <= pageCount; index += 1) {
      windowPages.push(index);
    }
  } else {
    windowPages.push(1);
    if (current > 3) {
      windowPages.push("ellipsis");
    }
    for (let index = Math.max(2, current - 1); index <= Math.min(pageCount - 1, current + 1); index += 1) {
      windowPages.push(index);
    }
    if (current < pageCount - 2) {
      windowPages.push("ellipsis");
    }
    windowPages.push(pageCount);
  }

  return (
    <div className={cn("space-y-3", className)}>
      {summary ? <p className="text-sm text-kmt-muted">{summary}</p> : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {resetHref && resetLabel ? (
          <a className="text-sm font-semibold text-kmt-navy hover:underline" href={resetHref}>
            {resetLabel}
          </a>
        ) : (
          <span />
        )}
        <Pagination className="mx-0 w-auto">
          <PaginationContent>
            {current > 1 ? (
              <PaginationItem>
                <PaginationLink
                  aria-label={previousLabel}
                  className="gap-1 pl-2.5"
                  href={hrefForPage(current - 1)}
                  size="md"
                >
                  <ChevronLeft className="h-4 w-4 rtl:-scale-x-100" />
                  <span>{previousLabel}</span>
                </PaginationLink>
              </PaginationItem>
            ) : null}
            {windowPages.map((entry, index) =>
              entry === "ellipsis" ? (
                <PaginationItem key={`ellipsis-${index}`} className="hidden sm:block">
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={entry} className={entry === current ? undefined : "hidden sm:block"}>
                  <PaginationLink href={hrefForPage(entry)} isActive={entry === current}>
                    {entry}
                  </PaginationLink>
                </PaginationItem>
              )
            )}
            {current < pageCount ? (
              <PaginationItem>
                <PaginationLink
                  aria-label={nextLabel}
                  className="gap-1 pr-2.5"
                  href={hrefForPage(current + 1)}
                  size="md"
                >
                  <span>{nextLabel}</span>
                  <ChevronRight className="h-4 w-4 rtl:-scale-x-100" />
                </PaginationLink>
              </PaginationItem>
            ) : null}
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
