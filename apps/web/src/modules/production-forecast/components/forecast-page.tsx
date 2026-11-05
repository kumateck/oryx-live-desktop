import { useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { useGetProductionMaterialForecastQuery } from "@/shared/api/generated/reports";
import { formatDateTime, formatMonthYear } from "@/shared/format/dates";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { PageSkeleton } from "@/shared/skeleton/page-skeletons";
import { currentMonth, forecastAudit, monthArg } from "../lib/forecast";
import { forecastSchema } from "../schemas/forecast";
import { ProductForecastList } from "./product-forecast-list";
import { ScheduleList } from "./schedule-list";

interface Filter { month: string | null }
const fields: WizardField<Filter>[] = [{ type: InputTypes.MONTH, name: "month", label: "Production month" }];

/**
 * The department's production plan for a month and the materials it needs: one batch, all batches, what the
 * warehouse can satisfy now and how many whole batches that covers. Free stock is shared out in schedule order.
 */
export function ForecastPage() {
  const form = useForm<Filter>({ defaultValues: { month: currentMonth() } });
  const month = monthArg(useWatch({ control: form.control, name: "month" }));
  const query = useGetProductionMaterialForecastQuery({ ...forecastAudit, year: month?.year ?? 0, month: month?.month ?? 0 },
    { skip: !month, refetchOnMountOrArgChange: true });
  const parsed = useMemo(() => query.data ? forecastSchema.safeParse(query.data) : null, [query.data]);
  const report = parsed?.success ? parsed.data : null;
  const error = query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned a forecast the app could not read." : null;
  return <section className="page-fill space-y-4">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="space-y-1"><h1 className="text-xl font-semibold">Production material forecast</h1>
        <p className="text-sm text-muted-foreground">Materials needed for the month's planned batches against usable, unreserved stock in your department's stores. Free stock is shared out to batches in schedule order.</p></div>
      <div className="flex items-end gap-3"><div className="w-60 max-w-full"><FormWizard form={form} fields={fields} /></div>
        <Button variant="outline" disabled={!month || query.isFetching} onClick={() => void query.refetch()}>Refresh</Button></div>
    </div>
    {!month ? <p className="text-sm text-muted-foreground">Choose a month to see its production plan.</p>
      : query.isLoading ? <PageSkeleton label="Loading forecast" />
      : error ? <div role="alert" className="space-y-2 ui-card border bg-card"><p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" onClick={() => void query.refetch()}>Try again</Button></div>
      : report ? <>
        <p className="text-sm" aria-live="polite">{report.departmentName ? `${report.departmentName} · ` : ""}{formatMonthYear(`${report.year}-${String(report.month).padStart(2, "0")}-01`)} ·{" "}
          {report.totalBatches} {report.totalBatches === 1 ? "batch" : "batches"} planned · raw materials cover {report.rawReadyBatches} · packaging covers {report.packagingReadyBatches}
          <span className="text-muted-foreground"> · as of {formatDateTime(report.generatedAt) ?? "now"}</span></p>
        {report.warnings.length ? <ul role="note" className="list-disc space-y-1 pl-5 text-sm text-destructive">{report.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul> : null}
        {report.totalBatches === 0 ? <p className="text-sm text-muted-foreground">No batches are scheduled for your department in this month.</p> : <>
          <ScheduleList schedules={report.schedules} />
          <ProductForecastList products={report.products} />
        </>}
      </> : null}
  </section>;
}
