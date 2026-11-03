import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { useEffect, useMemo, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Link, useSearchParams } from "react-router";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { ConfirmActionDialog, TableMenu, TableMenuHeader } from "@/shared/actions";
import { warehouseApi } from "@/shared/api/generated/warehouse";
import { useAccess } from "@/shared/auth/use-access";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { ServerDataTable, dataTableColumns, pageMeta, useServerTable } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDate } from "@/shared/format/dates";
import { Store, stockLink, storeValue, stockPermissions, stores } from "@/shared/inventory/stores";
import { WorkflowStoreLinks } from "@/shared/inventory/workflow-store-links";
import { workflowRule } from "@/shared/inventory/workflows";
import { usePageSearch } from "@/shared/search/page-search";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { correctionFormSchema, type CorrectionFormValues } from "../schemas/correction-form";
import { DamageStatus, damageAudit, damageLabel, damagePageSchema, damageRoot, damageSchema, sameDamage, type DamageRecord } from "../lib/damage";

const column = dataTableColumns<DamageRecord>();
const ALL = "all";
const changed = "This record changed after you opened it. Close this and check it again.";

function useFresh() {
  const [read] = warehouseApi.useLazyGetApiV1DamagedGoodsByIdQuery();
  return async (record: DamageRecord): Promise<string | null> => {
    const fresh = await read({ ...damageAudit, id: record.id }, false);
    if (fresh.error) return apiErrorMessage(fresh.error);
    const parsed = damageSchema.safeParse(fresh.data);
    return parsed.success && sameDamage(record, parsed.data) ? null : changed;
  };
}

function CorrectDialog({ record, store, onClose }: { record: DamageRecord; store: Store; onClose: () => void }) {
  const permission = usePermissionAction(workflowRule(store, "damageMissing", "edit"));
  const [update, updating] = warehouseApi.usePutApiV1DamagedGoodsByIdMutation();
  const fresh = useFresh();
  const schema = correctionFormSchema(record.quantity, record.available, record.unit);
  const form = useForm<CorrectionFormValues>({ resolver: zodResolver(schema), mode: "onChange", defaultValues: {
    quantity: String(record.quantity), status: record.status === DamageStatus.Missing ? { value: "1", label: "Missing" }
      : record.status === DamageStatus.Damage ? { value: "0", label: "Damaged" } : null, remarks: record.remarks ?? "",
  } });
  const quantity = useWatch({ control: form.control, name: "quantity" });
  const fields = useMemo<readonly WizardField<CorrectionFormValues>[]>(() => [
    { type: InputTypes.SELECT, name: "status", label: "Type", mode: "single", source: "sync", required: true, options: [{ value: "0", label: "Damaged" }, { value: "1", label: "Missing" }] },
    { type: InputTypes.TEXT, name: "quantity", label: "Quantity", inputMode: "numeric", required: true },
    { type: InputTypes.TEXTAREA, name: "remarks", label: "Remarks", rows: 3 },
  ], []);
  const busy = updating.isLoading || form.formState.isSubmitting;
  const [message, setMessage] = useState("");
  const quantityResult = schema.shape.quantity.safeParse(quantity);
  const problem = quantityResult.success ? null : quantityResult.error.issues[0]?.message ?? null;
  const save = form.handleSubmit(async ({ status, quantity, remarks }) => {
    if (!status) return;
    const amount = Number(quantity);
    setMessage("");
    if (problem) { setMessage(problem); return; }
    const denied = permission.check();
    if (denied) { setMessage(denied); return; }
    const stale = await fresh(record);
    if (stale) { setMessage(stale); return; }
    const writeDenied = permission.check();
    if (writeDenied) { setMessage(writeDenied); return; }
    const result = await update({ ...damageAudit, id: record.id, domainEntitiesDamagedStocksCreateDamagedStockRequest: {
      itemId: record.itemId, damageStatus: status.value === "1" ? 1 : 0, quantityDamaged: amount, remarks: remarks.trim() || null } });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    toast.success("Record corrected", { description: amount === record.quantity ? undefined : "The stock difference was posted to the item ledger." });
    onClose();
  });
  return <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
    <DialogContent><DialogHeader><DialogTitle>Correct {record.itemName}</DialogTitle>
      <DialogDescription>The item stays the same. Changing the quantity adds or takes the difference from stock.</DialogDescription></DialogHeader>
      <form noValidate className="flex min-h-0 min-w-0 flex-1 flex-col gap-4" onSubmit={(event) => { event.stopPropagation(); void save(event); }}>
        <DialogBody className="space-y-4">
          <fieldset disabled={busy}><FormWizard form={form} fields={fields} /></fieldset>
          {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
        </DialogBody>
        <DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={busy || Boolean(problem)}>{updating.isLoading ? <><Spinner />Saving…</> : "Save correction"}</Button></DialogFooter>
      </form></DialogContent></Dialog>;
}

/** Damaged and missing stock reported in one store, with corrections and deletions that keep the item ledger right. */
export function DamageMissingPage() {
  const [params] = useSearchParams();
  const store = storeValue(params.get("storeType")) ?? Store.General;
  const { has } = useAccess();
  const [busy, setBusy] = useState(false);
  const search = usePageSearch("damage and missing items", busy);
  const [kind, setKind] = useState(ALL);
  const table = useServerTable({ pageSize: 50, resetKey: `${String(store)}|${search}|${kind}` });
  const query = warehouseApi.useGetApiV1DamagedGoodsQuery({ ...damageAudit, store, page: table.page, pageSize: table.pageSize,
    ...(search ? { searchQuery: search } : {}), ...(kind === ALL ? {} : { damageStatus: Number(kind) as 0 | 1 }) }, { refetchOnMountOrArgChange: 30 });
  const parsed = useMemo(() => query.data ? damagePageSchema.safeParse(query.data) : null, [query.data]);
  const rows = useMemo(() => parsed?.success ? parsed.data.data : [], [parsed]);
  const meta = pageMeta(query.data, table, rows.length);
  useEffect(() => { setBusy(query.isFetching); }, [query.isFetching]);
  const [correcting, setCorrecting] = useState<DamageRecord | null>(null);
  const [removing, setRemoving] = useState<DamageRecord | null>(null);
  const [remove] = warehouseApi.useDeleteApiV1DamagedGoodsByIdMutation();
  const fresh = useFresh();
  const columns = useMemo(() => column.columns([
    column.accessor("itemName", { header: "Item", cell: ({ row }) => <span className="font-medium">{row.original.itemName}</span> }),
    column.accessor("itemCode", { header: "Code", size: 120 }),
    column.accessor("status", { header: "Type", size: 110, cell: ({ row }) => <Badge variant={row.original.status === DamageStatus.Missing ? "secondary" : "outline"}>{damageLabel(row.original.status)}</Badge> }),
    column.accessor("quantity", { header: "Quantity", size: 110, cell: ({ row }) => `${String(row.original.quantity)} ${row.original.unit}`.trim() }),
    column.accessor((r) => r.createdAt ?? "", { id: "reported", header: "Reported", size: 120, cell: ({ row }) => formatDate(row.original.createdAt) ?? "–" }),
    column.accessor((r) => r.reportedBy ?? "", { id: "by", header: "Reported by", cell: ({ row }) => row.original.reportedBy ?? "–" }),
    column.accessor((r) => r.remarks ?? "", { id: "remarks", header: "Remarks", cell: ({ row }) => row.original.remarks ?? "–" }),
    column.display({ id: "actions", size: 56, enableHiding: false, header: () => <TableMenuHeader />, cell: ({ row }) => <TableMenu label={`Actions for ${row.original.itemName}`} items={[
      { id: "correct", label: "Correct", icon: Pencil, require: workflowRule(store, "damageMissing", "edit"), onSelect: () => setCorrecting(row.original) },
      { id: "delete", label: "Delete", icon: Trash2, destructive: true, separated: true, require: workflowRule(store, "damageMissing", "delete"), onSelect: () => setRemoving(row.original) },
    ]} /> }),
  ]), [store]);
  const reportLink = has(stockPermissions(store).damage) && has(stockPermissions(store).available);
  return <section className="page-fill">
    <header className="flex flex-wrap items-start justify-between gap-3"><div><p className="eyebrow">GENERAL STORES</p><h1 className="text-xl font-semibold">Damage and missing items</h1>
      <p className="text-sm text-muted-foreground">Stock written off from the {(stores[store] ?? "store").toLowerCase()} as damaged or missing.{reportLink ? " Report new damage from available stock." : ""}</p></div>
      <div className="flex flex-wrap items-center gap-2">
        <Select value={kind} onValueChange={setKind}><SelectTrigger aria-label="Type" size="sm" className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent position="popper"><SelectItem value={ALL}>Damaged and missing</SelectItem><SelectItem value={String(DamageStatus.Damage)}>Damaged</SelectItem><SelectItem value={String(DamageStatus.Missing)}>Missing</SelectItem></SelectContent></Select>
        {reportLink ? <Button size="sm" variant="outline" asChild><Link to={stockLink(store, "available")}>Available stock</Link></Button> : null}
      </div></header>
    <WorkflowStoreLinks root={damageRoot} store={store} workflows={["damageMissing"]} />
    <ServerDataTable label="Damage and missing items" columns={columns} rows={rows} getRowId={(r) => r.id} page={table.page} pageSize={table.pageSize} totalRows={meta.totalRows}
      onPageChange={table.onPageChange} onPageSizeChange={table.onPageSizeChange} loading={query.isLoading} refreshing={query.isFetching && !query.isLoading} onRetry={() => void query.refetch()}
      error={query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned records the app could not read." : null}
      emptyTitle={search || kind !== ALL ? "No records match" : "Nothing reported damaged or missing"} />
    {correcting ? <CorrectDialog record={correcting} store={store} onClose={() => setCorrecting(null)} /> : null}
    {removing ? <ConfirmActionDialog require={workflowRule(store, "damageMissing", "delete")} title={`Delete this ${damageLabel(removing.status).toLowerCase()} record?`}
      description={`${String(removing.quantity)} ${removing.unit} of ${removing.itemName} go back into stock, and the item ledger records the credit.`.replace("  ", " ")}
      confirmLabel="Delete record" busyLabel="Deleting…" onClose={() => setRemoving(null)}
      onConfirm={async () => { const stale = await fresh(removing); if (stale) return stale;
        const result = await remove({ ...damageAudit, id: removing.id }); if ("error" in result) return apiErrorMessage(result.error);
        toast.success("Record deleted", { description: "The quantity is back in stock." }); return null; }} /> : null}
  </section>;
}
