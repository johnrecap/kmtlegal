import { cn } from "@/lib/cn";

export function Skeleton({ label = "جارٍ التحميل", lines = 3, className }: { label?: string; lines?: number; className?: string }) {
  const lineCount = Math.max(1, Math.min(lines, 12));
  return (
    <div aria-busy="true" className={cn("space-y-3", className)} role="status">
      <span className="sr-only">{label}</span>
      {Array.from({ length: lineCount }, (_, index) => (
        <span
          aria-hidden="true"
          className={cn("block h-4 rounded bg-kmt-border motion-safe:animate-pulse", index === lineCount - 1 ? "w-2/3" : "w-full")}
          key={index}
        />
      ))}
    </div>
  );
}
