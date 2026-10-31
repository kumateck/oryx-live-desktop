import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDate } from "@/shared/format/dates";
import { useGetApiV1CostingListPricesByProductIdHistoryQuery } from "../api/costing-api";
import { costingAudit, priceIn } from "../lib/costing";

/** Every list price the product has had, newest first, each in its own currency. */
export function PriceHistory({ productId }: { productId: string }) {
  const query = useGetApiV1CostingListPricesByProductIdHistoryQuery({ ...costingAudit, productId });
  const rows = query.currentData ?? [];
  return <section aria-label="Price history" className="space-y-1 text-sm">
    <h3 className="text-xs font-medium text-muted-foreground">Price history</h3>
    {query.isLoading ? <div role="status" aria-label="Loading price history" className="h-10 animate-pulse rounded-md bg-muted" />
      : query.error ? <p role="alert" className="text-destructive">{apiErrorMessage(query.error)}</p>
      : rows.length === 0 ? <p className="text-muted-foreground">No price recorded yet.</p>
      : <ol className="max-h-32 space-y-0.5 overflow-y-auto">{rows.map((row, index) => <li key={`${row.date ?? ""}-${index}`} className="flex justify-between gap-3"><span>{formatDate(row.date) ?? "–"}</span><span className="font-medium">{priceIn(row.price, row.currency)}{row.priceUoM ? ` per ${row.priceUoM}` : ""}</span></li>)}</ol>}
  </section>;
}
