import { useMemo, useState } from "react";
import { ClipboardCheck, ClipboardList, FileCheck2, ListChecks, PackageCheck, PackageSearch, Send, Truck, Users } from "lucide-react";
import { z } from "zod";
import { reportsApi } from "@/shared/api/generated/reports";
import { BarList, DashboardCard, DashboardHeading, DashboardState, MetricGrid, MetricTile } from "@/shared/dashboard/dashboard-kit";
import { periodRange, type Period } from "@/shared/dashboard/periods";

const count = z.number().nullish().transform((value) => typeof value === "number" && Number.isFinite(value) ? value : 0);
const text = z.string().nullish().transform((value) => value?.trim() || null);
const list = <T extends z.ZodType>(item: T) => z.array(item).nullish().transform((value) => value ?? []);
const transferCounts = z.object({ inProgressCount: count, approvedCount: count }).nullish();

export const fgtnSchema = z.object({ totalCustomers: count,
  productCount: z.object({ totalProducts: count, betaProducts: count, nonBetaProducts: count }).nullish(),
  productionOrders: z.object({ totalProductionOrders: count, pendingProductionOrders: count, partialPackingReady: count, fullPackingReady: count }).nullish(),
  finishedGoodsTransferNotes: z.object({ totalFgtnTransferNotes: count, pendingTransferNote: count, acceptedTransferNote: count }).nullish(),
  inventorySummary: list(z.object({ uom: text, availableQuantity: count, batchCount: count })),
  dispatchPipeline: z.object({ total: count, awaitingArrival: count, arrived: count }).nullish() });
const approvalsSchema = list(z.object({ fromDepartment: text, pendingApproval: count, approved: count, averageAgingDays: count }));
const ordersSchema = list(z.object({ statusName: text, orderCount: count, allocatedCount: count, loaded: count, delivered: count }));
const transfersSchema = z.object({ stockTransfers: z.object({ incoming: transferCounts, outgoing: transferCounts }).nullish() });
const stockSchema = list(z.object({ productName: text, productCode: text, productionDepartment: text, warehouse: text, numberOfBatches: count, totalQuantity: count, uomName: text }));
const read = <T extends z.ZodType>(schema: T, data: unknown, empty: unknown): z.infer<T> => { const parsed = schema.safeParse(data ?? empty); return parsed.success ? parsed.data : schema.parse(empty); };

/** A total the server left at zero is made up from its parts, so a tile never reads 0 above non-zero parts. */
export const totalOr = (total: number, ...parts: number[]) => total || parts.reduce((sum, part) => sum + part, 0);
/** Transfers still to be issued: in progress or approved, in either direction. */
export function pendingTransfers(data: z.infer<typeof transfersSchema>): number {
  const { incoming, outgoing } = data.stockTransfers ?? {};
  return (incoming?.inProgressCount ?? 0) + (incoming?.approvedCount ?? 0) + (outgoing?.inProgressCount ?? 0) + (outgoing?.approvedCount ?? 0);
}

// The server's date filter for this report: 0 all, 1 this week, 2 this month.
const periods = [{ value: "all", label: "All" }, { value: "week", label: "This week" }, { value: "month", label: "This month" }] as const;
type FgtnPeriod = (typeof periods)[number]["value"];
const dateFilter: Record<FgtnPeriod, 0 | 1 | 2> = { all: 0, week: 1, month: 2 };
const context = { module: "Finished Goods Warehouse", subModule: "Dashboard" };

/** Finished goods at a glance: products, customers, production orders, transfer notes, dispatch and stock. */
export function FgtnDashboardPage() {
  const [period, setPeriod] = useState<FgtnPeriod>("month");
  const range = useMemo(() => periodRange(period as Period), [period]);
  const kpi = reportsApi.useGetApiV1ReportFgtnDashboardKpiQuery({ ...context, dateFilter: dateFilter[period] });
  const approvalQuery = reportsApi.useGetApiV1ReportKpiFgtnPendingApprovalQuery({ ...context, ...range });
  const orderQuery = reportsApi.useGetApiV1ReportKpiProductionOrderDeliveryStatusQuery({ ...context, ...range });
  const transferQuery = reportsApi.useGetApiV1ReportWarehouseDashboardQuery({ ...context, filter: period === "all" ? 3 : dateFilter[period] });
  const stockQuery = reportsApi.useGetApiV1ReportProductStockSummaryQuery(context);
  const queries = [kpi, approvalQuery, orderQuery, transferQuery, stockQuery];

  const data = useMemo(() => read(fgtnSchema, kpi.data, {}), [kpi.data]);
  const approvals = useMemo(() => read(approvalsSchema, approvalQuery.data, []), [approvalQuery.data]);
  const orders = useMemo(() => read(ordersSchema, orderQuery.data, []), [orderQuery.data]);
  const transfers = useMemo(() => pendingTransfers(read(transfersSchema, transferQuery.data, {})), [transferQuery.data]);
  // The twenty largest holdings.
  const stock = useMemo(() => [...read(stockSchema, stockQuery.data, [])].sort((a, b) => b.totalQuantity - a.totalQuantity), [stockQuery.data]);
  const products = data.productCount, production = data.productionOrders, notes = data.finishedGoodsTransferNotes, dispatch = data.dispatchPipeline;
  const state = { loading: kpi.isLoading, failed: Boolean(kpi.error) };
  const pendingApproval = approvals.reduce((sum, row) => sum + row.pendingApproval, 0);
  const orderCount = orders.reduce((sum, row) => sum + row.orderCount, 0);
  const delivered = orders.reduce((sum, row) => sum + row.delivered, 0);
  const batches = data.inventorySummary.reduce((sum, row) => sum + row.batchCount, 0);
  const inventory = data.inventorySummary.map((row) => `${row.availableQuantity.toLocaleString()} ${row.uom ?? "units"}`).join(" · ");

  return <article className="min-w-0 space-y-4">
    <DashboardHeading eyebrow="FINISHED GOODS WAREHOUSE" title="Finished goods dashboard" description="Production readiness and transfer-note operations at a glance." queries={queries} period={period} periods={periods} onPeriod={setPeriod} />
    <DashboardState queries={queries}>
      <MetricGrid>
        <MetricTile label="Products" value={totalOr(products?.totalProducts ?? 0, products?.betaProducts ?? 0, products?.nonBetaProducts ?? 0)} note="Finished-goods product catalogue" icon={PackageCheck} to="/warehouse/approved-products" {...state} />
        <MetricTile label="Customers" value={data.totalCustomers} note="Registered finished-goods customers" icon={Users} to="/crm/customers" {...state} />
        <MetricTile label="Production orders" value={totalOr(production?.totalProductionOrders ?? 0, production?.pendingProductionOrders ?? 0, production?.partialPackingReady ?? 0, production?.fullPackingReady ?? 0)} note="Orders in this period" icon={ClipboardList} to="/crm/production-order" {...state} />
        <MetricTile label="Transfer notes" value={totalOr(notes?.totalFgtnTransferNotes ?? 0, notes?.pendingTransferNote ?? 0, notes?.acceptedTransferNote ?? 0)} note="Finished-goods transfer notes" icon={FileCheck2} to="/warehouse/finished-goods-transfer-notes" {...state} />
      </MetricGrid>
      <MetricGrid columns="xl:grid-cols-5">
        <MetricTile label="Notes awaiting approval" value={pendingApproval} note="Transfer notes awaiting approval" icon={ClipboardCheck} tone={pendingApproval > 0 ? "warning" : "none"} loading={approvalQuery.isLoading} failed={Boolean(approvalQuery.error)} />
        <MetricTile label="Order delivery status" value={orderCount} note={`${delivered.toLocaleString()} delivered`} icon={Truck} loading={orderQuery.isLoading} failed={Boolean(orderQuery.error)} />
        <MetricTile label="Stock transfers pending" value={transfers} note="In progress or approved for issue" icon={ListChecks} loading={transferQuery.isLoading} failed={Boolean(transferQuery.error)} />
        <MetricTile label="Inventory batches" value={batches} note={inventory || "No available finished-goods inventory"} icon={PackageSearch} {...state} />
        <MetricTile label="Dispatch pipeline" value={dispatch?.total ?? 0} note={`${(dispatch?.awaitingArrival ?? 0).toLocaleString()} awaiting arrival · ${(dispatch?.arrived ?? 0).toLocaleString()} arrived`} icon={Send} {...state} />
      </MetricGrid>
      <div className="grid gap-3 lg:grid-cols-3">
        <DashboardCard title="Production order pipeline" note="Readiness stages for finished-goods production orders." query={kpi}><BarList items={[{ label: "Pending", value: production?.pendingProductionOrders ?? 0, tone: "warning" },
          { label: "Partially packing ready", value: production?.partialPackingReady ?? 0 }, { label: "Fully packing ready", value: production?.fullPackingReady ?? 0, tone: "success" }]} /></DashboardCard>
        <DashboardCard title="Transfer note status" note="Pending against accepted transfer notes." query={kpi}><BarList items={[{ label: "Pending transfer notes", value: notes?.pendingTransferNote ?? 0, tone: "warning" }, { label: "Accepted transfer notes", value: notes?.acceptedTransferNote ?? 0, tone: "success" }]} /></DashboardCard>
        <DashboardCard title="Product mix" note="Beta and non-beta products in the catalogue." query={kpi}><BarList items={[{ label: "Beta products", value: products?.betaProducts ?? 0 }, { label: "Non-beta products", value: products?.nonBetaProducts ?? 0, tone: "success" }]} /></DashboardCard>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <DashboardCard title="Approvals by department" note="Transfer notes waiting, and how long they have waited on average." query={approvalQuery} empty={approvals.length === 0} emptyMessage="No transfer notes in this period.">
          <BarList share={false} items={approvals.map((row, index) => ({ label: row.fromDepartment ?? `Department ${index + 1}`, value: row.pendingApproval, tone: "warning" as const, note: `${row.approved.toLocaleString()} approved · ${row.averageAgingDays.toFixed(1)} days average` }))} />
        </DashboardCard>
        <DashboardCard title="Orders by delivery status" note="Production orders allocated, loaded and delivered." query={orderQuery} empty={orders.length === 0} emptyMessage="No production orders in this period.">
          <BarList share={false} items={orders.map((row, index) => ({ label: row.statusName ?? `Status ${index + 1}`, value: row.orderCount, note: `${row.allocatedCount.toLocaleString()} allocated · ${row.loaded.toLocaleString()} loaded · ${row.delivered.toLocaleString()} delivered` }))} />
        </DashboardCard>
      </div>
      <DashboardCard title="Stock by department" note="Finished-goods stock by production department and warehouse. Not narrowed by the period." query={stockQuery} empty={stock.length === 0} emptyMessage="No finished-goods stock recorded.">
        <div className="overflow-x-auto"><table className="w-full min-w-[36rem] text-sm"><thead><tr className="text-left text-xs text-muted-foreground"><th scope="col" className="py-1 font-medium">Product</th><th scope="col" className="py-1 font-medium">Department</th><th scope="col" className="py-1 font-medium">Warehouse</th>
          <th scope="col" className="py-1 text-right font-medium">Batches</th><th scope="col" className="py-1 text-right font-medium">Quantity</th></tr></thead>
          <tbody className="divide-y">{stock.slice(0, 20).map((row, index) => <tr key={`${row.productCode ?? row.productName ?? "product"}-${row.warehouse ?? "warehouse"}-${index}`}>
            <th scope="row" className="py-1.5 text-left font-medium">{row.productName ?? "Unnamed product"}{row.productCode ? <span className="block text-xs font-normal text-muted-foreground">{row.productCode}</span> : null}</th>
            <td className="py-1.5">{row.productionDepartment ?? "Unassigned"}</td><td className="py-1.5">{row.warehouse ?? "Unassigned"}</td><td className="py-1.5 text-right">{row.numberOfBatches.toLocaleString()}</td><td className="py-1.5 text-right">{row.totalQuantity.toLocaleString()} {row.uomName ?? "units"}</td></tr>)}</tbody></table></div>
        {stock.length > 20 ? <p className="text-xs text-muted-foreground">Showing the 20 largest of {stock.length} holdings.</p> : null}
      </DashboardCard>
    </DashboardState>
  </article>;
}
