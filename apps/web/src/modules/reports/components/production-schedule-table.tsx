import { Fragment } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { reportNumber } from "../lib/readiness-format";
import { readinessChecks, type ProductionReadinessReport, type ProductionReadinessRow } from "../schemas/production-readiness";
import { ConfigurationBand, ReadinessBadge, ReadinessMark } from "./readiness-status";

function ScheduleRow({ row, paper = false }: { row: ProductionReadinessRow; paper?: boolean }) {
  const line = <TableRow className="readiness-data-row">
    <TableHead scope="row" className="readiness-product"><span className="font-medium">{row.productName}</span>
      <span className="readiness-secondary">{row.productCode || "No code"} · {row.packingStyle}</span></TableHead>
    <TableCell className="readiness-number"><span className="readiness-small-label">Expected batches</span>{reportNumber(row.batches)}</TableCell>
    <TableCell className="readiness-number"><span className="readiness-small-label">Unit price</span>{reportNumber(row.unitPrice, "entered")}
      {row.priceUnit ? <span className="readiness-secondary">{row.priceUnit}</span> : null}</TableCell>
    <TableCell className="readiness-number"><span className="readiness-small-label">Expected yield</span>{reportNumber(row.expectedYield)}</TableCell>
    <TableCell className="readiness-number"><span className="readiness-small-label">Shippers</span>{reportNumber(row.shippers)}
      <span className="readiness-secondary">{reportNumber(row.loosePacks)} loose</span>
      {row.packs !== null ? <span className="readiness-secondary">{reportNumber(row.packs)} packs</span> : null}
      <span className="readiness-secondary">{reportNumber(row.packsPerShipper, "entered")} / shipper</span></TableCell>
    {!paper ? readinessChecks.map(({ key, name }) => <TableCell key={key} className="readiness-desktop-check"><ReadinessMark label={name} value={row.configuration[key]} /></TableCell>) : null}
    <TableCell className="readiness-result"><ReadinessBadge configuration={row.configuration} /></TableCell>
    {!paper ? <TableCell colSpan={13} className="readiness-check-band"><ConfigurationBand configuration={row.configuration} /></TableCell> : null}
  </TableRow>;
  return paper ? <TableBody className="readiness-paper-pair">{line}<TableRow><TableCell colSpan={6} className="readiness-check-band">
    <ConfigurationBand configuration={row.configuration} /></TableCell></TableRow></TableBody> : line;
}

function TotalsRow({ label, totals, grand = false, paper = false }: {
  label: string; totals: ProductionReadinessReport["totals"]; grand?: boolean; paper?: boolean;
}) {
  return <TableRow className={`readiness-total-row${grand ? " readiness-grand-total" : ""}`}>
    <TableHead scope="row" className="readiness-product">{label}</TableHead>
    <TableCell className="readiness-number"><span className="readiness-small-label">Expected batches</span>{reportNumber(totals.batches)}</TableCell>
    <TableCell className="readiness-price-total" />
    <TableCell className="readiness-number"><span className="readiness-small-label">Expected yield</span>{reportNumber(totals.expectedYield)}</TableCell>
    <TableCell className="readiness-number"><span className="readiness-small-label">Shippers</span>{reportNumber(totals.shippers)}
      <span className="readiness-secondary">{reportNumber(totals.loosePacks)} loose</span>
      {totals.packs !== null ? <span className="readiness-secondary">{reportNumber(totals.packs)} packs</span> : null}</TableCell>
    {!paper ? <TableCell colSpan={7} className="readiness-desktop-check" /> : null}<TableCell className="readiness-total-end" />
  </TableRow>;
}

export function ProductionScheduleTable({ report, paper = false, markets = report.markets, paged = false }: {
  report: ProductionReadinessReport; paper?: boolean; markets?: ProductionReadinessReport["markets"]; paged?: boolean;
}) {
  return <Table aria-label="Production schedule and configuration readiness" className={`readiness-table readiness-schedule-table${paper ? " readiness-paper-table" : ""}`}>
    <TableHeader><TableRow>
      <TableHead scope="col" className="readiness-product">Product</TableHead>
      <TableHead scope="col" className="readiness-number">Expected batches</TableHead>
      <TableHead scope="col" className="readiness-number">Unit price</TableHead>
      <TableHead scope="col" className="readiness-number">Expected yield</TableHead>
      <TableHead scope="col" className="readiness-number">Shippers</TableHead>
      {!paper ? readinessChecks.map(({ key, label }) => <TableHead key={key} scope="col" className="readiness-desktop-check">{label}</TableHead>) : null}
      <TableHead scope="col" className="readiness-result">Readiness</TableHead>
    </TableRow></TableHeader>
    {markets.map((group) => paper ? <Fragment key={group.market.id ?? "unrecorded"}>
      <TableBody><TableRow className="readiness-market-heading"><TableHead colSpan={6} scope="rowgroup">{group.market.name}</TableHead></TableRow></TableBody>
      {group.rows.map((row) => <ScheduleRow key={`${row.productId}:${row.productPackingId ?? "none"}`} row={row} paper />)}
      <TableBody><TotalsRow label={`Subtotal · ${group.market.name}`} totals={group.totals} paper /></TableBody>
    </Fragment> : <TableBody key={group.market.id ?? "unrecorded"}>
      <TableRow className="readiness-market-heading"><TableHead colSpan={13} scope="rowgroup">{group.market.name}</TableHead></TableRow>
      {group.rows.map((row) => <ScheduleRow key={`${row.productId}:${row.productPackingId ?? "none"}`} row={row} />)}
      <TotalsRow label={`Subtotal${paged ? " (all rows)" : ""} · ${group.market.name}`} totals={group.totals} />
    </TableBody>)}
    <TableFooter><TotalsRow label="Grand total" totals={report.totals} grand paper={paper} /></TableFooter>
  </Table>;
}
