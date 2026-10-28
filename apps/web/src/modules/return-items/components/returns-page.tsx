import { useCallback, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useSearchParams } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { stockRequisitionPageSchema, stockRequisitionSchema, type StockRequisition } from "@/modules/stock-requisitions/lib/stock-requisitions";
import { inventoryApi } from "@/shared/api/generated/inventory";
import { useAccess } from "@/shared/auth/use-access";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { ClientDataTable, dataTableColumns } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDate } from "@/shared/format/dates";
import { AsyncOptionPicker } from "@/shared/forms/async-option-picker";
import type { SelectLoader, SelectOption } from "@/shared/forms/form-wizard-types";
import { Classification } from "@/shared/inventory/contracts";
import { Store, storeValue, stores } from "@/shared/inventory/stores";
import { WorkflowStoreLinks } from "@/shared/inventory/workflow-store-links";
import { workflowRule } from "@/shared/inventory/workflows";
import { usePageSearch } from "@/shared/search/page-search";
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
  const [choice, setChoice] = useState<SelectOption | null>(null);
  const [requisition, setRequisition] = useState<StockRequisition | null>(null);
  const [lineId, setLineId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const returned = useMemo(() => returnedByLine(returns), [returns]);
  // Only requisitions with something issued can have items returned.
  const requisitions = useCallback<SelectLoader>(async (searchQuery, page) => {
    const result = await loadRequisitions({ ...returnAudit, store, page, pageSize: 20, ...(searchQuery ? { searchQuery } : {}) }, true);
    if (result.error) throw new Error("Requisitions could not be loaded.");
    const parsed = stockRequisitionPageSchema.safeParse(result.data);
    const rows = parsed.success ? parsed.data.data : [];
    return { options: rows.filter((r) => r.lines.some((l) => l.issued > 0)).map((r) => ({ value: r.id, label: `${r.number} · ${r.department?.name ?? "No department"}` })),
      hasNext: (parsed.success ? parsed.data.pageIndex ?? 1 : 1) < (parsed.success ? parsed.data.pageCount ?? 1 : 1), hasPrevious: page > 1 };
  }, [loadRequisitions, store]);
  const pick = async (option: SelectOption) => {
    setChoice(option); setRequisition(null); setLineId(""); setMessage("");
    const result = await loadRequisition({ ...returnAudit, id: option.value }, false);
    const parsed = result.data ? stockRequisitionSchema.safeParse(result.data) : null;
    if (!parsed?.success) { setMessage(result.error ? apiErrorMessage(result.error) : "The requisition could not be read."); return; }
    setRequisition(parsed.data);
  };
  const lines = requisition ? returnable(requisition, returned) : [];
  const selected = lines.find((entry) => entry.line.id === lineId) ?? null;
  const amount = Number(quantity);
  const problem = !selected ? null : !quantity.trim() || !Number.isInteger(amount) || amount <= 0 ? "Enter a whole number greater than zero."
    : amount > selected.left ? `Only ${String(selected.left)} issued on this requisition remain to be returned.` : null;
  const save = async () => {
    setMessage("");
    if (!selected || problem) { setMessage(problem ?? "Choose the item being returned."); return; }
    const denied = permission.check();
    if (denied) { setMessage(denied); return; }
    const result = await create({ ...returnAudit, domainEntitiesRecoverableItemsReportsCreateRecoverableItemReportRequest: {
      itemId: selected.line.itemId, itemStockRequisitionItemId: selected.line.id, quantity: amount, reason: reason.trim() || null } });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    toast.success("Return recorded", { description: "The items are back in stock." });
    onClose();
  };
  return <Dialog open onOpenChange={(open) => { if (!open && !creating.isLoading) onClose(); }}>
    <DialogContent className="sm:max-w-2xl">
      <DialogHeader><DialogTitle>Record a return</DialogTitle>
        <DialogDescription>Recoverable items handed back to the {(stores[store] ?? "store").toLowerCase()}, against the requisition they were issued on.</DialogDescription></DialogHeader>
      <form noValidate className="flex min-h-0 min-w-0 flex-1 flex-col gap-4" onSubmit={(event) => { event.preventDefault(); event.stopPropagation(); void save(); }}>
        <DialogBody className="space-y-4">
          <div className="space-y-1.5"><Label>Issued requisition <span className="text-destructive">*</span></Label>
            <AsyncOptionPicker label="Issued requisition" value={choice} onChange={(option) => void pick(option)} loadOptions={requisitions} placeholder="Search for a requisition" /></div>
          {requisition ? lines.length === 0 ? <p className="text-sm text-muted-foreground">No recoverable items on this requisition remain to be returned.</p>
            : <div className="space-y-1.5"><Label>Item <span className="text-destructive">*</span></Label>
              <Select value={lineId} onValueChange={setLineId}><SelectTrigger aria-label="Item"><SelectValue placeholder="Choose the item" /></SelectTrigger>
                <SelectContent position="popper">{lines.map(({ line, left }) => <SelectItem key={line.id} value={line.id} disabled={left === 0}>
                  {`${line.name} · ${line.code} — ${String(left)} of ${String(line.issued)} ${line.unit ?? ""} returnable`.trim()}</SelectItem>)}</SelectContent></Select></div> : null}
          {selected ? <div className="space-y-1.5"><Label htmlFor="return-quantity">Quantity returned <span className="text-destructive">*</span></Label>
            <Input id="return-quantity" inputMode="numeric" className="w-32" value={quantity} onChange={(event) => setQuantity(event.target.value)} aria-invalid={problem ? true : undefined} />
            {problem ? <p role="alert" className="text-xs text-destructive">{problem}</p> : null}</div> : null}
          <div className="space-y-1.5"><Label htmlFor="return-reason">Remarks</Label>
            <Textarea id="return-reason" rows={3} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Condition of the items, or why they are returned" /></div>
          {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
        </DialogBody>
        <DialogFooter><Button type="button" variant="outline" disabled={creating.isLoading} onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={creating.isLoading || !selected || Boolean(problem)}>{creating.isLoading ? <><Spinner />Recording…</> : "Record return"}</Button></DialogFooter>
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
