import { Fragment, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/shared/navigation/page-header";
import { PrintButton } from "@/shared/print/print-button";
import { PrintPreviewDialog } from "@/shared/print/print-preview-dialog";
import { PrintHeader } from "@/shared/print/print-sheet";
import { Skeleton } from "@/shared/skeleton/skeleton";
import { useMonthlyPlan } from "../hooks/use-monthly-plan";
import { groupByMarket, noMarket, planTotals, shiftMonth, type MonthlyPlanRow } from "../lib/monthly-plan";
import { schedulesPath } from "../lib/schedule-access";

const number = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });
const show = (value: number | null) => value === null ? "–" : number.format(value);
const monthLabel = (month: Date) => month.toLocaleDateString(undefined, { month: "long", year: "numeric" });
const thisMonth = () => shiftMonth(new Date(), 0);

/** The plan as one table: a heading row per market, a row per product and packing style, and the grand total. */
function PlanTable({ rows, printed = false }: { rows: readonly MonthlyPlanRow[]; printed?: boolean }) {
  const totals = planTotals(rows);
  const cell = printed ? "" : "px-3 py-2";
  const right = `${cell} text-right tabular-nums`;
  return <table className={printed ? "print-table" : "w-full border-collapse text-left text-sm"}>
    <thead className={printed ? undefined : "bg-muted text-xs font-semibold uppercase tracking-wide text-muted-foreground"}><tr>
      <th scope="col" className={cell}>Product</th><th scope="col" className={right}>Expected batches</th><th scope="col" className={right}>Unit price</th>
      <th scope="col" className={right}>Expected yield</th><th scope="col" className={right}>Shippers</th><th scope="col" className={right}>Loose</th>
    </tr></thead>
    <tbody>
      {groupByMarket(rows).map((group) => <Fragment key={group.market}>
        <tr className={printed ? undefined : "border-t bg-muted/50"}><th scope="colgroup" colSpan={6} className={`${cell} text-left font-semibold`}>{group.market}</th></tr>
        {group.rows.map((row) => <tr key={row.key} className={printed ? undefined : "border-t"}>
          <td className={cell}><span className="font-medium">{row.productName}</span>
            {printed ? <small>{[row.productCode, row.packingStyle].filter(Boolean).join(" · ")}</small>
              : <span className="block text-xs text-muted-foreground">{[row.productCode, row.packingStyle].filter(Boolean).join(" · ")}</span>}</td>
          <td className={right}>{show(row.batches)}</td>
          <td className={right}>{row.unitPrice === null ? "–" : `${number.format(row.unitPrice)}${row.priceUoM ? ` ${row.priceUoM}` : ""}`}</td>
          <td className={right}>{show(row.expectedYield)}</td><td className={right}>{show(row.shippers)}</td><td className={right}>{show(row.loose)}</td>
        </tr>)}
      </Fragment>)}
    </tbody>
    <tfoot className={printed ? undefined : "border-t-2 font-semibold"}><tr>
      <td className={cell}>Grand total</td><td className={right}>{show(totals.batches)}</td><td className={cell} />
      <td className={right}>{show(totals.expectedYield)}</td><td className={right}>{show(totals.shippers)}</td><td className={right}>{show(totals.loose)}</td>
    </tr></tfoot>
  </table>;
}

function PlanPrint({ month, rows, onClose }: { month: Date; rows: readonly MonthlyPlanRow[]; onClose: () => void }) {
  return <PrintPreviewDialog title={`${monthLabel(month)} production plan`} onClose={onClose}>
    <PrintHeader title="Production plan" reference={monthLabel(month)} aside={<p>Production · Quality Assurance · Quality Control</p>} />
    <PlanTable rows={rows} printed />
  </PrintPreviewDialog>;
}

/**
 * The month's production plan shared by Production, QA and QC: batches expected per market, product and
 * packing style, the packs they should yield and how many shippers that fills.
 */
export function MonthlyReport() {
  const [month, setMonth] = useState(thisMonth);
  const plan = useMonthlyPlan(month);
  const marketMissing = plan.rows.some((row) => row.market === noMarket);
  return <section className="min-w-0 space-y-4">
    <PageHeader title="Monthly production schedule" crumbs={[{ label: "Production schedules", to: schedulesPath }, { label: "Monthly report" }]}
      actions={<div className="flex flex-wrap items-center gap-2">
        <div role="group" aria-label="Month" className="flex items-center gap-1 rounded-md border p-0.5">
          <Button type="button" size="icon" variant="ghost" aria-label="Previous month" onClick={() => setMonth((value) => shiftMonth(value, -1))}><ChevronLeft /></Button>
          <span aria-live="polite" className="min-w-32 px-1 text-center text-sm font-semibold">{monthLabel(month)}</span>
          <Button type="button" size="icon" variant="ghost" aria-label="Next month" onClick={() => setMonth((value) => shiftMonth(value, 1))}><ChevronRight /></Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setMonth(thisMonth())}>This month</Button>
        </div>
        {plan.rows.length ? <PrintButton preview={(close) => <PlanPrint month={month} rows={plan.rows} onClose={close} />} /> : null}
      </div>} />
    <p className="text-sm text-muted-foreground">Every batch of a schedule that runs during the month, except cancelled batches. A half batch counts as half.</p>
    {marketMissing ? <p className="rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-sm">
      The schedule list the server sends does not say which market a batch is for, so those batches are grouped under “{noMarket}”.</p> : null}
    {plan.loading ? <Skeleton className="h-72 w-full" />
      : plan.error ? <div role="alert" className="mx-auto max-w-md space-y-3 py-12 text-center">
        <h2 className="text-lg font-semibold">The schedules could not be loaded</h2><p className="text-sm text-muted-foreground">{plan.error}</p>
        <Button type="button" size="sm" variant="outline" onClick={plan.retry}>Retry</Button></div>
      : plan.rows.length === 0 ? <p className="py-12 text-center text-sm text-muted-foreground">No production is planned for {monthLabel(month)}.</p>
      : <div className="overflow-x-auto rounded-lg border"><PlanTable rows={plan.rows} /></div>}
  </section>;
}
