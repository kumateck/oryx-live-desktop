import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { useGetApiV1ProductionOrdersByIdQuery } from "../api/order-api";
import { audit } from "../lib/orders";
import { orderSchema } from "../schemas/order-schema";
import { PackingListDialog, type EditedPackingList } from "./packing-list-dialog";

/** Opens a packing list for editing: reads its production order first, since the list is checked against what the order still needs. */
export function EditPackingListDialog({ orderId, list, onClose }: { orderId: string; list: EditedPackingList; onClose: () => void }) {
  const [openedAt] = useState(Date.now);
  const query = useGetApiV1ProductionOrdersByIdQuery({ ...audit, id: orderId }, { refetchOnMountOrArgChange: true });
  const order = useMemo(() => { const parsed = orderSchema.safeParse(query.data ?? null); return parsed.success ? parsed.data : null; }, [query.data]);
  // Wait for one read made after opening, so the list is checked against the order as it is now. After that the
  // dialog stays open through background refreshes, which would otherwise throw away the user's changes.
  const [ready, setReady] = useState(false);
  if (!ready && order && (query.fulfilledTimeStamp ?? 0) >= openedAt) setReady(true);
  if ((ready || ((query.fulfilledTimeStamp ?? 0) >= openedAt)) && order) return <PackingListDialog order={order} editing={list} onClose={onClose} />;
  const failed = !query.isFetching && !order;
  return <Dialog open onOpenChange={(next) => { if (!next) onClose(); }}>
    <DialogContent className="sm:max-w-md">
      <DialogHeader><DialogTitle>Edit packing list</DialogTitle><DialogDescription>{failed ? "The production order could not be read." : "Reading the production order…"}</DialogDescription></DialogHeader>
      <DialogBody>{failed ? <p role="alert" className="text-sm text-destructive">{query.error ? apiErrorMessage(query.error) : "The server returned an order the app could not read."}</p>
        : <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><Spinner />Loading…</p>}</DialogBody>
      <DialogFooter><Button type="button" variant="outline" onClick={onClose}>Close</Button>{failed ? <Button type="button" onClick={() => void query.refetch()}>Retry</Button> : null}</DialogFooter>
    </DialogContent>
  </Dialog>;
}
