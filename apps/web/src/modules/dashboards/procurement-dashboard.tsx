import { useMemo, useState } from "react";
import { ArrowUpDown, BadgeDollarSign, ClipboardList, FileSpreadsheet, Ship, ShoppingCart } from "lucide-react";
import { z } from "zod";
import { reportsApi } from "@/shared/api/generated/reports";
import { BarList, Breakdown, DashboardCard, DashboardHeading, DashboardState, MetricGrid, MetricTile } from "@/shared/dashboard/dashboard-kit";
import { periodFilter, periodOptions, periodRange, type Period } from "@/shared/dashboard/periods";
import { formatMoney } from "@/shared/procurement/price";

const { useGetApiV1ReportProcurementDashboardQuery, useGetApiV1ReportLogisticsQuery, useGetApiV1ReportPurchasedPoReportQuery } = reportsApi;
const audit = { module: "Procurement", subModule: "Dashboard" } as const;
const count = z.number().nullish().transform((value) => typeof value === "number" && Number.isFinite(value) ? value : 0);
const group = z.object({ notProcessedCount: count, processedCount: count, notUsedCount: count }).nullish().transform((value) => value ?? { notProcessedCount: 0, processedCount: 0, notUsedCount: 0 });
export const procurementSchema = z.object({
  requisitionReport: z.object({ newRequisitionsCount: count, pendingRequisitionsCount: count, sourcedRequisitionsCount: count, completedRequisitionsCount: count, rejectedRequisitionsCount: count }).nullish(),
  purchaseOrderStatus: z.object({ newCount: count, pendingCount: count, deliveredCount: count, attachedCount: count, pendingCheckCount: count, checkedCount: count, approvedCount: count, completedCount: count, partiallyLinkedCount: count, linkedCount: count, revisedCount: count, cancelledCount: count }).nullish(),
  salesQuotation: z.object({ local: group, foreign: group }).nullish(), materialDistributionStatus: z.object({ pendingCount: count, distributedCount: count }).nullish() });
const sum = (values: readonly number[]) => values.reduce((total, value) => total + value, 0);
/** The dashboard's figures, worked out from the server's counts. */
export function procurementFigures(input: unknown) {
  const data = procurementSchema.parse(input ?? {});
  const requisitions = data.requisitionReport ?? { newRequisitionsCount: 0, pendingRequisitionsCount: 0, sourcedRequisitionsCount: 0, completedRequisitionsCount: 0, rejectedRequisitionsCount: 0 };
  const orders = data.purchaseOrderStatus ?? { newCount: 0, pendingCount: 0, deliveredCount: 0, attachedCount: 0, pendingCheckCount: 0, checkedCount: 0, approvedCount: 0, completedCount: 0, partiallyLinkedCount: 0, linkedCount: 0, revisedCount: 0, cancelledCount: 0 };
  const local = data.salesQuotation?.local ?? { notProcessedCount: 0, processedCount: 0, notUsedCount: 0 };
  const foreign = data.salesQuotation?.foreign ?? { notProcessedCount: 0, processedCount: 0, notUsedCount: 0 };
  const distribution = data.materialDistributionStatus ?? { pendingCount: 0, distributedCount: 0 };
  return { requisitions, orders, local, foreign, distribution, requisitionTotal: sum(Object.values(requisitions)), orderTotal: sum(Object.values(orders)), localTotal: sum(Object.values(local)), foreignTotal: sum(Object.values(foreign)),
    distributionTotal: distribution.pendingCount + distribution.distributedCount, review: orders.pendingCount + orders.pendingCheckCount + orders.checkedCount, sourcing: local.notProcessedCount + foreign.notProcessedCount };
}
const logisticsSchema = z.object({ numberOfBillingSheets: count, numberOfPendingBillingSheets: count, numberOfShipments: count, numberOfInTransitShipments: count });
const spendSchema = z.array(z.object({ materialPurchaseValue: count, currencySymbol: z.string().nullish() })).nullish().transform((value) => value ?? []);
/** What was spent on purchase orders, one total per currency: amounts in different currencies are never added. */
export function spendByCurrency(rows: readonly { materialPurchaseValue: number; currencySymbol?: string | null | undefined }[]): { currency: string | null; total: number }[] {
  const totals = new Map<string, number>();
  for (const row of rows) totals.set(row.currencySymbol?.trim() ?? "", (totals.get(row.currencySymbol?.trim() ?? "") ?? 0) + row.materialPurchaseValue);
  return [...totals].map(([currency, total]) => ({ currency: currency || null, total }));
}

/** Where requisitions, quotations, purchase orders and distribution stand. Every figure is the server's. */
export function ProcurementDashboardPage() {
  const [period, setPeriod] = useState<Period>("month");
  const range = useMemo(() => periodRange(period), [period]);
  const dashboard = useGetApiV1ReportProcurementDashboardQuery({ ...audit, filter: periodFilter[period] });
  const logisticsQuery = useGetApiV1ReportLogisticsQuery({ ...audit, ...range });
  const spendQuery = useGetApiV1ReportPurchasedPoReportQuery({ ...audit, ...(range.startDate ? { startDate: range.startDate } : {}) });
  const figures = useMemo(() => procurementFigures(dashboard.data), [dashboard.data]);
  const logistics = useMemo(() => { const parsed = logisticsSchema.safeParse(logisticsQuery.data ?? {}); return parsed.success ? parsed.data : null; }, [logisticsQuery.data]);
  const spend = useMemo(() => { const parsed = spendSchema.safeParse(spendQuery.data ?? []); return parsed.success ? parsed.data : []; }, [spendQuery.data]);
  const queries = [dashboard, logisticsQuery, spendQuery];
  const state = { loading: dashboard.isLoading, failed: Boolean(dashboard.error) };
  const shipping = { loading: logisticsQuery.isLoading, failed: Boolean(logisticsQuery.error) };
  const { orders, requisitions } = figures;
  return <article className="min-w-0 space-y-4">
    <DashboardHeading eyebrow="PROCUREMENT" title="Procurement dashboard" description="Requisitions, quotations, purchase orders and distribution." queries={queries} period={period} periods={periodOptions(["all", "week", "month"])} onPeriod={setPeriod} />
    <DashboardState queries={queries}>
      <MetricGrid columns="xl:grid-cols-6">
        <MetricTile label="Purchase requisitions" value={figures.requisitionTotal} note={`${requisitions.pendingRequisitionsCount} pending`} icon={ClipboardList} to="/procurement/requisition" {...state} />
        <MetricTile label="Purchase orders" value={figures.orderTotal} note={`${orders.approvedCount} approved`} icon={ShoppingCart} to="/procurement/purchase-orders" {...state} />
        <MetricTile label="Supplier quotations" value={figures.localTotal + figures.foreignTotal} note={`${figures.foreignTotal} foreign`} icon={BadgeDollarSign} to="/procurement/quotations" {...state} />
        <MetricTile label="Material distribution" value={figures.distributionTotal} note={`${figures.distribution.distributedCount} distributed`} icon={ArrowUpDown} to="/procurement/material-distribution" {...state} />
        <MetricTile label="Billing sheets" value={logistics?.numberOfBillingSheets ?? 0} note={`${logistics?.numberOfPendingBillingSheets ?? 0} pending`} icon={FileSpreadsheet} to="/logistics/billing-sheets" {...shipping} />
        <MetricTile label="Shipments" value={logistics?.numberOfShipments ?? 0} note={`${logistics?.numberOfInTransitShipments ?? 0} in transit`} icon={Ship} to="/logistics/shipment-documents" {...shipping} />
      </MetricGrid>
      <div className="grid gap-3 lg:grid-cols-2">
        <DashboardCard title="Purchase order status" note="Where purchase orders are in their lifecycle." query={dashboard}>
          <BarList share={false} items={[{ label: "New", value: orders.newCount }, { label: "Pending", value: orders.pendingCount, tone: "warning" }, { label: "Delivered", value: orders.deliveredCount }, { label: "Checked", value: orders.checkedCount },
            { label: "Approved", value: orders.approvedCount, tone: "success" }, { label: "Completed", value: orders.completedCount, tone: "success" }, { label: "Cancelled", value: orders.cancelledCount, tone: "danger" }]} /></DashboardCard>
        <DashboardCard title="Purchase order spend" note="Material purchase value from issued purchase orders." query={spendQuery} empty={spend.length === 0} emptyMessage="No purchase orders were issued in this period.">
          <div className="space-y-1">{spendByCurrency(spend).map((item) => <p key={item.currency ?? "none"} className="text-2xl font-semibold">{formatMoney(item.total, item.currency)}</p>)}
            <p className="text-sm text-muted-foreground">{spend.length.toLocaleString()} purchase {spend.length === 1 ? "order" : "orders"}</p></div></DashboardCard>
        <DashboardCard title="Requisitions" note="Requests by status." query={dashboard}>
          <BarList items={[{ label: "New", value: requisitions.newRequisitionsCount }, { label: "Pending", value: requisitions.pendingRequisitionsCount, tone: "warning" }, { label: "Sourced", value: requisitions.sourcedRequisitionsCount },
            { label: "Completed", value: requisitions.completedRequisitionsCount, tone: "success" }, { label: "Rejected", value: requisitions.rejectedRequisitionsCount, tone: "danger" }]} /></DashboardCard>
        <div className="grid gap-3 sm:grid-cols-2">
          <DashboardCard title="Quotations" note="Local and foreign sourcing." query={dashboard}><BarList items={[{ label: "Local", value: figures.localTotal }, { label: "Foreign", value: figures.foreignTotal, tone: "muted" }]} /></DashboardCard>
          <DashboardCard title="Distribution" note="Material distribution." query={dashboard}><BarList items={[{ label: "Pending", value: figures.distribution.pendingCount, tone: "warning" }, { label: "Distributed", value: figures.distribution.distributedCount, tone: "success" }]} /></DashboardCard>
        </div>
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        <DashboardCard title="Approval workload" note="Purchase orders waiting for review." query={dashboard}><Breakdown total={figures.review} rows={[["Pending", orders.pendingCount], ["Pending check", orders.pendingCheckCount], ["Checked", orders.checkedCount], ["Approved", orders.approvedCount]]} /></DashboardCard>
        <DashboardCard title="Sourcing queue" note="Requisitions and quotations needing action." query={dashboard}><Breakdown total={figures.sourcing} rows={[["New requisitions", requisitions.newRequisitionsCount], ["Pending requisitions", requisitions.pendingRequisitionsCount],
          ["Local quotations not processed", figures.local.notProcessedCount], ["Foreign quotations not processed", figures.foreign.notProcessedCount]]} /></DashboardCard>
        <DashboardCard title="Distribution readiness" note="Materials pending or already distributed." query={dashboard}><Breakdown total={figures.distribution.pendingCount} rows={[["Pending distribution", figures.distribution.pendingCount], ["Distributed", figures.distribution.distributedCount],
          ["Linked purchase orders", orders.linkedCount], ["Part-linked purchase orders", orders.partiallyLinkedCount]]} /></DashboardCard>
      </div>
    </DashboardState>
  </article>;
}
