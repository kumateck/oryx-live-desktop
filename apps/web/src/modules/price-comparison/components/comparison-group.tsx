import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatMoney, formatUnitPrice } from "@/shared/procurement/price";
import { toLargestUnit } from "@/shared/units/quantity";
import { lowestQuotes, quoteBlock, quoteCost } from "../lib/comparison";
import type { ComparisonGroup } from "../schemas/comparison-schema";

/** One material: every supplier's quote side by side, with one to be chosen. */
export function ComparisonGroupCard({ group, chosen, disabled, onChoose }: { group: ComparisonGroup; chosen: string | null; disabled: boolean; onChoose: ((quoteKey: string) => void) | null }) {
  const lowest = useMemo(() => lowestQuotes(group), [group]);
  const quantity = toLargestUnit(group.quantity, group.unit, "calculated")?.text ?? String(group.quantity);
  return <section aria-label={group.materialName} className="min-w-0 rounded-lg border bg-card">
    <header className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
      <div className="min-w-0"><h2 className="break-words font-semibold">{group.materialName}</h2>
        <p className="text-xs text-muted-foreground">{group.materialCode ?? "No code"} · {quantity} needed · {group.quotes.length} {group.quotes.length === 1 ? "quote" : "quotes"}</p></div>
      {chosen ? <Badge>Supplier chosen</Badge> : <Badge variant="outline">Not decided</Badge>}
    </header>
    {lowest.mixedCurrencies ? <p role="note" className="border-b bg-muted/50 px-4 py-2 text-xs text-muted-foreground">These quotes are in different currencies, so the lowest is not marked. Compare them at your exchange rate.</p> : null}
    <Table>
      <TableHeader><TableRow>
        {onChoose ? <TableHead className="w-12"><span className="sr-only">Choose</span></TableHead> : null}
        <TableHead>Supplier</TableHead><TableHead>Manufacturer</TableHead><TableHead>Unit price</TableHead><TableHead>Cost for {quantity}</TableHead>
      </TableRow></TableHeader>
      <TableBody>{group.quotes.map((quote) => {
        const block = quoteBlock(quote);
        const id = `${group.id}:${quote.key}`;
        return <TableRow key={quote.key} data-state={chosen === quote.key ? "selected" : undefined}>
          {onChoose ? <TableCell><input type="radio" id={id} name={group.id} className="size-4 accent-primary" aria-label={`Choose ${quote.supplierName} for ${group.materialName}`}
            checked={chosen === quote.key} disabled={disabled || block !== null} onChange={() => onChoose(quote.key)} /></TableCell> : null}
          <TableCell><label htmlFor={id} className="block min-w-0"><span className="break-words font-medium">{quote.supplierName}</span>
            <span className="block text-xs text-muted-foreground">{[quote.country, quote.sourceRequisitionCode ? `Request ${quote.sourceRequisitionCode}` : null].filter(Boolean).join(" · ") || "Country not recorded"}</span></label></TableCell>
          <TableCell>{quote.manufacturer ?? <span className="text-muted-foreground">Not set</span>}</TableCell>
          <TableCell><span className="font-medium">{formatUnitPrice(quote.price, quote.currency, quote.priceUnit)}</span>
            {lowest.keys.has(quote.key) ? <Badge variant="outline" className="ml-2 border-emerald-500/60 text-emerald-700 dark:text-emerald-400">Lowest</Badge> : null}</TableCell>
          <TableCell>{block ? <span className="text-xs text-destructive">{block}</span> : formatMoney(quoteCost(group, quote), quote.currency)}</TableCell>
        </TableRow>;
      })}</TableBody>
    </Table>
  </section>;
}
