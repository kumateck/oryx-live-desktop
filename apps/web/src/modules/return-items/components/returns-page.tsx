import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useSearchParams } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/shared/skeleton/skeleton";
import { stockRequisitionPageSchema, stockRequisitionSchema, type StockRequisition } from "@/modules/stock-requisitions/lib/stock-requisitions";
import { inventoryApi } from "@/shared/api/generated/inventory";
import { useAccess } from "@/shared/auth/use-access";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { ClientDataTable, dataTableColumns } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDate } from "@/shared/format/dates";
import type { SelectLoader } from "@/shared/forms/form-wizard-types";
import { Classification } from "@/shared/inventory/contracts";
import { Store, storeValue, stores } from "@/shared/inventory/stores";
import { WorkflowStoreLinks } from "@/shared/inventory/workflow-store-links";
import { workflowRule } from "@/shared/inventory/workflows";
import { usePageSearch } from "@/shared/search/page-search";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { returnFormSchema, returnQuantitySchema, type ReturnFormValues } from "../schemas/return-form";
import { returnAudit, returnItemsRoot, returnListSchema, returnedByLine, type ItemReturn } from "../lib/returns";

const column = dataTableColumns<ItemReturn>();

/** What can still be returned on each recoverable line of an issued requisition. */
function returnable(requisition: StockRequisition, returned: ReadonlyMap<string, number>) {
  return requisition.lines.filter((line) => line.classification === Classification.Recoverable)
    .map((line) => ({ line, left: Math.max(0, line.issued - (returned.get(line.id) ?? 0)) }));
}

function ReturnDialog({ store, returns, onClose }: { store: Store; returns: readonly ItemReturn[]; onClose: () => void }) {
  const permission = usePermissionAction(workflowRule(store, "returnItems", "create"));
  const [loadRequisitions] = inventoryApi.useLazyGetApiV1ItemsStockRequisitionsQuery();
  const [loadRequisition] = inventoryApi.useLazyGetApiV1ItemsStockRequisitionsByIdQuery();
  const [create, creating] = inventoryApi.usePostApiV1RecoverableItemsReportsMutation();
  const [requisition, setRequisition] = useState<StockRequisition | null>(null);
  const returned = useMemo(() => returnedByLine(returns), [returns]);
  const form = useForm<ReturnFormValues>({
    resolver: (values, context, options) => {
      const selected = requisition && requisition.id === values.choice?.value
        ? returnable(requisition, returned).find((entry) => entry.line.id === values.line?.value) : null;
      return zodResolver(returnFormSchema(selected?.left))(values, context, options);
    },
    mode: "onChange", defaultValues: { choice: null, line: null, quantity: "", reason: "" },
  });
  const choice = useWatch({ control: form.control, name: "choice" });
  const line = useWatch({ control: form.control, name: "line" });
  const quantity = useWatch({ control: form.control, name: "quantity" });
  const [reading, setReading] = useState(false);
  const busy = creating.isLoading || form.formState.isSubmitting;
  const [message, setMessage] = useState("");
  // Only requisitions with something issued can have items returned.
  const requisitions = useCallback<SelectLoader>(async (searchQuery, page, signal) => {
    signal.throwIfAborted();
    const request = loadRequisitions({ ...returnAudit, store, page, pageSize: 20, ...(searchQuery ? { searchQuery } : {}) }, true);
    const abort = () => request.abort();
    signal.addEventListener("abort", abort, { once: true });
    const result = await request.finally(() => signal.removeEventListener("abort", abort));
    if (result.error) throw new Error("Requisitions could not be loaded.");
    const parsed = stockRequisitionPageSchema.safeParse(result.data);
    const rows = parsed.success ? parsed.data.data : [];
    return { options: rows.filter((r) => r.lines.some((l) => l.issued > 0)).map((r) => ({ value: r.id, label: `${r.number} · ${r.department?.name ?? "No department"}` })),
      hasNext: (parsed.success ? parsed.data.pageIndex ?? 1 : 1) < (parsed.success ? parsed.data.pageCount ?? 1 : 1), hasPrevious: page > 1 };
  }, [loadRequisitions, store]);
  const choiceId = choice?.value;
  useEffect(() => {
    let live = true;
    setRequisition(null); form.setValue("line", null); setMessage("");
    if (!choiceId) { setReading(false); return; }
    setReading(true);
    const request = loadRequisition({ ...returnAudit, id: choiceId }, false);
    void request.then((result) => {
      if (!live) return;
      const parsed = result.data ? stockRequisitionSchema.safeParse(result.data) : null;
      if (!parsed?.success) setMessage(result.error ? apiErrorMessage(result.error) : "The requisition could not be read.");
      else setRequisition(parsed.data);
      setReading(false);
    });
    return () => { live = false; request.abort(); };
  }, [choiceId, form, loadRequisition]);
  const lines = useMemo(() => requisition && requisition.id === choiceId ? returnable(requisition, returned) : [], [requisition, choiceId, returned]);
  const selected = lines.find((entry) => entry.line.id === line?.value) ?? null;
  const quantityResult = returnQuantitySchema(selected?.left).safeParse(quantity);
  const problem = selected && !quantityResult.success ? quantityResult.error.issues[0]?.message ?? null : null;
  const fields = useMemo<readonly WizardField<ReturnFormValues>[]>(() => [
    { type: InputTypes.SELECT, name: "choice", label: "Issued requisition", mode: "single", source: "async", loadOptions: requisitions, placeholder: "Search for a requisition", required: true },
    ...(requisition ? [{ type: InputTypes.SELECT, name: "line", label: "Item", mode: "single", source: "sync", required: true, options: lines.map(({ line, left }) => ({ value: line.id, label: `${line.name} · ${line.code} — ${String(left)} of ${String(line.issued)} ${line.unit ?? ""} returnable`.trim(), disabled: left === 0 })) } satisfies WizardField<ReturnFormValues>] : []),
    ...(selected ? [{ type: InputTypes.TEXT, name: "quantity", label: "Quantity returned", inputMode: "numeric", required: true } satisfies WizardField<ReturnFormValues>] : []),
    { type: InputTypes.TEXTAREA, name: "reason", label: "Remarks", rows: 3, placeholder: "Condition of the items, or why they are returned" },
  ], [requisitions, requisition, lines, selected]);
  const save = form.handleSubmit(async ({ line, quantity, reason }) => {
    const selected = lines.find((entry) => entry.line.id === line?.value);
    const amount = Number(quantity);
    setMessage("");
    if (!selected) { setMessage("Choose the item being returned."); return; }
    const denied = permission.check();
    if (denied) { setMessage(denied); return; }
    const result = await create({ ...returnAudit, domainEntitiesRecoverableItemsReportsCreateRecoverableItemReportRequest: {
      itemId: selected.line.itemId, itemStockRequisitionItemId: selected.line.id, quantity: amount, reason: reason.trim() || null } });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    toast.success("Return recorded", { description: "The items are back in stock." });
    onClose();
  });
  return <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
    <DialogContent className="sm:max-w-2xl">
      <DialogHeader><DialogTitle>Record a return</DialogTitle>
        <DialogDescription>Recoverable items handed back to the {(stores[store] ?? "store").toLowerCase()}, against the requisition they were issued on.</DialogDescription></DialogHeader>
      <form noValidate className="flex min-h-0 min-w-0 flex-1 flex-col gap-4" onSubmit={(event) => { event.stopPropagation(); void save(event); }}>
        <DialogBody className="space-y-4">
          <fieldset disabled={busy}><FormWizard form={form} fields={fields} /></fieldset>
          {reading ? <Skeleton className="h-14 w-full" aria-label="Loading requisition" /> : null}
          {requisition && lines.length === 0 ? <p className="text-sm text-muted-foreground">No recoverable items on this requisition remain to be returned.</p> : null}
          {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
        </DialogBody>
        <DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={busy || reading || !selected || Boolean(problem)}>{creating.isLoading ? <><Spinner />Recording…</> : "Record return"}</Button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}

/** Returns of recoverable items to one store, newest first. */
export function ReturnItemsPage() {
  const [params] = useSearchParams();
  const store = storeValue(params.get("storeType")) ?? Store.General;
  const { can } = useAccess();
  const search = usePageSearch("returns").trim().toLowerCase();
  const query = inventoryApi.useGetApiV1RecoverableItemsReportsQuery(returnAudit, { refetchOnMountOrArgChange: 30 });
  const parsed = useMemo(() => query.data ? returnListSchema.safeParse(query.data) : null, [query.data]);
  const all = useMemo(() => parsed?.success ? parsed.data : [], [parsed]);
  const rows = useMemo(() => all.filter((r) => r.store === store && (!search || [r.itemName, r.itemCode, r.requisitionNumber ?? "", r.returnedBy ?? ""].some((v) => v.toLowerCase().includes(search)))), [all, search, store]);
  const [recording, setRecording] = useState(false);
  const columns = useMemo(() => column.columns([
    column.accessor((r) => r.createdAt ?? "", { id: "returned", header: "Returned", size: 120, cell: ({ row }) => formatDate(row.original.createdAt) ?? "–" }),
    column.accessor((r) => r.returnedBy ?? "", { id: "by", header: "Returned by", cell: ({ row }) => row.original.returnedBy ?? "–" }),
    column.accessor((r) => r.requisitionNumber ?? "", { id: "requisition", header: "Requisition", size: 140, cell: ({ row }) => row.original.requisitionNumber ?? "Not recorded" }),
    column.accessor("itemCode", { header: "Item code", size: 120 }),
    column.accessor("itemName", { header: "Item" }),
    column.accessor("quantity", { header: "Returned", size: 110, cell: ({ row }) => `${String(row.original.quantity)} ${row.original.unit}`.trim() }),
    column.accessor((r) => r.reason ?? "", { id: "reason", header: "Remarks", cell: ({ row }) => row.original.reason ?? "–" }),
  ]), []);
  return <section className="page-fill">
    <header className="flex flex-wrap items-start justify-between gap-3"><div><p className="eyebrow">GENERAL STORES</p><h1 className="text-xl font-semibold">Return items</h1>
      <p className="text-sm text-muted-foreground">Recoverable items handed back to the {(stores[store] ?? "store").toLowerCase()}.</p></div>
      {can(workflowRule(store, "returnItems", "create")) ? <Button type="button" size="sm" onClick={() => setRecording(true)}><Plus />Record a return</Button> : null}</header>
    <WorkflowStoreLinks root={returnItemsRoot} store={store} workflows={["returnItems"]} />
    <ClientDataTable label="Returns" columns={columns} rows={rows} getRowId={(r) => r.id} loading={query.isLoading} onRetry={() => void query.refetch()}
      error={query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned returns the app could not read." : null}
      emptyTitle={search ? "No returns match" : "No returns yet"} />
    {recording ? <ReturnDialog store={store} returns={all} onClose={() => setRecording(false)} /> : null}
  </section>;
}
