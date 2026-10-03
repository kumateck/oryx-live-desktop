import { useMemo, useState } from "react";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PurchaseRequisitionDialog } from "@/modules/requisitions/components/purchase-requisition-dialog";
import { createRequisitionPermissions } from "@/modules/requisitions/lib/requisition-access";
import { useAccess } from "@/shared/auth/use-access";
import type { MaterialKind } from "@/shared/reference-data/kind-tabs";
import { shortageOrderLines } from "../../lib/batch-shortages";
import type { BatchMaterial } from "../../schemas/batch-schema";

/** Raises one purchase requisition for a batch's short materials of one kind. Shown only when there is something to buy and the user may buy it. */
export function RaiseShortageRequisition({ kind, batchId, batchName, materials, onRaised }: { kind: MaterialKind; batchId: string; batchName: string; materials: readonly BatchMaterial[]; onRaised: () => void }) {
  const { has } = useAccess();
  const [open, setOpen] = useState(false);
  const lines = useMemo(() => shortageOrderLines(materials), [materials]);
  if (lines.length === 0 || !has(createRequisitionPermissions[kind])) return null;
  return <>
    <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}><ShoppingCart />Raise purchase requisition ({lines.length})</Button>
    {open ? <PurchaseRequisitionDialog initialLines={lines} batchId={batchId} onClose={() => setOpen(false)} onCreated={() => { setOpen(false); onRaised(); }}
      description={`For ${batchName}. Each quantity starts at what the batch is short by; change it if more should be ordered.`} /> : null}
  </>;
}
