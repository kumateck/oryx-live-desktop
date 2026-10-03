import { useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { reportsApi } from "@/shared/api/generated/reports";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDate, formatDateTime } from "@/shared/format/dates";
import { audit, distributionCountSchema, logisticsSchema, longestOnDemurrage, periodFilter, periodRange, periods, pipeline, shipmentReportSchema, stagesSchema, type Period } from "./dashboard";

const { useGetApiV1ReportLogisticsQuery, useGetApiV1ReportProcurementDashboardQuery, useGetApiV1ReportShipmentStatusSummaryQuery, useGetApiV1ReportShipmentQuery } = reportsApi;
const number = (value: number) => value.toLocaleString();

function Card({ title, note, loading, error, onRetry, children }: { title: string; note?: string; loading: boolean; error: string | null; onRetry: () => void; children: React.ReactNode }) {
  return <section aria-label={title} className="min-w-0 space-y-3 rounded-lg border bg-card p-4">
    <div><h2 className="text-sm font-semibold">{title}</h2>{note ? <p className="text-xs text-muted-foreground">{note}</p> : null}</div>
    {loading ? <div role="status" aria-label={`Loading ${title.toLowerCase()}`} className="h-24 animate-pulse rounded-md bg-muted" />
      : error ? <div role="alert" className="flex flex-wrap items-center gap-2 text-sm text-destructive"><span>{error}</span><Button type="button" size="sm" variant="outline" onClick={onRetry}>Retry</Button></div> : children}
  </section>;
}
function Tile({ label, value, note, to, loading, failed }: { label: string; value: number; note: string; to: string; loading: boolean; failed: boolean }) {
  return <Link to={to} className="block min-w-0 rounded-lg border bg-card p-3 hover:border-primary focus-visible:outline-2">
    <dt className="text-xs text-muted-foreground">{label}</dt>
    <dd className="mt-1 text-2xl font-semibold leading-tight">{loading ? <span className="inline-block h-7 w-12 animate-pulse rounded bg-muted" /> : failed ? "–" : number(value)}</dd>
    <dd className="mt-0.5 text-xs text-muted-foreground">{failed ? "Could not be loaded" : note}</dd></Link>;
}
/** Two counts as shares of one bar: done against still to do. */
function Split({ done, doneLabel, pending, pendingLabel }: { done: number; doneLabel: string; pending: number; pendingLabel: string }) {
  const total = done + pending;
  const share = total === 0 ? 0 : Math.round((done / total) * 100);
  return <div className="space-y-2"><div role="img" aria-label={`${share}% ${doneLabel}`} className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${share}%` }} /></div>
    <div className="flex justify-between text-sm"><span><span className="font-semibold">{number(done)}</span> {doneLabel}</span><span><span className="font-semibold">{number(pending)}</span> {pendingLabel}</span></div></div>;
}

/** Where invoices, shipments, waybills and billing sheets stand, for a period. Every figure is the server's; nothing is changed from here. */
export function LogisticsDashboardPage() {
  const [period, setPeriod] = useState<Period>("month");
  const range = useMemo(() => periodRange(period), [period]);
  const logistics = useGetApiV1ReportLogisticsQuery({ ...audit, ...range });
  const procurement = useGetApiV1ReportProcurementDashboardQuery({ ...audit });
  const stagesQuery = useGetApiV1ReportShipmentStatusSummaryQuery({ ...audit, filter: periodFilter[period] });
  const shipmentsQuery = useGetApiV1ReportShipmentQuery({ ...audit, ...range });
  const figures = useMemo(() => logisticsSchema.safeParse(logistics.data ?? {}), [logistics.data]);
  const data = figures.success ? figures.data : null;
  const distribution = useMemo(() => distributionCountSchema.parse(procurement.data ?? null), [procurement.data]);
  const stages = useMemo(() => { const parsed = stagesSchema.safeParse(stagesQuery.data ?? {}); return parsed.success ? parsed.data : null; }, [stagesQuery.data]);
  const demurrage = useMemo(() => longestOnDemurrage(shipmentReportSchema.parse(shipmentsQuery.data ?? [])), [shipmentsQuery.data]);
  const queries = [logistics, procurement, stagesQuery, shipmentsQuery];
  const refreshing = queries.some((query) => query.isFetching);
  const refreshed = Math.max(...queries.map((query) => query.fulfilledTimeStamp ?? 0));
  const refresh = () => { for (const query of queries) void query.refetch(); };
  const failed = (query: { error?: unknown }) => query.error ? apiErrorMessage(query.error) : null;
  const bars = data ? pipeline(data) : [];
  const tallest = Math.max(1, ...bars.flatMap((bar) => [bar.shipments, bar.waybills]));
  const stageList = stages ? [["New", stages.newCount], ["At port", stages.atPortCount], ["Cleared", stages.clearedCount], ["In transit", stages.inTransitCount], ["Arrived", stages.arrivedCount]] as const : [];
  return <article className="min-w-0 space-y-4">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><p className="eyebrow">LOGISTICS</p><h1 className="text-xl font-semibold">Logistics dashboard</h1>
        <p className="text-sm text-muted-foreground">{refreshed ? `Refreshed ${formatDateTime(new Date(refreshed).toISOString()) ?? ""}` : "Fetching the latest figures"}</p></div>
      <div className="flex flex-wrap items-center gap-2">
        <div role="group" aria-label="Period" className="flex gap-1">{periods.map((item) => <Button key={item.value} type="button" size="sm" variant={period === item.value ? "default" : "outline"} aria-pressed={period === item.value} onClick={() => setPeriod(item.value)}>{item.label}</Button>)}</div>
        <Button type="button" size="sm" variant="outline" disabled={refreshing} onClick={refresh}><RefreshCw className={refreshing ? "animate-spin" : undefined} />Refresh</Button>
      </div>
    </div>
    <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <Tile label="Invoices" value={data?.numberOfInvoices ?? 0} note={`${number(data?.numberOfPaidInvoices ?? 0)} paid`} to="/logistics/shipment-invoices" loading={logistics.isLoading} failed={Boolean(logistics.error)} />
      <Tile label="Unpaid invoices" value={data?.numberOfUnpaidInvoices ?? 0} note="Still to be paid" to="/logistics/shipment-invoices" loading={logistics.isLoading} failed={Boolean(logistics.error)} />
      <Tile label="Shipments" value={data?.numberOfShipments ?? 0} note={`${number(data?.numberOfInTransitShipments ?? 0)} in transit`} to="/logistics/shipment-documents" loading={logistics.isLoading} failed={Boolean(logistics.error)} />
      <Tile label="Billing sheets" value={data?.numberOfBillingSheets ?? 0} note={`${number(data?.numberOfPendingBillingSheets ?? 0)} pending`} to="/logistics/billing-sheets" loading={logistics.isLoading} failed={Boolean(logistics.error)} />
      <Tile label="Waybills" value={data?.numberOfWaybills ?? 0} note={`${number(data?.numberOfInTransitWaybills ?? 0)} in transit`} to="/logistics/waybill" loading={logistics.isLoading} failed={Boolean(logistics.error)} />
      <Tile label="Material distribution" value={distribution.pending + distribution.distributed} note={`${number(distribution.pending)} pending`} to="/procurement/material-distribution" loading={procurement.isLoading} failed={Boolean(procurement.error)} />
    </dl>
    <div className="grid gap-3 lg:grid-cols-2">
      <Card title="Shipment and waybill pipeline" note="Where shipments and waybills sit in the clearance process." loading={logistics.isLoading} error={failed(logistics)} onRetry={() => void logistics.refetch()}>
        <table className="w-full text-sm"><caption className="sr-only">Shipments and waybills by stage</caption>
          <thead><tr className="text-left text-xs text-muted-foreground"><th scope="col" className="py-1 font-medium">Stage</th><th scope="col" className="py-1 font-medium">Shipments</th><th scope="col" className="py-1 font-medium">Waybills</th></tr></thead>
          <tbody>{bars.map((bar) => <tr key={bar.stage} className="border-t"><th scope="row" className="py-2 pr-3 text-left font-medium">{bar.stage}</th>
            {[bar.shipments, bar.waybills].map((value, index) => <td key={index} className="w-2/5 py-2 pr-3"><div className="flex items-center gap-2"><div aria-hidden="true" className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
              <div className={index === 0 ? "h-full rounded-full bg-primary" : "h-full rounded-full bg-primary/50"} style={{ width: `${(value / tallest) * 100}%` }} /></div><span className="w-10 text-right font-medium">{number(value)}</span></div></td>)}</tr>)}</tbody></table>
      </Card>
      <Card title="Shipment stages" note="How shipments are spread across their stages." loading={stagesQuery.isLoading} error={failed(stagesQuery)} onRetry={() => void stagesQuery.refetch()}>
        <dl className="grid grid-cols-2 gap-2 sm:grid-cols-5">{stageList.map(([label, value]) => <div key={label} className="rounded-md border p-2 text-center"><dd className="text-xl font-semibold">{number(value)}</dd><dt className="text-xs text-muted-foreground">{label}</dt></div>)}</dl>
      </Card>
      <Card title="Demurrage and free time" note="Shipments that have been on demurrage longest." loading={shipmentsQuery.isLoading} error={failed(shipmentsQuery)} onRetry={() => void shipmentsQuery.refetch()}>
        {demurrage.length === 0 ? <p className="text-sm text-muted-foreground">No shipment in this period has a demurrage date.</p>
          : <ul className="divide-y text-sm">{demurrage.map((row, index) => <li key={`${row.billOfLadingNo ?? row.supplierName ?? "shipment"}-${index}`} className="flex items-center justify-between gap-3 py-1.5">
            <span className="min-w-0"><span className="block break-words font-medium">{row.supplierName ?? "Unnamed supplier"}</span>
              <span className="block break-words text-xs text-muted-foreground">{[row.billOfLadingNo ? `B/L ${row.billOfLadingNo}` : null, row.containerSize, row.freeDays ? `${row.freeDays} free` : null, `from ${formatDate(row.demurrageStarts) ?? "–"}`].filter(Boolean).join(" · ")}</span></span>
            <span className={row.days > 0 ? "shrink-0 font-semibold text-destructive" : "shrink-0 font-semibold"}>{row.days > 0 ? `${row.days} ${row.days === 1 ? "day" : "days"}` : "Not started"}</span></li>)}</ul>}
      </Card>
      <div className="grid gap-3">
        <Card title="Invoice status" note="Paid against unpaid invoices." loading={logistics.isLoading} error={failed(logistics)} onRetry={() => void logistics.refetch()}>
          <Split done={data?.numberOfPaidInvoices ?? 0} doneLabel="paid" pending={data?.numberOfUnpaidInvoices ?? 0} pendingLabel="unpaid" /></Card>
        <Card title="Billing sheet status" note="Paid against pending billing sheets." loading={logistics.isLoading} error={failed(logistics)} onRetry={() => void logistics.refetch()}>
          <Split done={data?.numberOfPaidBillingSheets ?? 0} doneLabel="paid" pending={data?.numberOfPendingBillingSheets ?? 0} pendingLabel="pending" /></Card>
      </div>
    </div>
  </article>;
}
