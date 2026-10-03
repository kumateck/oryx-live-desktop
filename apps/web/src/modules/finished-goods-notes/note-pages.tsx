import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Check, Eye } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { TableMenu, TableMenuHeader } from "@/shared/actions";
import { useAccess } from "@/shared/auth/use-access";
import { ServerDataTable, dataTableColumns, pageMeta, useServerTable } from "@/shared/datatable";
import { DetailGroup, DetailItem } from "@/shared/detail/detail-list";
import { KeyFact, KeyFacts } from "@/shared/detail/key-facts";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDate, formatMonthYear } from "@/shared/format/dates";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { PageHeader } from "@/shared/navigation/page-header";
import { RichTextView } from "@/shared/rich-text/rich-text-view";
import { usePageSearch } from "@/shared/search/page-search";
import { DetailPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { toLargestUnit } from "@/shared/units/quantity";
import { approveSchema, audit, notePath, notePermissions, noteRowsSchema, noteSchema, notesPath, receivedPacks, shippersOf, useApproveTransferNoteMutation, useGetApiV1ProductionScheduleFinishedGoodsTransferNoteByIdQuery,
  useGetApiV1ProductionScheduleFinishedGoodsTransferNoteQuery, type ApproveValues, type TransferNote } from "./notes";

const fields: WizardField<ApproveValues>[] = [
  { type: InputTypes.NUMBER, name: "shippers", label: "Shippers received", min: 0, step: 1 },
  { type: InputTypes.NUMBER, name: "loose", label: "Loose packs received", min: 0, step: 1 },
  { type: InputTypes.RICHTEXT, name: "notes", label: "Notes", className: "md:col-span-2" },
];
/** The store counts in what production sent and approves the note with what it actually received. */
export function ApproveNoteDialog({ note, onClose }: { note: TransferNote; onClose: () => void }) {
  const [approve, mutation] = useApproveTransferNoteMutation();
  const [message, setMessage] = useState("");
  const sent = shippersOf(note.total, note.perShipper);
  const form = useForm<ApproveValues>({ resolver: zodResolver(approveSchema(note)), defaultValues: { shippers: sent.shippers, loose: sent.loose, notes: "" } });
  void form.formState.errors;
  const [shippers, loose] = useWatch({ control: form.control, name: ["shippers", "loose"] });
  const packs = receivedPacks(shippers, loose, note.perShipper);
  const busy = mutation.isLoading;
  const submit = form.handleSubmit(async (values) => {
    setMessage("");
    const result = await approve({ id: note.id, quantityReceived: receivedPacks(values.shippers, values.loose, note.perShipper), notes: values.notes.trim() || null });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    toast.success(`Transfer of ${note.productName} approved`, { description: `${packs.toLocaleString()} packs received into the finished goods store.` });
    onClose();
  });
  return <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
    <DialogContent className="sm:max-w-2xl">
      <DialogHeader><DialogTitle>Approve transfer · {note.productName}</DialogTitle><DialogDescription>Batch {note.batchNumber ?? "–"}. Enter what the store counted in; it cannot be more than was sent. This cannot be undone.</DialogDescription></DialogHeader>
      <form noValidate onSubmit={(event) => { event.stopPropagation(); void submit(event); }} className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
        <DialogBody className="space-y-3">
          <KeyFacts><KeyFact label="Sent" value={`${note.total.toLocaleString()} packs`} note={note.packing ?? undefined} /><KeyFact label="Shippers sent" value={sent.shippers} note={note.perShipper ? `${note.perShipper} packs each` : "No shipper size"} /><KeyFact label="Loose sent" value={sent.loose} /></KeyFacts>
          <FormWizard form={form} fields={fields} className="md:grid-cols-2" />
          <p role="status" className="text-sm">Received <span className="font-semibold">{packs.toLocaleString()} packs</span>{packs > 0 && packs < note.total ? <span className="text-amber-700 dark:text-amber-400"> · {(note.total - packs).toLocaleString()} fewer than sent</span> : null}</p>
          {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
        </DialogBody>
        <DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={onClose}>Cancel</Button><Button type="submit" disabled={busy}>{busy ? <><Spinner />Approving…</> : "Approve transfer"}</Button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}

const column = dataTableColumns<TransferNote>();
/** Transfers from production waiting to be received, and those already received. */
export function NoteListPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const approved = params.get("status") === "1";
  const [approving, setApproving] = useState<TransferNote | null>(null);
  const [busy, setBusy] = useState(false);
  const search = usePageSearch("transfer notes", busy);
  const table = useServerTable({ pageSize: 50, resetKey: `${search}|${approved}` });
  const query = useGetApiV1ProductionScheduleFinishedGoodsTransferNoteQuery({ ...audit, page: table.page, pageSize: table.pageSize, searchQuery: search, onlyApproved: approved });
  const parsed = useMemo(() => query.data ? noteRowsSchema.safeParse(query.data.data ?? []) : null, [query.data]);
  const rows = useMemo(() => parsed?.success ? parsed.data : [], [parsed]);
  const meta = pageMeta(query.data, table, rows.length);
  useEffect(() => { setBusy(query.isFetching); }, [query.isFetching]);
  const columns = useMemo(() => column.columns([
    column.accessor("productName", { header: "Product", cell: ({ row }) => <div className="min-w-0"><div className="break-words font-medium">{row.original.productName}</div><div className="text-xs text-muted-foreground">Batch {row.original.batchNumber ?? "–"}</div></div> }),
    column.accessor((row) => row.made ?? "", { id: "made", header: "Manufactured", size: 140, cell: ({ row }) => formatMonthYear(row.original.made) ?? "–" }),
    column.accessor((row) => row.expires ?? "", { id: "expires", header: "Expires", size: 130, cell: ({ row }) => formatMonthYear(row.original.expires) ?? "–" }),
    column.accessor((row) => row.packing ?? "", { id: "packing", header: "Packing", size: 190, cell: ({ row }) => <div><div>{row.original.packing ?? "–"}</div><div className="text-xs text-muted-foreground">{row.original.perShipper ? `${row.original.perShipper} per shipper` : "No shipper size"}</div></div> }),
    column.accessor("perPack", { header: "Packed", size: 120, cell: ({ row }) => row.original.perPack.toLocaleString() }),
    column.accessor("total", { header: "Transferred", size: 190, cell: ({ row }) => { const split = shippersOf(row.original.total, row.original.perShipper);
      return <div><div className="font-medium">{row.original.total.toLocaleString()}</div><div className="text-xs text-muted-foreground">{split.shippers} shippers · {split.loose} loose</div></div>; } }),
    column.display({ id: "actions", size: 56, enableHiding: false, header: () => <TableMenuHeader />, cell: ({ row }) => <TableMenu label={`Actions for batch ${row.original.batchNumber ?? row.original.id}`} items={[
      { id: "view", label: "View", icon: Eye, to: notePath(row.original.id) },
      !row.original.approved && { id: "approve", label: "Approve", icon: Check, require: notePermissions.approve, onSelect: () => setApproving(row.original) },
    ]} /> }),
  ]), []);
  return <section className="page-fill">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="eyebrow">FG WAREHOUSE</p><h1 className="text-xl font-semibold">Finished goods transfer notes</h1></div>
      <div role="group" aria-label="Status" className="flex gap-1">{[{ value: false, label: "Pending" }, { value: true, label: "Approved" }].map((item) => <Button key={item.label} type="button" size="sm" variant={approved === item.value ? "default" : "outline"} aria-pressed={approved === item.value}
        onClick={() => setParams((current) => { const next = new URLSearchParams(current); next.set("status", item.value ? "1" : "0"); return next; }, { replace: true })}>{item.label}</Button>)}</div>
    </div>
    <ServerDataTable label="Finished goods transfer notes" columns={columns} rows={rows} getRowId={(row) => row.id} page={table.page} pageSize={table.pageSize} totalRows={meta.totalRows} onPageChange={table.onPageChange} onPageSizeChange={table.onPageSizeChange}
      loading={query.isLoading} refreshing={query.isFetching && !query.isLoading} onRetry={() => void query.refetch()} onRowOpen={(row) => void navigate(notePath(row.id))}
      error={query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned transfer notes the app could not read." : null}
      emptyTitle={search.trim() ? "No transfer notes match this search" : approved ? "No approved transfers" : "No transfers waiting"} emptyDescription={search.trim() ? "Search by product or batch." : "A transfer note is raised when production sends packed product to the store."} />
    {approving ? <ApproveNoteDialog key={approving.id} note={approving} onClose={() => setApproving(null)} /> : null}
  </section>;
}

const show = (value: number, unit: string | null) => toLargestUnit(value, unit, "calculated")?.text ?? value.toLocaleString();
function Detail({ note }: { note: TransferNote }) {
  const { has } = useAccess();
  const [approving, setApproving] = useState(false);
  const units = note.perPack * note.total + note.loose;
  return <article className="min-w-0 space-y-4">
    <PageHeader title={note.productName} crumbs={[{ label: "Finished goods transfer notes", to: notesPath }, { label: note.number ?? note.batchNumber ?? "Transfer note" }]}
      actions={!note.approved && has(notePermissions.approve) ? <Button type="button" size="sm" onClick={() => setApproving(true)}><Check />Approve</Button> : null} />
    <div className="flex flex-wrap items-center gap-2"><Badge variant={note.approved ? "default" : "outline"}>{note.approved ? "Approved" : "Pending approval"}</Badge>
      <span className="text-sm text-muted-foreground">{[note.number, `Created ${formatDate(note.createdAt) ?? "on an unrecorded date"}`, note.createdBy ? `by ${note.createdBy}` : null, note.qar ? `QAR ${note.qar}` : null].filter(Boolean).join(" · ")}</span></div>
    <KeyFacts>
      <KeyFact label="Received" value={show(note.received, note.unit)} />
      <KeyFact label="Allocated" value={show(note.allocated, note.unit)} />
      <KeyFact label="Pending allocation" value={show(note.pending, note.unit)} state={note.pending > 0 ? "soon" : "none"} />
      <KeyFact label="Remaining" value={show(note.remaining, note.unit)} />
    </KeyFacts>
    <section aria-label="Transfer route" className="flex flex-wrap items-center gap-3 rounded-lg border bg-card p-4 text-sm">
      <div><p className="text-xs text-muted-foreground">From</p><p className="font-medium">{note.from ?? "–"}</p></div><ArrowRight aria-hidden="true" className="size-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">To</p><p className="font-medium">{note.to ?? "–"}</p></div></section>
    <div className="grid gap-3 lg:grid-cols-2">
      <DetailGroup title="Product and batch">
        <DetailItem label="Product" value={note.productName} /><DetailItem label="Generic name" value={note.genericName} /><DetailItem label="Product code" value={note.productCode} /><DetailItem label="Category" value={note.category} />
        <DetailItem label="Batch number" value={note.batchNumber} /><DetailItem label="Manufactured" value={formatMonthYear(note.made)} /><DetailItem label="Expires" value={formatMonthYear(note.expires)} /><DetailItem label="QAR number" value={note.qar} />
      </DetailGroup>
      <DetailGroup title="Transfer quantities">
        <DetailItem label="Total transferred" value={`${note.total.toLocaleString()}${note.packing ? ` ${note.packing}` : ""}`} /><DetailItem label="Quantity per pack" value={note.perPack.toLocaleString()} />
        <DetailItem label="Loose units" value={note.loose.toLocaleString()} /><DetailItem label="Total units" value={units ? units.toLocaleString() : null} />
        <DetailItem label="Packs per shipper" value={note.perShipper || null} />
      </DetailGroup>
    </div>
    {note.notes ? <section className="space-y-1 rounded-lg border bg-card p-4"><h2 className="text-sm font-semibold">Notes</h2><RichTextView html={note.notes} className="text-sm" /></section> : null}
    {approving ? <ApproveNoteDialog note={note} onClose={() => setApproving(false)} /> : null}
  </article>;
}
export function NoteDetailPage() {
  const { id = "" } = useParams();
  const query = useGetApiV1ProductionScheduleFinishedGoodsTransferNoteByIdQuery({ ...audit, id }, { skip: !id });
  const note = useMemo(() => { const parsed = noteSchema.safeParse(query.data ?? null); return parsed.success ? parsed.data : null; }, [query.data]);
  if (query.isLoading) return <DetailPageSkeleton label="Loading transfer note" groups={3} />;
  if (!note) return <div role="alert" className="mx-auto max-w-md space-y-3 py-12 text-center">
    <h1 className="text-lg font-semibold">Transfer note unavailable</h1><p className="text-sm text-muted-foreground">{query.error ? apiErrorMessage(query.error) : "The server returned a transfer note the app could not read."}</p>
    <div className="flex justify-center gap-2"><Button size="sm" variant="outline" onClick={() => void query.refetch()}>Retry</Button><Button asChild size="sm"><Link to={notesPath}>Transfer notes</Link></Button></div></div>;
  return <Detail note={note} />;
}
