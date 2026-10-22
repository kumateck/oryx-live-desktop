import { useEffect, useMemo, useState } from "react";
import { FilePlus2, Pencil, Plus, Trash2 } from "lucide-react";
import { Link } from "react-router";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { TableMenu, TableMenuHeader } from "@/shared/actions";
import { servicesApi } from "@/shared/api/generated/services";
import { settingsApi } from "@/shared/api/generated/settings";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { ServerDataTable, dataTableColumns, pageMeta, useServerTable } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDate } from "@/shared/format/dates";
import { AsyncOptionPicker } from "@/shared/forms/async-option-picker";
import { Store, storeIds, stores } from "@/shared/inventory/stores";
import { useItemChoices, type ItemChoice } from "@/shared/inventory/use-item-choices";
import { amount, isoDay, quotationPageSchema, quotationSchema, quotationStatusLabel, serviceAudit, serviceKeys, type Quotation } from "../lib/service-procurement";

interface ProviderRow { id: string; jobOrderId: string; providerId: string; provider: string; sentAt: string | null; responded: boolean; respondedAt: string | null }
const providerColumn = dataTableColumns<ProviderRow>();
const quoteColumn = dataTableColumns<Quotation>();
const send = { kind: "all" as const, permissions: [serviceKeys.responsesView, serviceKeys.responseSend] };

function useCollections(names: string[]) {
  const [load, state] = settingsApi.usePostApiV1CollectionMutation();
  const key = names.join("|");
  useEffect(() => { void load({ ...serviceAudit, body: key.split("|") }); }, [key, load]);
  return (name: string) => (state.data?.[name] ?? []).flatMap((c) => c.id ? [{ value: c.id, label: c.name ?? "Unnamed" }] : []);
}

interface Charge { key: string; name: string; cost: string }
interface Material { key: string; item: ItemChoice | null; quantity: string; price: string }
let counter = 0;
const k = () => `r-${String(++counter)}`;

function RecordQuotationDialog({ row, onClose }: { row: ProviderRow; onClose: () => void }) {
  const permission = usePermissionAction(send);
  const collections = useCollections(["Currency", "Charge"]);
  const [store, setStore] = useState<Store>(Store.General);
  const items = useItemChoices(store, serviceAudit);
  const [create, creating] = servicesApi.usePostApiV1ServiceQuotationsMutation();
  const [number, setNumber] = useState("");
  const [submitted, setSubmitted] = useState(new Date().toISOString().slice(0, 10));
  const [currency, setCurrency] = useState("");
  const [days, setDays] = useState("");
  const [completion, setCompletion] = useState("");
  const [notes, setNotes] = useState("");
  const [charges, setCharges] = useState<Charge[]>([{ key: k(), name: "", cost: "" }]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [message, setMessage] = useState("");
  const problem = (): string | null => {
    if (!currency) return "Choose the currency of the quotation.";
    if (!Number.isInteger(Number(days)) || Number(days) < 1) return "Enter the estimated number of days.";
    if (!completion) return "Enter the estimated completion date.";
    if (charges.some((c) => !c.name || !c.cost.trim() || !(Number(c.cost) >= 0))) return "Every service charge needs a name and a cost.";
    if (materials.some((m) => !m.item || !(Number(m.quantity) > 0) || !m.price.trim() || !(Number(m.price) >= 0))) return "Every material needs an item, a quantity and a unit price.";
    if (new Set(materials.map((m) => m.item?.id)).size !== materials.length) return "Each material can be listed once.";
    return null;
  };
  const save = async () => {
    setMessage("");
    const found = problem(); if (found) { setMessage(found); return; }
    const denied = permission.check(); if (denied) { setMessage(denied); return; }
    const result = await create({ ...serviceAudit, domainEntitiesJobRequestsCreateServiceQuotationRequest: {
      jobOrderId: row.jobOrderId, serviceProviderId: row.providerId, quotationNumber: number.trim() || null, submittedDate: isoDay(submitted), currencyId: currency,
      estimatedDays: Number(days), estimatedCompletionDate: isoDay(completion), notes: notes.trim() || null,
      serviceCharges: charges.map((c) => ({ name: collections("Charge").find((o) => o.value === c.name)?.label ?? c.name, cost: Number(c.cost) })),
      items: materials.flatMap((m) => m.item ? [{ itemId: m.item.id, quantity: Number(m.quantity), unitOfMeasureId: m.item.unitId, unitPrice: Number(m.price) }] : []),
    } });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    toast.success("Quotation recorded", { description: "It is now in the service price comparison." });
    onClose();
  };
  const charge = (key: string, change: Partial<Charge>) => setCharges((c) => c.map((x) => x.key === key ? { ...x, ...change } : x));
  const material = (key: string, change: Partial<Material>) => setMaterials((c) => c.map((x) => x.key === key ? { ...x, ...change } : x));
  return <Dialog open onOpenChange={(open) => { if (!open && !creating.isLoading) onClose(); }}>
    <DialogContent className="sm:max-w-4xl"><DialogHeader><DialogTitle>Quotation from {row.provider}</DialogTitle>
      <DialogDescription>What the provider quoted for the job: service charges, any materials, and how long it will take.</DialogDescription></DialogHeader>
      <form noValidate className="flex min-h-0 min-w-0 flex-1 flex-col gap-4" onSubmit={(event) => { event.preventDefault(); event.stopPropagation(); void save(); }}>
        <DialogBody className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-1.5"><Label htmlFor="q-number">Quotation number</Label><Input id="q-number" value={number} onChange={(e) => setNumber(e.target.value)} /></div>
            <div className="space-y-1.5"><Label htmlFor="q-submitted">Submitted</Label><Input id="q-submitted" type="date" value={submitted} onChange={(e) => setSubmitted(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Currency</Label><Select value={currency} onValueChange={setCurrency}><SelectTrigger aria-label="Currency"><SelectValue placeholder="Choose" /></SelectTrigger>
              <SelectContent position="popper">{collections("Currency").map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label htmlFor="q-days">Estimated days</Label><Input id="q-days" inputMode="numeric" value={days} onChange={(e) => setDays(e.target.value)} /></div>
            <div className="space-y-1.5"><Label htmlFor="q-completion">Estimated completion</Label><Input id="q-completion" type="date" value={completion} onChange={(e) => setCompletion(e.target.value)} /></div>
          </div>
          <fieldset className="space-y-2"><legend className="text-sm font-medium">Service charges</legend>
            {charges.map((c, i) => <div key={c.key} className="flex flex-wrap gap-2">
              <Select value={c.name} onValueChange={(value) => charge(c.key, { name: value })}><SelectTrigger aria-label={`Charge ${String(i + 1)}`} className="w-64"><SelectValue placeholder="Charge" /></SelectTrigger>
                <SelectContent position="popper">{collections("Charge").map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select>
              <Input aria-label={`Cost of charge ${String(i + 1)}`} inputMode="decimal" className="w-36" placeholder="Cost" value={c.cost} onChange={(e) => charge(c.key, { cost: e.target.value })} />
              <Button type="button" size="icon" variant="ghost" aria-label={`Remove charge ${String(i + 1)}`} disabled={charges.length === 1} onClick={() => setCharges((all) => all.filter((x) => x.key !== c.key))}><Trash2 /></Button></div>)}
            <Button type="button" size="sm" variant="outline" onClick={() => setCharges((all) => [...all, { key: k(), name: "", cost: "" }])}><Plus />Add charge</Button></fieldset>
          <fieldset className="space-y-2"><legend className="text-sm font-medium">Materials</legend>
            <div className="flex items-center gap-2 text-sm"><span className="text-muted-foreground">From the</span>
              <Select value={String(store)} onValueChange={(v) => setStore(Number(v) as Store)}><SelectTrigger aria-label="Materials store" size="sm" className="w-44"><SelectValue /></SelectTrigger>
                <SelectContent position="popper">{storeIds.map((s) => <SelectItem key={s} value={String(s)}>{stores[s]}</SelectItem>)}</SelectContent></Select></div>
            {materials.map((m, i) => <div key={m.key} className="grid gap-2 md:grid-cols-[1fr_8rem_8rem_auto]">
              <AsyncOptionPicker label={`Material ${String(i + 1)}`} placeholder="Search for an item" loadOptions={items.loadOptions} value={m.item ? { value: m.item.id, label: items.label(m.item) } : null}
                onChange={(option) => material(m.key, { item: items.lookup(option.value) })} />
              <Input aria-label={`Quantity of material ${String(i + 1)}`} inputMode="decimal" placeholder="Quantity" value={m.quantity} onChange={(e) => material(m.key, { quantity: e.target.value })} />
              <Input aria-label={`Unit price of material ${String(i + 1)}`} inputMode="decimal" placeholder="Unit price" value={m.price} onChange={(e) => material(m.key, { price: e.target.value })} />
              <Button type="button" size="icon" variant="ghost" aria-label={`Remove material ${String(i + 1)}`} onClick={() => setMaterials((all) => all.filter((x) => x.key !== m.key))}><Trash2 /></Button></div>)}
            <Button type="button" size="sm" variant="outline" onClick={() => setMaterials((all) => [...all, { key: k(), item: null, quantity: "", price: "" }])}><Plus />Add material</Button></fieldset>
          <div className="space-y-1.5"><Label htmlFor="q-notes">Notes</Label><Textarea id="q-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
          {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
        </DialogBody>
        <DialogFooter><Button type="button" variant="outline" disabled={creating.isLoading} onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={creating.isLoading}>{creating.isLoading ? <><Spinner />Saving…</> : "Record quotation"}</Button></DialogFooter>
      </form></DialogContent></Dialog>;
}

function EditQuotationDialog({ quotation, onClose }: { quotation: Quotation; onClose: () => void }) {
  const permission = usePermissionAction(send);
  const [read] = servicesApi.useLazyGetApiV1ServiceQuotationsByIdQuery();
  const [update, updating] = servicesApi.usePutApiV1ServiceQuotationsByIdMutation();
  const [charge, setCharge] = useState(String(quotation.charge));
  const [days, setDays] = useState(String(quotation.days));
  const [completion, setCompletion] = useState(quotation.completion?.slice(0, 10) ?? "");
  const [notes, setNotes] = useState(quotation.notes ?? "");
  const [message, setMessage] = useState("");
  const save = async () => {
    setMessage("");
    if (!(Number(charge) >= 0) || !Number.isInteger(Number(days)) || Number(days) < 1 || !completion) { setMessage("Enter a service charge, the estimated days and the completion date."); return; }
    const denied = permission.check(); if (denied) { setMessage(denied); return; }
    const fresh = await read({ ...serviceAudit, id: quotation.id }, false);
    const current = fresh.data ? quotationSchema.safeParse(fresh.data) : null;
    if (!current?.success || current.data.status !== quotation.status || current.data.total !== quotation.total) { setMessage("This quotation changed after you opened it. Close this and check it again."); return; }
    const result = await update({ ...serviceAudit, id: quotation.id, domainEntitiesJobRequestsUpdateServiceQuotationRequest: { serviceCharge: Number(charge), estimatedDays: Number(days), estimatedCompletionDate: isoDay(completion), notes: notes.trim() || null } });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    toast.success("Quotation updated"); onClose();
  };
  return <Dialog open onOpenChange={(open) => { if (!open && !updating.isLoading) onClose(); }}>
    <DialogContent><DialogHeader><DialogTitle>Edit {quotation.provider}'s quotation</DialogTitle><DialogDescription>Only open quotations can change; once one is selected they are fixed.</DialogDescription></DialogHeader>
      <form noValidate className="flex min-h-0 min-w-0 flex-1 flex-col gap-4" onSubmit={(event) => { event.preventDefault(); event.stopPropagation(); void save(); }}>
        <DialogBody className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1.5"><Label htmlFor="e-charge">Service charge</Label><Input id="e-charge" inputMode="decimal" value={charge} onChange={(e) => setCharge(e.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor="e-days">Estimated days</Label><Input id="e-days" inputMode="numeric" value={days} onChange={(e) => setDays(e.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor="e-completion">Estimated completion</Label><Input id="e-completion" type="date" value={completion} onChange={(e) => setCompletion(e.target.value)} /></div>
          <div className="space-y-1.5 md:col-span-2"><Label htmlFor="e-notes">Notes</Label><Textarea id="e-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
          {message ? <p role="alert" className="text-sm text-destructive md:col-span-2">{message}</p> : null}
        </DialogBody>
        <DialogFooter><Button type="button" variant="outline" disabled={updating.isLoading} onClick={onClose}>Cancel</Button><Button type="submit" disabled={updating.isLoading}>Save quotation</Button></DialogFooter>
      </form></DialogContent></Dialog>;
}

/** Job orders waiting for providers' quotations, and the quotations recorded so far. */
export function ServiceQuoteResponsesPage() {
  const [view, setView] = useState<"waiting" | "recorded">("waiting");
  const table = useServerTable({ pageSize: 50, resetKey: view });
  const providers = servicesApi.useGetApiV1JobOrdersServiceProvidersQuery({ ...serviceAudit, page: table.page, pageSize: table.pageSize }, { skip: view !== "waiting", refetchOnMountOrArgChange: 30 });
  const quotations = servicesApi.useGetApiV1ServiceQuotationsQuery({ ...serviceAudit, page: table.page, pageSize: table.pageSize }, { skip: view !== "recorded", refetchOnMountOrArgChange: 30 });
  const providerRows = useMemo<ProviderRow[]>(() => (providers.data?.data ?? []).flatMap((p) => p.id && p.jobOrderId && p.serviceProvider?.id ? [{ id: p.id, jobOrderId: p.jobOrderId,
    providerId: p.serviceProvider.id, provider: p.serviceProvider.name ?? "Unnamed provider", sentAt: p.sentAt ?? null, responded: Boolean(p.responseReceived), respondedAt: p.responseDate ?? null }] : []), [providers.data]);
  const quoteRows = useMemo(() => { const parsed = quotations.data ? quotationPageSchema.safeParse(quotations.data) : null; return parsed?.success ? parsed.data.data : []; }, [quotations.data]);
  const [recording, setRecording] = useState<ProviderRow | null>(null);
  const [editing, setEditing] = useState<Quotation | null>(null);
  const providerColumns = useMemo(() => providerColumn.columns([
    providerColumn.accessor("provider", { header: "Service provider", cell: ({ row }) => <span className="font-medium">{row.original.provider}</span> }),
    providerColumn.accessor((r) => r.sentAt ?? "", { id: "sent", header: "Requested", size: 130, cell: ({ row }) => formatDate(row.original.sentAt) ?? "–" }),
    providerColumn.accessor("responded", { header: "Response", size: 170, cell: ({ row }) => row.original.responded ? <Badge>Received {formatDate(row.original.respondedAt) ?? ""}</Badge> : <Badge variant="outline">Waiting</Badge> }),
    providerColumn.display({ id: "order", header: "Job order", size: 140, cell: ({ row }) => <Link className="text-sm underline-offset-4 hover:underline" to={`/extrals/job-orders/${row.original.jobOrderId}/details`}>Open job order</Link> }),
    providerColumn.display({ id: "actions", size: 56, enableHiding: false, header: () => <TableMenuHeader />, cell: ({ row }) => row.original.responded ? null : <TableMenu label={`Actions for ${row.original.provider}`} items={[
      { id: "record", label: "Record quotation", icon: FilePlus2, require: send, onSelect: () => setRecording(row.original) }]} /> }),
  ]), []);
  const quoteColumns = useMemo(() => quoteColumn.columns([
    quoteColumn.accessor("provider", { header: "Service provider", cell: ({ row }) => <span className="font-medium">{row.original.provider}</span> }),
    quoteColumn.accessor((q) => q.number ?? "", { id: "number", header: "Quotation", size: 140, cell: ({ row }) => row.original.number ?? "–" }),
    quoteColumn.accessor((q) => q.submitted ?? "", { id: "submitted", header: "Submitted", size: 120, cell: ({ row }) => formatDate(row.original.submitted) ?? "–" }),
    quoteColumn.accessor("total", { header: "Total", size: 140, cell: ({ row }) => amount(row.original.total, row.original.currency) }),
    quoteColumn.accessor("status", { header: "Status", size: 130, cell: ({ row }) => <Badge variant={row.original.selected ? "default" : "outline"}>{quotationStatusLabel(row.original.status)}</Badge> }),
    quoteColumn.display({ id: "actions", size: 56, enableHiding: false, header: () => <TableMenuHeader />, cell: ({ row }) => row.original.jobOrderStatus === 2 && !row.original.selected
      ? <TableMenu label={`Actions for ${row.original.provider}`} items={[{ id: "edit", label: "Edit", icon: Pencil, require: send, onSelect: () => setEditing(row.original) }]} /> : null }),
  ]), []);
  const active = view === "waiting" ? providers : quotations;
  const meta = pageMeta(active.data, table, view === "waiting" ? providerRows.length : quoteRows.length);
  return <section className="page-fill">
    <header className="flex flex-wrap items-start justify-between gap-3"><div><p className="eyebrow">SERVICES</p><h1 className="text-xl font-semibold">Service quote responses</h1>
      <p className="text-sm text-muted-foreground">Quotations from the providers a job order was sent to.</p></div>
      <div className="flex gap-2" role="group" aria-label="View"><Button size="sm" variant={view === "waiting" ? "default" : "outline"} aria-pressed={view === "waiting"} onClick={() => setView("waiting")}>Providers asked</Button>
        <Button size="sm" variant={view === "recorded" ? "default" : "outline"} aria-pressed={view === "recorded"} onClick={() => setView("recorded")}>Recorded quotations</Button></div></header>
    {view === "waiting"
      ? <ServerDataTable label="Providers asked for quotations" columns={providerColumns} rows={providerRows} getRowId={(r) => r.id} page={table.page} pageSize={table.pageSize} totalRows={meta.totalRows}
          onPageChange={table.onPageChange} onPageSizeChange={table.onPageSizeChange} loading={providers.isLoading} onRetry={() => void providers.refetch()} error={providers.error ? apiErrorMessage(providers.error) : null} emptyTitle="No providers have been asked" />
      : <ServerDataTable label="Recorded quotations" columns={quoteColumns} rows={quoteRows} getRowId={(q) => q.id} page={table.page} pageSize={table.pageSize} totalRows={meta.totalRows}
          onPageChange={table.onPageChange} onPageSizeChange={table.onPageSizeChange} loading={quotations.isLoading} onRetry={() => void quotations.refetch()} error={quotations.error ? apiErrorMessage(quotations.error) : null} emptyTitle="No quotations recorded" />}
    {recording ? <RecordQuotationDialog row={recording} onClose={() => setRecording(null)} /> : null}
    {editing ? <EditQuotationDialog quotation={editing} onClose={() => setEditing(null)} /> : null}
  </section>;
}
