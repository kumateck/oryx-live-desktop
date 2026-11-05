import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { useReservationRepair } from "../../hooks/use-reservation-repair";
import { ReservationRepairEvidence } from "./reservation-repair-evidence";

export default function ReservationRepairDialog({ batchId, onClose }: { batchId: string; onClose: () => void }) {
  const state = useReservationRepair(batchId, onClose);
  const { preview } = state;
  return <Dialog open onOpenChange={(open) => { if (!open) state.close(); }}>
    <DialogContent className="sm:max-w-4xl" showCloseButton={!state.busy}>
      <DialogHeader><DialogTitle>Repair stock reservations{preview?.batchNumber ? ` · ${preview.batchNumber}` : ""}</DialogTitle>
        <DialogDescription>Reconnect this batch’s unissued reservations to available replacement stock. Review each batch and shelf before confirming.</DialogDescription></DialogHeader>
      <form noValidate onSubmit={(event) => { event.stopPropagation(); void state.submit(event); }} className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
        <DialogBody className="space-y-4">
          <ReservationRepairEvidence state={state} />
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={state.busy} onClick={state.close}>Close</Button>
          <Button type="button" variant="outline" disabled={state.busy || state.fetching || !state.permission.allowed} onClick={() => void state.reload()}>Reload preview</Button>
          <Button type="submit" disabled={state.blocked}>{state.busy ? <><Spinner />Repairing…</> : "Apply reservation repair"}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
