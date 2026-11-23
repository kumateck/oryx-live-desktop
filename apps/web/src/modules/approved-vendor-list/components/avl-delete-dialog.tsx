import { toast } from "sonner";
import { ConfirmActionDialog } from "@/shared/actions";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { useDeleteVendorListMutation } from "../api/avl-api";
import { ListStatus, type ListSummary } from "../lib/avl";
import { avlAudit } from "../lib/keys";
import { avlActionPermissions } from "../manifest";

export function DeleteVendorListDialog({ list, onClose, onDeleted }: {
  list: Pick<ListSummary, "id" | "revisionNumber" | "status">;
  onClose: () => void;
  onDeleted?: () => void;
}) {
  const [remove] = useDeleteVendorListMutation();
  const permission = usePermissionAction(avlActionPermissions.delete);
  return <ConfirmActionDialog require={avlActionPermissions.delete} title={`Delete revision ${list.revisionNumber}?`}
    description="This superseded revision will be removed from the list. Its history is retained. The current approved revision continues to govern procurement."
    confirmLabel="Delete revision" busyLabel="Deleting…" onClose={onClose} onConfirm={async () => {
      if (list.status !== ListStatus.Superseded) return "Only a superseded revision can be deleted. Reload the list to check its status.";
      const denied = permission.check();
      if (denied) return denied;
      const result = await remove({ ...avlAudit, id: list.id });
      if ("error" in result) return apiErrorMessage(result.error);
      toast.success(`Revision ${list.revisionNumber} deleted`);
      onDeleted?.();
      return null;
    }} />;
}
