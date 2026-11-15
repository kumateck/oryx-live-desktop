import { Link, useSearchParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NoAccess } from "@/shared/auth/no-access";
import { useCurrentUser } from "@/shared/auth/session-provider";
import { useAccess } from "@/shared/auth/use-access";
import { PageHeader } from "@/shared/navigation/page-header";
import { reportDefinition } from "../lib/catalog";
import { reportEntry, reportSections, viewRequirement } from "../lib/report-directory";
import { ReportSectionIcon } from "./report-section-icon";
import { SelectedReport } from "./report-workbench";

/** One report from the hub. A report with a summary and a detailed form shows them as two tabs, each with its own permission. */
export function ReportPage({ slug }: { slug: string | undefined }) {
  const access = useAccess(); const user = useCurrentUser();
  const [params, setParams] = useSearchParams();
  const entry = reportEntry(slug);
  if (!entry) return <section role="alert" className="space-y-3 py-10 text-center">
    <h1 className="text-xl font-semibold">This report does not exist</h1>
    <p className="text-sm text-muted-foreground">It may have been renamed. Open the report list to find it.</p>
    <Button asChild variant="outline"><Link to="/reports">All reports</Link></Button>
  </section>;
  const views = entry.views.filter((view) => access.has(viewRequirement(view.key)));
  const view = views.find((candidate) => candidate.id === params.get("view")) ?? views[0];
  if (!view) return <NoAccess />;
  const definition = reportDefinition(view.key);
  const section = reportSections.find((candidate) => candidate.id === entry.section);
  return <article className="space-y-5">
    <PageHeader title={entry.title} crumbs={[{ label: "Reports", to: "/reports" }, { label: section?.title ?? null, to: `/reports?section=${entry.section}` }, { label: entry.title }]} />
    <div className="flex items-start gap-3">
      <ReportSectionIcon section={entry.section} />
      <p className="max-w-3xl text-sm text-muted-foreground">{definition.description}</p>
    </div>
    {views.length > 1 ? <Tabs value={view.id} onValueChange={(value) => setParams({ view: String(value) }, { replace: true })}>
      <TabsList aria-label={`${entry.title} views`}>{views.map((candidate) => <TabsTrigger key={candidate.id} value={candidate.id}>{candidate.label}</TabsTrigger>)}</TabsList>
    </Tabs> : null}
    <SelectedReport key={`${view.key}:${user?.id}:${user?.departmentId}`} definition={definition} requirement={viewRequirement(view.key)} />
  </article>;
}
