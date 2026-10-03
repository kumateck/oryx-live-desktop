import { useState } from "react";
import { Link } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDate } from "@/shared/format/dates";
import { useGetExpiringCertificationsQuery, useGetRequalificationDueQuery } from "./relationship-api";

const today = () => new Date().toISOString().slice(0, 10);
const certificatesPage = (id: string) => `/settings/suppliers/${id}?tab=certifications`;
const supplierPage = (id: string) => `/settings/suppliers/${id}`;

export function ComplianceCalendar() {
  const [asOfInput, setAsOfInput] = useState(today);
  const [daysInput, setDaysInput] = useState(60);
  const [filters, setFilters] = useState({ asOf: today(), withinDays: 60 });
  const params = { asOf: `${filters.asOf}T00:00:00Z`, withinDays: filters.withinDays };
  const certificates = useGetExpiringCertificationsQuery(params);
  const requalification = useGetRequalificationDueQuery(params);
  const apply = () => {
    if (asOfInput && Number.isInteger(daysInput) && daysInput >= 0 && daysInput <= 3650) {
      setFilters({ asOf: asOfInput, withinDays: daysInput });
    }
  };
  return <section className="min-w-0 space-y-4">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="eyebrow">PROCUREMENT</p>
      <h1 className="text-xl font-semibold">Supplier compliance</h1>
      <p className="text-sm text-muted-foreground">Certificates expiring and approved suppliers due for requalification.</p></div>
      <form className="flex flex-wrap items-end gap-2" onSubmit={(event) => { event.preventDefault(); apply(); }}>
        <label className="text-xs text-muted-foreground">As of<Input type="date" value={asOfInput} onChange={(event) => setAsOfInput(event.target.value)} className="mt-1 w-36" /></label>
        <label className="text-xs text-muted-foreground">Window (days)<Input type="number" min={0} max={3650} value={daysInput}
          onChange={(event) => setDaysInput(Number(event.target.value))} className="mt-1 w-24" /></label>
        <Button type="submit" size="sm" variant="outline" disabled={!asOfInput || daysInput < 0 || daysInput > 3650}>Apply</Button>
      </form></div>
    <div className="grid min-w-0 gap-4 lg:grid-cols-2">
      <section className="min-w-0 space-y-3 rounded-lg border bg-card p-4"><h2 className="text-sm font-semibold">Certificates expiring</h2>
        {certificates.error ? <p role="alert" className="text-sm text-destructive">{apiErrorMessage(certificates.error)} <Button size="xs" variant="link" onClick={() => void certificates.refetch()}>Retry</Button></p> : null}
        {(certificates.data ?? []).map((item) => <Link key={item.id} to={certificatesPage(item.supplierId)} className="flex min-w-0 flex-wrap items-center justify-between gap-2 rounded-md bg-muted/40 px-3 py-2 hover:bg-muted">
          <div className="min-w-0"><p className="break-words text-sm font-medium">{item.supplierName ?? "Supplier"}</p>
            <p className="break-words text-xs text-muted-foreground">{item.certificateNumber} · {item.issuingBody}</p></div>
          <Badge variant={new Date(item.expiryDate) < new Date(params.asOf) ? "destructive" : "secondary"}>{formatDate(item.expiryDate) ?? "—"}</Badge>
        </Link>)}
        {certificates.isLoading ? <p className="text-sm text-muted-foreground">Loading certificates…</p> : !certificates.data?.length ? <p className="text-sm text-muted-foreground">No certificates in this window.</p> : null}
      </section>
      <section className="min-w-0 space-y-3 rounded-lg border bg-card p-4"><h2 className="text-sm font-semibold">Requalification due</h2>
        {requalification.error ? <p role="alert" className="text-sm text-destructive">{apiErrorMessage(requalification.error)} <Button size="xs" variant="link" onClick={() => void requalification.refetch()}>Retry</Button></p> : null}
        {(requalification.data ?? []).map((item) => <Link key={item.supplierId} to={supplierPage(item.supplierId)} className="flex min-w-0 flex-wrap items-center justify-between gap-2 rounded-md bg-muted/40 px-3 py-2 hover:bg-muted">
          <div className="min-w-0"><p className="break-words text-sm font-medium">{item.supplierName}</p>
            <p className="text-xs text-muted-foreground">Due {formatDate(item.dueDate) ?? "—"}</p></div>
          <Badge variant={item.daysUntilDue < 0 ? "destructive" : "secondary"}>{item.daysUntilDue < 0 ? `${Math.abs(item.daysUntilDue)} days overdue` : `${item.daysUntilDue} days`}</Badge>
        </Link>)}
        {requalification.isLoading ? <p className="text-sm text-muted-foreground">Loading requalifications…</p> : !requalification.data?.length ? <p className="text-sm text-muted-foreground">No requalifications in this window.</p> : null}
      </section>
    </div>
  </section>;
}
