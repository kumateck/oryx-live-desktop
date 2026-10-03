import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { toLargestUnit } from "@/shared/units/quantity";
import { useConfirmMaterialDistributionMutation } from "../api/distribution-api";
import { audit, sectionTotals } from "../lib/distribution";
import type { DistributionSection } from "../schemas/distribution-schema";

const show = (value: number, unit: string | null) => toLargestUnit(value, unit, "calculated")?.text ?? String(value);

/**
 * Confirms how one material of a delivery is shared out. The shares are worked out by the server, in
 * proportion to what each department asked for; this only confirms them and says where the goods are received.
 */
export function ConfirmDistributionDialog({ shipmentId, section, onClose, onDone }: { shipmentId: string; section: DistributionSection; onClose: () => void; onDone: () => void }) {
  const [confirm, state] = useConfirmMaterialDistributionMutation();
  const [message, setMessage] = useState("");
  const departments = [...new Map(section.shares.flatMap((share) => share.departmentId ? [[share.departmentId, share.department] as const] : [])).entries()];
  const [receiver, setReceiver] = useState<string | null>(departments.length === 1 ? departments[0]?.[0] ?? null : null);
  const totals = sectionTotals(section);
  const busy = state.isLoading;

  const run = async () => {
    setMessage("");
    if (!receiver) { setMessage("Choose the department whose store receives the goods."); return; }
    const result = await confirm({ ...audit, shipmentId, materialId: section.materialId, departmentId: receiver });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    toast.success(`${section.materialName} distributed`, { description: "It is now in the receiving area, waiting for its checklist." });
    onDone();
  };

  return <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
    <DialogContent className="sm:max-w-2xl">
      <DialogHeader><DialogTitle>Distribute {section.materialName}</DialogTitle>
        <DialogDescription>{show(section.arrived, section.unit)} arrived against {show(totals.requested, section.unit)} asked for. This cannot be undone.</DialogDescription></DialogHeader>
      <DialogBody className="space-y-3">
        <table className="w-full text-sm"><caption className="sr-only">Shares by department</caption>
          <thead><tr className="border-b text-left text-xs text-muted-foreground"><th scope="col" className="py-1.5 font-medium">Department</th><th scope="col" className="py-1.5 text-right font-medium">Asked for</th><th scope="col" className="py-1.5 text-right font-medium">Receives</th></tr></thead>
          <tbody>{section.shares.map((share) => <tr key={share.key} className="border-b last:border-0"><td className="py-1.5">{share.department}</td><td className="py-1.5 text-right">{show(share.requested, section.unit)}</td>
            <td className="py-1.5 text-right font-medium">{show(share.allocated, section.unit)}</td></tr>)}</tbody></table>
        {totals.short > 0 ? <p role="status" className="rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-sm">The delivery is {show(totals.short, section.unit)} short of what was asked for, so each department receives its share in proportion.</p> : null}
        {departments.length > 1 ? <fieldset className="space-y-1.5"><legend className="text-sm font-medium">Received at the store of</legend>
          {departments.map(([id, name]) => <label key={id} className="flex items-center gap-2 text-sm"><input type="radio" name="receiver" value={id} checked={receiver === id} disabled={busy} onChange={() => setReceiver(id)} />{name}</label>)}
          <p className="text-xs text-muted-foreground">The whole delivery of this material is checked in at one store's receiving area.</p></fieldset>
          : <p className="text-sm text-muted-foreground">Received at the store of {departments[0]?.[1] ?? "the department"}.</p>}
        {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
      </DialogBody>
      <DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={onClose}>Cancel</Button>
        <Button type="button" disabled={busy} onClick={() => void run()}>{busy ? <><Spinner />Distributing…</> : "Confirm distribution"}</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}
