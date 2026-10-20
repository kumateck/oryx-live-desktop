import { useRef, useState } from "react";
import { toast } from "sonner";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import type { MaterialKind } from "@/shared/reference-data/kind-tabs";
import { useLazyGetApiV1WarehouseGrnByIdQuery } from "../api/quarantine-api";
import { usePostApiV1ProcurementDistributeMaterialMutation } from "../api/distribution-api";
import { distributionBody, distributionPlan, sameAllocation, type WarehousePlan } from "../lib/distribution-plan";
import { audit, distributePermissions, distributionAudit, quarantinePermissions } from "../lib/quarantine";
import { grnSchema, type Grn } from "../schemas/grn-schema";

export function useDistribution(grn: Grn, kind: MaterialKind, onDone: () => void) {
  const action = usePermissionAction({ kind: "all", permissions: [quarantinePermissions[kind], distributePermissions[kind]] });
  const [read] = useLazyGetApiV1WarehouseGrnByIdQuery();
  const [write] = usePostApiV1ProcurementDistributeMaterialMutation();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const inFlight = useRef(false);

  async function submit(materialId: string, reviewed: WarehousePlan) {
    if (inFlight.current) return;
    setMessage("");
    const denied = action.check();
    if (denied) { setMessage(denied); return; }
    if (!reviewed.allocations.length || reviewed.allocated <= 0) { setMessage("There is no approved stock to distribute to this warehouse."); return; }
    inFlight.current = true;
    setBusy(reviewed.id);
    try {
      // Always read the server before a stock write, even if the dialog was just opened.
      const response = await read({ ...audit, id: grn.id }, false);
      if ("error" in response) { setMessage(`Stock could not be checked: ${apiErrorMessage(response.error)}`); return; }
      const parsed = grnSchema.safeParse(response.data);
      if (!parsed.success || !parsed.data || parsed.data.id !== grn.id) { setMessage("The refreshed note could not be read. Nothing was distributed."); return; }
      const fresh = distributionPlan(parsed.data, materialId, kind);
      const warehouse = fresh.warehouses.find((item) => item.id === reviewed.id);
      if (fresh.problem || !warehouse || !sameAllocation(reviewed, warehouse)) {
        setMessage(fresh.problem ?? "Stock or warehouse requests changed. Review the updated plan before distributing.");
        return;
      }
      const noLongerAllowed = action.check();
      if (noLongerAllowed) { setMessage(noLongerAllowed); return; }
      const result = await write({ ...distributionAudit, body: distributionBody(warehouse) });
      if ("error" in result) {
        setMessage(apiErrorMessage(result.error));
        // A failed response may follow a server write. Refresh evidence; never repeat the mutation automatically.
        await read({ ...audit, id: grn.id }, false);
        return;
      }
      toast.success(`Material distributed to ${warehouse.name}`);
      onDone();
    } finally {
      inFlight.current = false;
      setBusy(null);
    }
  }
  return { submit, busy, message };
}
