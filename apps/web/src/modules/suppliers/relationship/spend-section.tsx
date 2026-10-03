import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDate } from "@/shared/format/dates";
import { useGetSpendQuery } from "./relationship-api";

const today = () => new Date().toISOString().slice(0, 10);
const yearStart = () => `${new Date().getFullYear()}-01-01`;

export function SpendSection({ supplierId }: { supplierId: string }) {
  const [from, setFrom] = useState(yearStart);
  const [to, setTo] = useState(today);
  const [range, setRange] = useState({ from: yearStart(), to: today() });
  const spend = useGetSpendQuery({ supplierId, from: `${range.from}T00:00:00Z`, to: `${range.to}T23:59:59Z` });
  return <section className="min-w-0 space-y-3 rounded-lg border bg-card p-4">
    <h2 className="text-sm font-semibold">Approved-payment spend</h2>
    <form className="flex flex-wrap items-end gap-2" onSubmit={(event) => { event.preventDefault(); if (from <= to) setRange({ from, to }); }}>
      <label className="text-xs text-muted-foreground">From<Input aria-label="Spend from" type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="mt-1 w-36" /></label>
      <label className="text-xs text-muted-foreground">To<Input aria-label="Spend to" type="date" value={to} onChange={(event) => setTo(event.target.value)} className="mt-1 w-36" /></label>
      <Button type="submit" size="sm" variant="outline" disabled={!from || !to || from > to}>Apply</Button>
    </form>
    {spend.error ? <p role="alert" className="text-sm text-destructive">{apiErrorMessage(spend.error)} <Button size="xs" variant="link" onClick={() => void spend.refetch()}>Retry</Button></p> : null}
    {spend.data ? <><p className="text-xl font-semibold">{spend.data.totalBase.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">{spend.data.baseCurrencyName ?? ""}</span></p>
      <div className="grid gap-1">{spend.data.months.map((month) => <div key={month.month} className="flex justify-between gap-3 rounded-md bg-muted/40 px-3 py-2 text-sm">
        <span>{formatDate(month.month) ?? month.month}</span><span>{month.totalBase.toLocaleString()}</span></div>)}</div>
      {spend.data.dataQualityWarnings.map((warning) => <p key={warning} className="text-xs text-amber-700 dark:text-amber-300">{warning}</p>)}</> :
      <p className="text-sm text-muted-foreground">{spend.isLoading ? "Loading spend…" : "No spend data available."}</p>}
  </section>;
}
