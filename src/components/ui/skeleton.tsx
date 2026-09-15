import { cn } from "@/lib/cn";

export function Skeleton({ label = "جارٍ التحميل", lines = 3, className }: { label?: string; lines?: number; className?: string }) {
  const lineCount = Math.max(1, Math.min(lines, 12));
  return (
    <div aria-busy="true" className={cn("space-y-3", className)} role="status">
      <span className="sr-only">{label}</span>
      {Array.from({ length: lineCount }, (_, index) => (
        <span
          aria-hidden="true"
          className={cn("block h-4 rounded bg-surface-muted motion-safe:animate-pulse", index === lineCount - 1 ? "w-2/3" : "w-full")}
          key={index}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ label = "جارٍ التحميل", className }: { label?: string; className?: string }) {
  return (
    <div aria-busy="true" className={cn("rounded-lg border border-border bg-surface p-5", className)} role="status">
      <span className="sr-only">{label}</span>
      <span aria-hidden="true" className="block h-5 w-1/3 rounded bg-surface-muted motion-safe:animate-pulse" />
      <span aria-hidden="true" className="mt-4 block h-8 w-1/2 rounded bg-surface-muted motion-safe:animate-pulse" />
      <span aria-hidden="true" className="mt-4 block h-4 w-full rounded bg-surface-muted motion-safe:animate-pulse" />
      <span aria-hidden="true" className="mt-2 block h-4 w-2/3 rounded bg-surface-muted motion-safe:animate-pulse" />
    </div>
  );
}

export function SkeletonTable({ label = "جارٍ التحميل", rows = 5, columns = 4, className }: { label?: string; rows?: number; className?: string; columns?: number }) {
  return (
    <div aria-busy="true" className={cn("overflow-hidden rounded-lg border border-border bg-surface", className)} role="status">
      <span className="sr-only">{label}</span>
      <div aria-hidden="true" className="flex gap-4 border-b border-border bg-surface-muted px-4 py-3">
        {Array.from({ length: Math.min(columns, 6) }, (_, index) => (
          <span className="h-4 flex-1 rounded bg-surface motion-safe:animate-pulse" key={index} />
        ))}
      </div>
      {Array.from({ length: rows }, (_, rowIndex) => (
        <div className="flex gap-4 border-b border-border px-4 py-3 last:border-b-0" key={rowIndex}>
          {Array.from({ length: Math.min(columns, 6) }, (_, colIndex) => (
            <span className={cn("h-4 flex-1 rounded bg-surface-muted motion-safe:animate-pulse", colIndex === 0 && "max-w-40")} key={colIndex} />
          ))}
        </div>
      ))}
    </div>
  );
}
