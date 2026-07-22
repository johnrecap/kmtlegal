import Link from "next/link";
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  StateBlock,
  buttonClasses
} from "@/components/ui";
import {
  appointmentStatusLabels,
  documentCategoryLabels,
  documentStatusLabels,
  formatDateTime,
  labelFrom,
  modeLabels,
  taskPriorityLabels,
  taskStatusLabels
} from "@/lib/legal-format";
import {
  plan35ContactInboxUiCopy,
  plan35DashboardSectionCopy,
  plan35DashboardUiCopy
} from "@/lib/ui-copy";
import type {
  DashboardDisplayValue,
  DashboardPriorityItem,
  DashboardPrioritySection
} from "@/server/admin/dashboard-service";

export function DashboardPriorityList({ section }: { section: DashboardPrioritySection }) {
  const copy = plan35DashboardSectionCopy[section.key];

  return (
    <Card data-testid={section.state === "ready" ? "dashboard-section-ready" : "dashboard-section-unavailable"}>
      <CardHeader>
        <CardTitle>{copy.title}</CardTitle>
        <CardDescription>{plan35DashboardUiCopy.priorityDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        {section.state === "unavailable" ? (
          <StateBlock
            action={
              <Link className={buttonClasses({ variant: "secondary", size: "sm" })} href="/admin">
                {plan35DashboardUiCopy.retrySection}
              </Link>
            }
            description={plan35DashboardUiCopy.sectionUnavailable}
            title={copy.title}
            tone="warning"
          />
        ) : section.items.length ? (
          <ol className="space-y-3">
            {section.items.map((item) => <PriorityItem item={item} key={`${item.kind}:${item.id}`} />)}
          </ol>
        ) : (
          <StateBlock description={copy.empty} title={copy.title} />
        )}
      </CardContent>
      <CardFooter>
        <Link
          className="font-semibold text-kmt-navy hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kmt-gold"
          data-testid="dashboard-section-link"
          href={section.href}
        >
          {plan35DashboardUiCopy.openDestination}
        </Link>
      </CardFooter>
    </Card>
  );
}

function PriorityItem({ item }: { item: DashboardPriorityItem }) {
  const presentation = priorityItemPresentation(item);
  return (
    <li>
      <Link
        className="block min-w-0 rounded-lg border border-kmt-border p-4 transition-colors hover:bg-kmt-canvas focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kmt-gold"
        href={item.href}
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <p className="min-w-0 flex-1 font-semibold text-kmt-ink">
            <DisplayValue value={presentation.title} />
          </p>
          <Badge tone={presentation.tone}>{presentation.badge}</Badge>
        </div>
        <p className="mt-2 break-words text-sm leading-6 text-kmt-muted" data-visual-dynamic>
          <PriorityItemMeta item={item} />
        </p>
      </Link>
    </li>
  );
}

function priorityItemPresentation(item: DashboardPriorityItem) {
  switch (item.kind) {
    case "task":
      return {
        title: item.title,
        badge: `${labelFrom(taskPriorityLabels, item.priority)} · ${labelFrom(taskStatusLabels, item.status)}`,
        tone: item.priority === "URGENT" ? "danger" as const : "pending" as const
      };
    case "appointment":
      return {
        title: item.title,
        badge: labelFrom(appointmentStatusLabels, item.status),
        tone: "pending" as const
      };
    case "consultation-review":
      return {
        title: item.applicantDisplayName,
        badge: plan35DashboardUiCopy.consultationReviewBadge,
        tone: "pending" as const
      };
    case "contact-message":
      return {
        title: item.senderDisplayName,
        badge: contactTopicLabel(item.topic.text),
        tone: "pending" as const
      };
    case "document-review":
      return {
        title: item.fileName,
        badge: labelFrom(documentStatusLabels, item.status),
        tone: "pending" as const
      };
  }
}

function PriorityItemMeta({ item }: { item: DashboardPriorityItem }) {
  switch (item.kind) {
    case "task":
      return (
        <>
          {formatDateTime(item.dueAt)}
          {item.caseReference ? <> · <DisplayValue value={item.caseReference} /></> : null}
        </>
      );
    case "appointment":
      return (
        <>
          {formatDateTime(item.startsAt)} · {labelFrom(modeLabels, item.mode)}
          {item.clientDisplayName ? <> · <DisplayValue value={item.clientDisplayName} /></> : null}
        </>
      );
    case "consultation-review":
      return (
        <>
          <DisplayValue value={item.reference} /> · {formatDateTime(item.startsAt ?? item.createdAt)}
        </>
      );
    case "contact-message":
      return <>{formatDateTime(item.createdAt)}</>;
    case "document-review":
      return <>{labelFrom(documentCategoryLabels, item.category)} · {formatDateTime(item.updatedAt)}</>;
  }
}

function contactTopicLabel(topic: string) {
  return plan35ContactInboxUiCopy.topics[topic as keyof typeof plan35ContactInboxUiCopy.topics] ?? topic;
}

function DisplayValue({ value }: { value: DashboardDisplayValue }) {
  return <bdi dir={value.dir}>{value.text}</bdi>;
}
