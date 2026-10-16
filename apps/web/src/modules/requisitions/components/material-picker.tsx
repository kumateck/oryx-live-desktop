import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAccess } from "@/shared/auth/use-access";
import type { MaterialKind } from "@/shared/reference-data/kind-tabs";
import { useMaterialPicker } from "../hooks/use-material-picker";
import { newOrderLine } from "../lib/order-lines";
import { createAudit, createRequisitionPermissions, requisitionsPath, viewRequisitionPermissions } from "../lib/requisition-access";
import type { PickRow } from "../schemas/requisition-schema";
import { MaterialPickerTable } from "./material-picker-table";
import { StockAvailabilityDialog } from "@/shared/stock/stock-availability-dialog";
import { StockTransferDialog } from "./stock-transfer-dialog";
import { PurchaseRequisitionDialog } from "./purchase-requisition-dialog";

const everyCategory = "all";

/** Choose the materials of one kind that need ordering, then raise one purchase requisition for them. */
export function MaterialPicker({ kind }: { kind: MaterialKind }) {
  const picker = useMaterialPicker(kind);
  const { has } = useAccess();
  const navigate = useNavigate();
  const [raising, setRaising] = useState(false);
  const [viewing, setViewing] = useState<PickRow | null>(null);
  const [transferring, setTransferring] = useState<PickRow | null>(null);
  const mayCreate = has(createRequisitionPermissions[kind]);
  const count = picker.chosen.length;
  return <>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Select value={picker.category ?? everyCategory} onValueChange={(value) => picker.setCategory(value === everyCategory ? null : value)}>
        <SelectTrigger aria-label="Category" className="w-56"><SelectValue placeholder="All categories" /></SelectTrigger>
        <SelectContent><SelectItem value={everyCategory}>All categories</SelectItem>
          {picker.categories.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
      </Select>
      {mayCreate ? <div className="flex flex-wrap items-center gap-2">
        <span role="status" className="text-sm text-muted-foreground">{count === 0 ? "Tick the materials to order" : `${count} ${count === 1 ? "material" : "materials"} chosen`}</span>
        {count > 0 ? <Button type="button" size="sm" variant="outline" onClick={picker.clear}>Clear</Button> : null}
        <Button type="button" size="sm" disabled={count === 0} onClick={() => setRaising(true)}>Raise purchase requisition</Button>
      </div> : <span className="text-sm text-muted-foreground">You can view stock here; raising a requisition needs its own permission.</span>}
    </div>
    <MaterialPickerTable rows={picker.rows} search={picker.search} filtered={picker.category !== null} paging={picker.paging} loading={picker.loading} refreshing={picker.refreshing}
      error={picker.error} onRetry={picker.retry} transferPermission={createRequisitionPermissions[kind]} onShowStock={setViewing} onTransfer={setTransferring} selection={mayCreate ? { selected: picker.selected, onChange: picker.select } : undefined} />
    {viewing ? <StockAvailabilityDialog key={viewing.id} material={viewing} audit={createAudit} onClose={() => setViewing(null)} /> : null}
    {transferring ? <StockTransferDialog key={transferring.id} material={transferring} onClose={() => setTransferring(null)} /> : null}
    {raising && count > 0 ? <PurchaseRequisitionDialog initialLines={picker.chosen.map(newOrderLine)} onClose={() => setRaising(false)} onCreated={() => {
      picker.clear(); setRaising(false);
      if (viewRequisitionPermissions.some((permission) => has(permission))) void navigate(requisitionsPath);
    }} /> : null}
  </>;
}
