import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/shared/procurement/price";
import { totalsByCurrency, type PricedLine } from "../lib/dispatch";

/**
 * What is being invoiced and at what price. A line uses the customer's agreed price for the product and packing
 * style when one is in effect, and the product's list price otherwise; the badge says which.
 */
export function InvoiceLines({ lines, loading, unavailable, print = false }: { lines: readonly PricedLine[]; loading: boolean; unavailable: boolean; print?: boolean }) {
  const totals = totalsByCurrency(lines);
  const money = (amount: number, currency: string | null) => loading ? "…" : unavailable ? "Unavailable" : formatMoney(amount, currency);
  return <div className={print ? undefined : "overflow-x-auto rounded-lg border bg-card p-3"}>
    <table className={print ? "print-table" : "w-full min-w-[640px] text-sm"}><caption className={print ? undefined : "sr-only"}>Products</caption>
      <thead><tr className={print ? undefined : "border-b text-left text-xs text-muted-foreground"}><th scope="col" className={print ? undefined : "py-1.5 font-medium"}>Product</th><th scope="col" className={print ? undefined : "py-1.5 font-medium"}>Code</th>
        <th scope="col" style={{ textAlign: "right" }} className={print ? undefined : "py-1.5 font-medium"}>Quantity</th><th scope="col" style={{ textAlign: "right" }} className={print ? undefined : "py-1.5 font-medium"}>Unit price</th><th scope="col" style={{ textAlign: "right" }} className={print ? undefined : "py-1.5 font-medium"}>Total</th></tr></thead>
      <tbody>{lines.length === 0 ? <tr><td colSpan={5} className={print ? "print-empty" : "py-4 text-center text-muted-foreground"}>No products.</td></tr> : lines.map((line) => <tr key={line.key} className={print ? undefined : "border-b last:border-0"}>
        <td className={print ? undefined : "py-1.5"}><span className="font-medium">{line.productName}</span>{line.genericName ? <span className="block text-xs text-muted-foreground">{line.genericName}</span> : null}
          {print ? null : <Badge className="mt-1" variant={unavailable ? "destructive" : line.source === "agreement" ? "default" : "outline"}>{unavailable ? "Pricing unavailable" : line.source === "agreement" ? "Agreed price" : "List price"}</Badge>}</td>
        <td className={print ? undefined : "py-1.5"}>{line.code ?? "–"}</td><td style={{ textAlign: "right" }} className={print ? undefined : "py-1.5"}>{line.quantity.toLocaleString()}</td>
        <td style={{ textAlign: "right" }} className={print ? undefined : "py-1.5"}>{money(line.unitPrice, line.currency)}</td><td style={{ textAlign: "right" }} className={print ? undefined : "py-1.5 font-medium"}>{money(line.quantity * line.unitPrice, line.currency)}</td></tr>)}</tbody>
      {!loading && !unavailable && totals.length > 0 ? <tfoot>{totals.map((total) => <tr key={total.currency ?? "none"}><td colSpan={4} style={{ textAlign: "right" }} className={print ? undefined : "py-1.5 font-medium"}>Total{total.currency ? ` (${total.currency})` : ""}</td>
        <td style={{ textAlign: "right" }} className={print ? undefined : "py-1.5 font-semibold"}>{formatMoney(total.amount, total.currency)}</td></tr>)}</tfoot> : null}
    </table>
    {unavailable ? <p role="alert" className="mt-2 text-sm text-destructive">The customer's agreed prices could not be checked, so no prices are shown.</p> : null}
  </div>;
}
