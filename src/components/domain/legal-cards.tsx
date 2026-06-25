import type { ReactNode } from "react";
import { Badge, Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, MaterialSymbol } from "@/components/ui";
import { cn } from "@/lib/cn";

export function ServiceCard({
  title,
  description,
  icon = "balance",
  actionLabel = "عرض التفاصيل"
}: {
  title: string;
  description: string;
  icon?: string;
  actionLabel?: string;
}) {
  return (
    <Card>
      <CardContent>
        <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded bg-slate-100 text-kmt-ink">
          <MaterialSymbol className="text-[22px]" name={icon} />
        </div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardContent>
      <CardFooter>
        <Button size="sm" variant="secondary">
          {actionLabel}
        </Button>
      </CardFooter>
    </Card>
  );
}

export function LawyerCard({ name, role, specialties }: { name: string; role: string; specialties: string[] }) {
  return (
    <Card>
      <CardContent>
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded bg-kmt-navy text-white">
            <MaterialSymbol name="person" />
          </div>
          <div>
            <CardTitle>{name}</CardTitle>
            <CardDescription>{role}</CardDescription>
            <div className="mt-3 flex flex-wrap gap-2">
              {specialties.map((specialty) => (
                <Badge key={specialty}>{specialty}</Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function CaseStudyCard({ title, summary, status = "منشورة" }: { title: string; summary: string; status?: string }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>{title}</CardTitle>
          <Badge tone="active">{status}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-6 text-kmt-muted">{summary}</p>
      </CardContent>
    </Card>
  );
}

export function ArticleCard({ title, excerpt, meta }: { title: string; excerpt: string; meta: string }) {
  return (
    <Card>
      <CardContent>
        <p className="text-xs font-semibold text-kmt-gold">{meta}</p>
        <CardTitle className="mt-2">{title}</CardTitle>
        <CardDescription>{excerpt}</CardDescription>
      </CardContent>
    </Card>
  );
}

export function AIOrganizerPanel({ title = "المساعد القانوني الذكي", children }: { title?: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-kmt-border bg-white p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded bg-kmt-gold/15 text-kmt-ink">
          <MaterialSymbol name="smart_toy" />
        </div>
        <h3 className="text-lg font-semibold text-kmt-ink">{title}</h3>
      </div>
      <div className="mt-4 text-sm leading-6 text-kmt-muted">{children}</div>
    </section>
  );
}

export function DocumentCard({ title, meta, status }: { title: string; meta: string; status: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-kmt-border bg-white p-4">
      <div className="flex items-center gap-3">
        <MaterialSymbol className="text-kmt-muted" name="description" />
        <div>
          <p className="font-semibold text-kmt-ink">{title}</p>
          <p className="mt-1 text-sm text-kmt-muted">{meta}</p>
        </div>
      </div>
      <Badge tone="pending">{status}</Badge>
    </div>
  );
}

export function TaskCard({
  title,
  due,
  priority,
  className
}: {
  title: string;
  due: string;
  priority: "normal" | "urgent";
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg border border-kmt-border bg-white p-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="font-semibold text-kmt-ink">{title}</p>
        <Badge tone={priority === "urgent" ? "danger" : "neutral"}>{priority === "urgent" ? "عاجلة" : "عادية"}</Badge>
      </div>
      <p className="mt-3 text-sm text-kmt-muted">{due}</p>
    </div>
  );
}
