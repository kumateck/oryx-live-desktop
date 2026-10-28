import { useDependentReportFilters } from "../hooks/use-dependent-report-filters";
import { useReportHistory } from "../hooks/use-report-history";
import { ReportFilterDialog } from "./report-filter-dialog";
import { useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/shared/navigation/page-header";
import { reportCatalog } from "../lib/catalog";
import { reportFilterFields } from "../lib/filter-fields";
import { reportFiltersSchema, emptyReportFilters, type ReportFilters } from "../schemas/report-filters";
import { useReportLookups } from "../hooks/use-report-lookups";
import { useReportRunner } from "../hooks/use-report-runner";
import { ReportKey, type ReportDefinition, type ReportGroup } from "../lib/report-model";
import { ReportSnapshot } from "./report-snapshot";
function SelectedReport({ definition, requirement, initialFilters }: { definition: ReportDefinition; requirement?: string | undefined; initialFilters?: Partial<ReportFilters> | undefined }) {
  const schema = useMemo(() => reportFiltersSchema.superRefine((values, ctx) => {
    for (const name of definition.required ?? []) if (!values[name]) ctx.addIssue({ code: "custom", path: [name], message: "This filter is required." });
  }), [definition]);
  const form = useForm<ReportFilters>({ resolver: zodResolver(schema), defaultValues: { ...emptyReportFilters(), ...initialFilters } });
  const resetFilters = useDependentReportFilters(form);
  const load = useReportLookups(definition, form.getValues());
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [initialApplied] = useState(() => form.getValues());
  const applied = useRef(initialApplied);
  const history = useReportHistory(filtersOpen && definition.fields.includes("asOfDate"));
  const fields = useMemo(() => reportFilterFields(definition, (entity) => (search, page, signal) => load(entity, search, page, signal)).map((field) => "name" in field && field.name === "asOfDate" ? { ...field, disabled: history.disabled, description: history.message } : field), [definition, load, history.disabled, history.message]);
  const closeFilters = (open: boolean) => { if (!open) resetFilters(structuredClone(applied.current)); setFiltersOpen(open); };
  const runner = useReportRunner(definition, requirement);
  const production = [ReportKey.MonthlySchedule, ReportKey.DailySchedule, ReportKey.ProductReadiness].includes(definition.key);
  const filterButton = <Button disabled={runner.busy} onClick={() => setFiltersOpen(true)}>{runner.book ? "Edit filters" : "Choose filters"}</Button>;
  return <div className={production ? "space-y-3" : "space-y-5"}>{!runner.readiness ? <p className="text-sm text-muted-foreground">{definition.description}</p> : null}
    {!runner.readiness || runner.busy ? <div className="flex flex-wrap items-center gap-2">{filterButton}
      {runner.busy ? <Button variant="outline" onClick={runner.cancel}>Cancel generation</Button> : null}
      <span className="text-sm text-muted-foreground">{runner.book ? "The report shows the last submitted filters." : "Set filters, then generate the complete report."}</span>
    </div> : null}
    <ReportFilterDialog title={definition.title} open={filtersOpen} onOpenChange={closeFilters} form={form} fields={fields}
      submit={(values) => { setFiltersOpen(false); void runner.run(values).then((success) => { if (success) applied.current = structuredClone(values); }); }} reset={() => resetFilters({ ...emptyReportFilters(), ...initialFilters })} />
    {runner.error ? <p role="alert" className="text-destructive">{runner.error}</p> : null}
    <ReportSnapshot book={runner.book} readiness={runner.readiness} busy={runner.busy} production={production} actions={filterButton} />
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
