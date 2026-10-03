import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyFact, KeyFacts } from "@/shared/detail/key-facts";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatMoney } from "@/shared/procurement/price";
import { useGetCustomerCreditQuery, useGetCustomerSummaryQuery } from "../api/customer-api";
import { creditSchema, summarySchema } from "../schemas/customer-schema";

/** How much the customer has ordered and owes, and whether a further order would stay inside their credit limit. */
export function OverviewPanel({ customerId }: { customerId: string }) {
  const [typed, setTyped] = useState("");
  // The figure is only asked of the server once it is a real amount.
  const extra = Number(typed) > 0 ? Number(typed) : 0;
  const creditQuery = useGetCustomerCreditQuery({ customerId, additionalOrderValue: extra });
  const summaryQuery = useGetCustomerSummaryQuery(customerId);
  const credit = useMemo(() => { const parsed = creditSchema.safeParse(creditQuery.data ?? {}); return parsed.success ? parsed.data : null; }, [creditQuery.data]);
  const summary = useMemo(() => { const parsed = summarySchema.safeParse(summaryQuery.data ?? {}); return parsed.success ? parsed.data : null; }, [summaryQuery.data]);
  const currency = credit?.preferredCurrencyName ?? null;
  const error = creditQuery.error ?? summaryQuery.error;
  if (creditQuery.isLoading || summaryQuery.isLoading) return <div role="status" aria-label="Loading the credit overview" className="h-48 animate-pulse rounded-lg bg-muted" />;
  return <div className="space-y-4">
    {error ? <p role="alert" className="text-sm text-destructive">{apiErrorMessage(error)}</p> : null}
    <KeyFacts>
      <KeyFact label="Lifetime orders" value={summary ? summary.lifetimeOrderCount.toLocaleString() : "–"} />
      <KeyFact label="Total order value" value={formatMoney(summary?.totalOrderValue, currency)} note={summary ? `Average ${formatMoney(summary.averageOrderValue, currency)}` : undefined} />
      <KeyFact label="Outstanding" value={formatMoney(credit?.outstandingInPreferredCurrency, currency)} />
      <KeyFact label="On-time delivery" value={summary?.onTimeDeliveryRate === null || !summary ? "–" : `${summary.onTimeDeliveryRate.toFixed(1)}%`} />
    </KeyFacts>
    <section className="space-y-3 rounded-lg border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2"><div><h2 className="text-sm font-semibold">Credit position</h2><p className="text-xs text-muted-foreground">Only approved payments reduce what is outstanding.</p></div>
        {credit ? <Badge variant={credit.isWithinCreditLimit ? "secondary" : "destructive"}>{credit.isWithinCreditLimit ? "Within limit" : "Limit exceeded"}</Badge> : null}</div>
      <KeyFacts>
        <KeyFact label="Credit limit" value={credit?.creditLimit === null || !credit ? "Not set" : formatMoney(credit.creditLimit, currency)} />
        <KeyFact label="Available credit" value={credit?.availableCredit === null || !credit ? "–" : formatMoney(credit.availableCredit, currency)} note={extra > 0 ? `After an order of ${formatMoney(extra, currency)}` : undefined} />
      </KeyFacts>
      <div className="max-w-xs space-y-1.5"><Label htmlFor="credit-check">Check an order value</Label>
        <Input id="credit-check" type="number" min={0} step="any" inputMode="decimal" placeholder="0.00" value={typed} onChange={(event) => setTyped(event.target.value)} />
        <p className="text-xs text-muted-foreground">Advisory only: it shows whether an order of this value would stay within the limit. Nothing is saved.</p></div>
      <table className="w-full text-sm"><caption className="sr-only">Outstanding by currency</caption>
        <thead><tr className="border-b text-left text-xs text-muted-foreground"><th scope="col" className="py-1.5 font-medium">Currency</th><th scope="col" className="py-1.5 text-right font-medium">Document total</th><th scope="col" className="py-1.5 text-right font-medium">Approved paid</th><th scope="col" className="py-1.5 text-right font-medium">Outstanding</th></tr></thead>
        <tbody>{(credit?.outstandingByCurrency ?? []).length === 0 ? <tr><td colSpan={4} className="py-3 text-center text-muted-foreground">Nothing is outstanding.</td></tr>
          : credit?.outstandingByCurrency.map((item, index) => <tr key={item.currencyId ?? index} className="border-b last:border-0"><td className="py-1.5">{item.currencyName ?? "–"}</td><td className="py-1.5 text-right">{formatMoney(item.documentTotal, item.currencySymbol)}</td>
            <td className="py-1.5 text-right">{formatMoney(item.amountPaid, item.currencySymbol)}</td><td className="py-1.5 text-right font-medium">{formatMoney(item.outstandingBalance, item.currencySymbol)}</td></tr>)}</tbody></table>
    </section>
  </div>;
}
