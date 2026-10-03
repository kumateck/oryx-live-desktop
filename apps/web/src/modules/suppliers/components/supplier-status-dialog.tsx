import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { usePutApiV1ProcurementSupplierBySupplierIdStatusMutation } from "../api/supplier-api";
import { supplierAudit, supplierStatus, supplierPermissions } from "../lib/supplier-access";

type Status = 0 | 1 | 2;
function parseStatus(value: string): Status { return value === "1" ? 1 : value === "2" ? 2 : 0; }

export function SupplierStatusDialog({ id, current }: { id: string; current: Status | undefined }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>(current ?? 0);
  const [interval, setInterval] = useState(365);
  const [error, setError] = useState("");
  const permission = usePermissionAction(supplierPermissions.edit);
  const [update, mutation] = usePutApiV1ProcurementSupplierBySupplierIdStatusMutation();
  const save = async () => {
    setError("");
    if (status === current) { setOpen(false); return; }
    if (status === 1 && (!Number.isInteger(interval) || interval <= 0)) { setError("Enter a whole number of days above zero."); return; }
    const denied = permission.check();
    if (denied) { setError(denied); return; }
    const result = await update({ ...supplierAudit, supplierId: id,
      domainEntitiesProcurementSuppliersUpdateSupplierStatusRequest: { status, ...(status === 1 ? { requalificationIntervalDays: interval } : {}) } });
    if ("error" in result) { setError(apiErrorMessage(result.error)); return; }
    toast.success(`Supplier status changed to ${supplierStatus(status)}`);
    setOpen(false);
  };
  return <Dialog open={open} onOpenChange={(next) => { setOpen(next); setError(""); if (next) setStatus(current ?? 0); }}>
    <DialogTrigger asChild><Button type="button" size="sm" variant="outline">Change status</Button></DialogTrigger>
    <DialogContent><DialogHeader><DialogTitle>Change supplier status</DialogTitle>
      <DialogDescription>Approving this supplier also marks its associated manufacturers approved. Confirm the qualification before saving.</DialogDescription></DialogHeader>
      <div className="space-y-2"><Label htmlFor="supplier-status">Status</Label><Select value={String(status)} onValueChange={(value) => setStatus(parseStatus(value))}>
        <SelectTrigger id="supplier-status" className="w-full"><SelectValue /></SelectTrigger><SelectContent>
          <SelectItem value="0">New</SelectItem><SelectItem value="1">Approved</SelectItem><SelectItem value="2">Rejected</SelectItem>
        </SelectContent></Select></div>
      {status === 1 ? <div className="space-y-2"><Label htmlFor="supplier-interval">Requalification after (days)</Label>
        <Input id="supplier-interval" type="number" min={1} step={1} value={interval} onChange={(event) => setInterval(Number(event.target.value))} /></div> : null}
      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
      <DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
        <Button type="button" disabled={!permission.allowed || mutation.isLoading || status === current} onClick={() => void save()}>{mutation.isLoading ? <><Spinner />Saving…</> : "Confirm change"}</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}
