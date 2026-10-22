import { useMemo } from "react";
import { useSearchParams } from "react-router";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { FormWizard } from "@/shared/forms/form-wizard";
import { PageHeader } from "@/shared/navigation/page-header";
import { Skeleton } from "@/shared/skeleton/skeleton";
import { ReportResults } from "@/shared/reports/report-results";
import { reportCatalog } from "../lib/catalog";
import { reportFilterFields } from "../lib/filter-fields";
import { reportFiltersSchema, emptyReportFilters, type ReportFilters } from "../schemas/report-filters";
import { useReportLookups } from "../hooks/use-report-lookups";
import { useReportRunner } from "../hooks/use-report-runner";
import type { ReportDefinition, ReportGroup, ReportKey } from "../lib/report-model";
function SelectedReport({ definition, requirement, initialFilters }: { definition: ReportDefinition; requirement?: string | undefined; initialFilters?: Partial<ReportFilters> | undefined }) {
  const schema = useMemo(() => reportFiltersSchema.superRefine((values, ctx) => {
    for (const name of definition.required ?? []) if (!values[name]) ctx.addIssue({ code: "custom", path: [name], message: "This filter is required." });
  }), [definition]);
  const form = useForm<ReportFilters>({ resolver: zodResolver(schema), defaultValues: { ...emptyReportFilters(), ...initialFilters } });
  const [department, materialKind, store, division] = useWatch({ control: form.control, name: ["department", "materialKind", "store", "division"] });
  const load = useReportLookups(definition.group, { department, materialKind, store, division });
  const fields = useMemo(() => reportFilterFields(definition, (entity) => (search, page, signal) => load(entity, search, page, signal)), [definition, load]);
  const runner = useReportRunner(definition, requirement);
  return <div className="space-y-5"><p className="text-sm text-muted-foreground">{definition.description}</p>
    <form className="space-y-4" onSubmit={form.handleSubmit(runner.run)}>
      <fieldset disabled={runner.busy} className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"><FormWizard form={form} fields={fields} /></fieldset>
      <div className="flex flex-wrap gap-2"><Button type="submit" disabled={runner.busy}>{runner.busy ? "Generating…" : "Generate report"}</Button>
        {runner.busy ? <Button type="button" variant="outline" onClick={runner.cancel}>Cancel generation</Button> : <Button type="button" variant="outline" onClick={() => { form.reset({ ...emptyReportFilters(), ...initialFilters }); runner.reset(); }}>Reset filters</Button>}</div>
    </form>
    {runner.error ? <p role="alert" className="text-destructive">{runner.error}</p> : null}
    {runner.busy ? <div aria-label="Generating report" className="space-y-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-64 w-full" /></div> : runner.book ? <ReportResults book={runner.book} /> : <p className="text-sm text-muted-foreground">Choose filters and generate a report to view, print or export the complete snapshot.</p>}
  </div>;
}
export function ReportWorkbench({ group, initialKey, allowedKeys, requirement, initialFilters }: { group: ReportGroup; initialKey?: ReportKey; allowedKeys?: readonly ReportKey[]; requirement?: string; initialFilters?: Partial<ReportFilters> }) {
  const [params, setParams] = useSearchParams(); const definitions = reportCatalog.filter((item) => item.group === group && (!allowedKeys || allowedKeys.includes(item.key)));
  const selected = definitions.find((item) => String(item.key) === params.get("report")) ?? definitions.find((item) => item.key === initialKey) ?? definitions[0];
  if (!selected) return <p role="alert">This report is not configured.</p>;
  return <article className="space-y-5"><PageHeader title={selected.title} crumbs={[{ label: "Reports" }, { label: selected.title }]} />
    <nav aria-label="Report type" className="flex flex-wrap gap-2">{definitions.map((definition) => <Button key={definition.key} variant={selected.key === definition.key ? "default" : "outline"} size="sm" aria-pressed={selected.key === definition.key} onClick={() => setParams({ report: String(definition.key) })}>{definition.title}</Button>)}</nav>
    <SelectedReport key={selected.key} definition={selected} requirement={requirement} initialFilters={initialFilters} />
  </article>;
}
