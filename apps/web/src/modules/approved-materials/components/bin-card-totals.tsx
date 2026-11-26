import { KeyFact, KeyFacts } from "@/shared/detail/key-facts";
import { toLargestUnit } from "@/shared/units/quantity";
import type { BinCardTotals } from "../schemas/approved-material-schema";

const amount = (value: number, unit: string | null) => toLargestUnit(value, unit, "calculated")?.text ?? String(value);

/** The whole card's totals: received − issued = balance, checked against the stock on the store's shelves. */
export function BinCardTotalsSummary({ totals }: { totals: BinCardTotals }) {
  return <div className="space-y-2">
    <KeyFacts>
      <KeyFact label="Received" value={amount(totals.received, totals.unit)} />
      <KeyFact label="Issued" value={amount(totals.issued, totals.unit)} />
      <KeyFact label="Bin card balance" value={amount(totals.closing, totals.unit)} />
      <KeyFact label="On shelves" value={amount(totals.shelfStock, totals.unit)} />
    </KeyFacts>
    {totals.difference !== 0 ? <p role="alert" className="rounded-md border border-destructive/50 p-3 text-sm">
      The bin card balance and the stock on shelves differ by <strong>{amount(Math.abs(totals.difference), totals.unit)}</strong>. Review the ledger movements and shelf quantities.
    </p> : null}
  </div>;
}
