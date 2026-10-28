import type { CashflowDirection, CurrencyConfiguration } from "../api/finance-api";
import { formatMoney } from "@/shared/procurement/price";
import { formatDate } from "@/shared/format/dates";
const windows = [{ key: "totalOutstandingBase", label: "Total outstanding" }, { key: "overdue", label: "Overdue" }, { key: "next7Days", label: "Next 7 days" }, { key: "days8To30", label: "Days 8–30" }, { key: "days31To60", label: "Days 31–60" }, { key: "days61To90", label: "Days 61–90" }, { key: "beyond90Days", label: "Beyond 90 days" }, { key: "dueDateUnknown", label: "Due date unknown" }] as const;
export function CashflowSummary({ inflows, outflows, currency }: { inflows: CashflowDirection | undefined; outflows: CashflowDirection | undefined; currency: string }) {
  return <section className="space-y-3"><h2 className="font-semibold">Projected cashflow · {currency}</h2>
    <table className="w-full table-fixed text-sm"><thead><tr className="border-b"><th className="p-2 text-left">Due window</th><th className="p-2 text-right">Projected inflows</th><th className="p-2 text-right">Projected outflows</th></tr></thead><tbody>{windows.map((window) => <tr key={window.key} className="border-b last:border-0"><th scope="row" className="p-2 text-left font-normal">{window.label}</th><td className="p-2 text-right tabular-nums break-words">{formatMoney(inflows?.[window.key])}</td><td className="p-2 text-right tabular-nums break-words">{formatMoney(outflows?.[window.key])}</td></tr>)}</tbody></table>
  </section>;
}
export function ExchangeRates({ configuration }: { configuration: CurrencyConfiguration }) {
  return <section className="space-y-2"><h2 className="font-semibold">Exchange rates · {configuration.baseCurrency?.name ?? "No base currency configured"}</h2>
    <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{(configuration.rates ?? []).map((rate, index) => <li key={rate.currency?.id ?? index} className="rounded-md border p-3"><p className="font-medium">{rate.currency?.name ?? "Unnamed currency"}</p><p>{rate.rateToBase == null ? "No rate recorded" : `${rate.rateToBase} to base`}</p><p className="text-xs text-muted-foreground">{formatDate(rate.effectiveDate) ?? "No effective date recorded"}</p></li>)}</ul>
    {!configuration.rates?.length ? <p className="text-muted-foreground">No exchange rates returned.</p> : null}
  </section>;
}
