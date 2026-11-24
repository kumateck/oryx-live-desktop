import { toast } from "sonner";
import { ConfirmActionDialog } from "@/shared/actions";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { useDeleteVendorListMutation } from "../api/avl-api";
import type { ListSummary } from "../lib/avl";
import { avlAudit } from "../lib/keys";
import { avlActionPermissions } from "../manifest";

export function DeleteVendorListDialog({ list, onClose, onDeleted }: {
  list: Pick<ListSummary, "id" | "revisionNumber">;
  onClose: () => void;
  onDeleted?: () => void;
}) {
  const [remove] = useDeleteVendorListMutation();
  const permission = usePermissionAction(avlActionPermissions.delete);
  return <ConfirmActionDialog require={avlActionPermissions.delete} title={`Delete revision ${list.revisionNumber}?`}
    description="This removes the revision from use and keeps its audit history. Any open review or approval for it will leave the queue. Deleting the current approved revision removes its procurement restrictions until a new revision is approved."
    confirmLabel="Delete revision" busyLabel="Deleting…" onClose={onClose} onConfirm={async () => {
      const denied = permission.check();
      if (denied) return denied;
      const result = await remove({ ...avlAudit, id: list.id });
      if ("error" in result) return apiErrorMessage(result.error);
      toast.success(`Revision ${list.revisionNumber} deleted`);
      onDeleted?.();
      return null;
    }} />;
}
