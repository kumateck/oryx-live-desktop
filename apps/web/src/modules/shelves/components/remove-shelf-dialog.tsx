import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { useDeleteApiV1WarehouseShelfByShelfIdMutation, useGetApiV1WarehouseShelfByShelfIdQuery } from "@/modules/racks/api/rack-api";
import { shelfAudit } from "@/modules/racks/lib/rack-access";
import { shelfStockSchema, type StorageShelf } from "@/modules/racks/schemas/rack-schema";
import { apiErrorMessage } from "@/shared/errors/api-error-message";

/** Removes a shelf, after checking it is empty. The list does not say what a shelf holds, so the shelf is read first. */
export function RemoveShelfDialog({ shelf, onClose }: { shelf: StorageShelf; onClose: () => void }) {
  const query = useGetApiV1WarehouseShelfByShelfIdQuery({ ...shelfAudit, shelfId: shelf.id }, { refetchOnMountOrArgChange: true });
  const [remove, mutation] = useDeleteApiV1WarehouseShelfByShelfIdMutation();
  const [message, setMessage] = useState("");
  const stock = useMemo(() => { const parsed = shelfStockSchema.safeParse(query.data ?? null); return parsed.success ? parsed.data : null; }, [query.data]);
  const checking = query.isFetching;
  const block = checking ? null : query.error ? `The shelf's stock could not be checked: ${apiErrorMessage(query.error)}` : !stock ? "The shelf's stock could not be read, so it cannot be removed."
    : stock.inStock ? "This shelf still holds stock. Move the stock to another shelf first." : null;
  const confirm = async () => {
    setMessage("");
    const result = await remove({ ...shelfAudit, shelfId: shelf.id });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    toast.success("Shelf removed");
    onClose();
  };
  const busy = mutation.isLoading;
  return <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}><DialogContent>
    <DialogHeader><DialogTitle>Remove shelf {shelf.code || shelf.name}?</DialogTitle>
      <DialogDescription>{checking ? "Checking that the shelf is empty…" : block ?? "The shelf will no longer be offered for storing stock."}</DialogDescription></DialogHeader>
    {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
    <DialogFooter>
      <Button type="button" variant="outline" disabled={busy} onClick={onClose}>{block ? "Close" : "Cancel"}</Button>
      {block ? null : <Button type="button" variant="destructive" disabled={busy || checking} onClick={() => void confirm()}>{busy ? <><Spinner />Removing…</> : "Remove shelf"}</Button>}
    </DialogFooter>
  </DialogContent></Dialog>;
}
