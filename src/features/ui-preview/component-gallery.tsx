import {
  Badge,
  Button,
  ButtonLink,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DataRecordCard,
  DataTable,
  type DataTableColumn,
  FilterBar,
  InlineFeedback,
  MaterialSymbol,
  Pagination,
  SearchInput,
  Select,
  Skeleton,
  SkeletonCard,
  SkeletonTable,
  StateBlock,
  Tabs,
  TextInput,
  Textarea,
  Toast,
  LinkTabs
} from "@/components/ui";
import { ThemeProvider, ThemeToggle } from "@/components/theme";
import { SpotlightCard } from "@/components/motion-ui/spotlight-card";
import { CountUpDemo, DialogDemo, ShimmerDemo } from "./gallery-islands";

type DemoRow = { id: string; matter: string; status: string; owner: string };

const demoRows: DemoRow[] = [
  { id: "1", matter: "KMT-2026-0148", status: "Active", owner: "M. Khaled" },
  { id: "2", matter: "KMT-2026-0151", status: "Pending", owner: "K. Adel" },
  { id: "3", matter: "KMT-2026-0155", status: "Closed", owner: "N. Samy" }
];

const demoColumns: Array<DataTableColumn<DemoRow>> = [
  { key: "matter", header: "File number", render: (row) => <span dir="ltr">{row.matter}</span> },
  { key: "status", header: "Status", render: (row) => row.status },
  { key: "owner", header: "Lawyer", render: (row) => row.owner }
];

const buttonVariants = ["primary", "secondary", "outline", "ghost", "danger"] as const;
const badgeTones = ["neutral", "active", "pending", "closed", "danger", "info"] as const;
const iconSample = ["gavel", "balance", "cases", "contract", "shield", "event_available", "payments", "smart_toy", "translate", "light_mode", "dark_mode", "info"] as const;

export function ComponentGallery() {
  return (
    <ThemeProvider defaultTheme="dark">
      <div className="min-h-screen bg-background text-foreground">
        <header className="sticky top-0 z-20 border-b border-border bg-surface/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">KMT Legal Design System</p>
              <h1 className="mt-1 text-2xl font-semibold">Component Gallery</h1>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Preview only — env-gated</span>
              <ThemeToggle className="border border-border text-muted-foreground hover:border-primary/60 hover:text-primary" label="Toggle dark and light theme" />
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl space-y-10 px-4 py-10 sm:px-6">
          <GallerySection description="All variants render on semantic tokens and flip correctly between light and dark themes." title="Buttons">
            <div className="flex flex-wrap items-center gap-3">
              {buttonVariants.map((variant) => (
                <Button key={variant} variant={variant}>
                  {variant}
                </Button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
              <Button disabled>Disabled</Button>
              <Button loading>Loading</Button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <ButtonLink href="/preview/components" variant="primary">
                Internal link
              </ButtonLink>
              <ButtonLink external href="https://example.com" variant="secondary">
                External link
              </ButtonLink>
              <Button leadingIcon={<MaterialSymbol name="event_available" />} trailingIcon={<MaterialSymbol className="rtl:rotate-180" name="arrow_forward" />}>
                With icons
              </Button>
            </div>
          </GallerySection>

          <GallerySection description="Six semantic tones plus a compact size. Gold tints survive on both surfaces." title="Badges">
            <div className="flex flex-wrap items-center gap-3">
              {badgeTones.map((tone) => (
                <Badge key={tone} tone={tone}>
                  {tone}
                </Badge>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {badgeTones.map((tone) => (
                <Badge key={tone} size="sm" tone={tone}>
                  {tone} sm
                </Badge>
              ))}
            </div>
          </GallerySection>

          <GallerySection description="One input skin across the family. Labels, hints, and errors stay wired with aria-describedby." title="Fields">
            <div className="grid gap-5 md:grid-cols-2">
              <TextInput hint="Shown under the control, linked via aria-describedby." id="gallery-name" label="Full name" name="name" placeholder="e.g. Maryam Khaled" />
              <TextInput error="This field is required." id="gallery-email" label="Email address" name="email" placeholder="name@example.com" type="email" />
              <Select id="gallery-role" label="Role" name="role">
                <option value="admin">Admin</option>
                <option value="lawyer">Lawyer</option>
                <option value="secretary">Secretary</option>
              </Select>
              <TextInput dir="ltr" id="gallery-date" label="Session date (native picker, LTR)" name="date" type="date" />
              <Textarea id="gallery-notes" label="Notes" name="notes" placeholder="Case summary…" />
              <div className="space-y-2">
                <span className="block text-sm font-semibold text-foreground">Search</span>
                <SearchInput ariaLabel="Search matters" placeholder="Search matters…" />
              </div>
            </div>
          </GallerySection>

          <GallerySection description="Info tone now shows a real info glyph. Error uses role=alert; the rest use role=status." title="Feedback">
            <div className="grid gap-4 md:grid-cols-2">
              <InlineFeedback title="Info" description="Routine informational message." tone="info" />
              <InlineFeedback title="Success" description="The record was saved." tone="success" />
              <InlineFeedback title="Warning" description="Review before continuing." tone="warning" />
              <InlineFeedback title="Error" description="The request failed. Try again." tone="error" />
              <Toast title="Toast — info" description="Polite live region." tone="info" />
              <Toast title="Toast — error" description="Assertive live region." tone="error" />
            </div>
          </GallerySection>

          <GallerySection description="StateBlock covers empty, loading, and permission surfaces on state tokens." title="States">
            <div className="grid gap-4 md:grid-cols-2">
              <StateBlock description="No records match the current filters." title="Nothing here yet" />
              <StateBlock description="Data is on its way." title="Loading" tone="loading" />
              <StateBlock action={<Button size="sm" variant="secondary">Request access</Button>} description="You do not have permission to view this section." title="Permission required" tone="permission" />
              <StateBlock description="Something went wrong while loading." title="Error" tone="error" />
            </div>
          </GallerySection>

          <GallerySection description="Button tabs keep the pressed-group pattern; LinkTabs drive URL state with aria-current." title="Tabs">
            <Tabs activeValue="overview" ariaLabel="Gallery tabs" items={[{ value: "overview", label: "Overview" }, { value: "sessions", label: "Sessions" }, { value: "documents", label: "Documents" }]} />
            <LinkTabs ariaLabel="Gallery link tabs" items={[{ href: "#overview", label: "Overview", count: 12, active: true }, { href: "#sessions", label: "Sessions", count: 3 }, { href: "#documents", label: "Documents", count: 48 }]} />
          </GallerySection>

          <GallerySection description="One shared pagination pattern: summary, clear-filters slot, prev/next with localized labels." title="Pagination">
            <div className="space-y-4">
              <Pagination hrefForPage={(page) => `?page=${page}`} page={2} pageSize={10} resetHref="?" summary="Showing 11–20 of 37 matters" total={37} />
            </div>
          </GallerySection>

          <GallerySection description="Native dialog primitive with focus trap, Escape, backdrop click, and focus return." title="Dialog">
            <DialogDemo />
          </GallerySection>

          <GallerySection description="Token-based shimmer skeletons; reduced-motion renders static blocks." title="Skeletons">
            <div className="grid gap-4 md:grid-cols-3">
              <Skeleton lines={4} />
              <SkeletonCard />
              <SkeletonTable rows={3} />
            </div>
          </GallerySection>

          <GallerySection description="DataTable on semantic tokens with optional sticky header; DataRecordCard for mobile lists." title="Data">
            <DataTable columns={demoColumns} rows={demoRows} caption="Demo matters" stickyHeader />
            <DataRecordCard
              action={<Button size="sm" variant="secondary">Open</Button>}
              badges={<Badge tone="active">Active</Badge>}
              description="Commercial contract dispute — retail sector."
              fields={[
                { label: "File number", value: "KMT-2026-0148", dir: "ltr" },
                { label: "Lawyer", value: "M. Khaled" },
                { label: "Next session", value: "Sun, 21 Sep 2026", dir: "ltr" },
                { label: "Court", value: "Cairo Economic Court" }
              ]}
              title="KMT-2026-0148"
            />
          </GallerySection>

          <GallerySection description="Card family and metric tiles on surface tokens." title="Cards">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Card title</CardTitle>
                  <CardDescription>Supporting description inside the card header.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-6 text-muted-foreground">Card body content on the shared surface token.</p>
                </CardContent>
              </Card>
              <div className="grid gap-4 sm:grid-cols-2">
                <CountUpDemo />
              </div>
            </div>
          </GallerySection>

          <GallerySection description="FilterBar wraps filters in a responsive grid; the shared icon set renders inline SVG only." title="Filter bar + icons">
            <FilterBar ariaLabel="Demo filters">
              <SearchInput ariaLabel="Search" placeholder="Search…" />
              <Select label="Status" name="status">
                <option value="all">All</option>
                <option value="active">Active</option>
              </Select>
            </FilterBar>
            <div className="flex flex-wrap gap-4 text-foreground">
              {iconSample.map((name) => (
                <span className="flex flex-col items-center gap-1 text-muted-foreground" key={name}>
                  <MaterialSymbol className="text-2xl text-primary" name={name} />
                  <span className="text-[11px]">{name}</span>
                </span>
              ))}
            </div>
          </GallerySection>

          <GallerySection description="Motion primitives: spotlight hover follows the cursor; shimmer CTA layers the existing kmt-motion-cta effect." title="Motion">
            <div className="grid gap-4 md:grid-cols-3">
              <SpotlightCard className="rounded-lg border border-border bg-surface p-5">
                <p className="text-sm font-semibold">Spotlight card</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Move the cursor across this card — a gold radial highlight tracks the pointer.</p>
              </SpotlightCard>
              <SpotlightCard className="rounded-lg border border-border bg-surface p-5" spotlightColor="rgb(199 154 82 / 20%)">
                <p className="text-sm font-semibold">Tuned spotlight</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">The highlight color is configurable per instance.</p>
              </SpotlightCard>
              <div className="flex flex-col justify-center gap-3 rounded-lg border border-border bg-surface p-5">
                <ShimmerDemo />
              </div>
            </div>
          </GallerySection>
        </main>

        <footer className="border-t border-border px-4 py-6 text-center text-sm text-muted-foreground">
          KMT Legal component gallery · protected by KMT_ENABLE_UI_PREVIEW in production
        </footer>
      </div>
    </ThemeProvider>
  );
}

function GallerySection({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={`gallery-${title.toLowerCase().replace(/[^a-z]+/g, "-")}`} className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground" id={`gallery-${title.toLowerCase().replace(/[^a-z]+/g, "-")}`}>
          {title}
        </h2>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}
