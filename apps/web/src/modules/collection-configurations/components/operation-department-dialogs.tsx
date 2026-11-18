import { lazy, Suspense } from "react";
import { toast } from "sonner";
import { ConfirmActionDialog } from "@/shared/actions/confirm-action-dialog";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { useDeleteApiV1CollectionOperationsByOperationIdDepartmentMutation } from "../api/collection-api";
import type { OperationDepartmentPermissions } from "../lib/collections";
import type { CollectionRow } from "../schemas/collection-schema";

const LinkDepartmentDialog = lazy(() => import("./link-department-dialog").then((module) => ({ default: module.LinkDepartmentDialog })));
export type DepartmentAction = { kind: "link"; item: CollectionRow } | { kind: "unlink"; item: CollectionRow };

/** The link picker or the unlink confirmation for one operation. */
export function OperationDepartmentDialogs({ action, permissions, audit, onClose }: {
  action: DepartmentAction;
  permissions: OperationDepartmentPermissions;
  audit: { module: string; subModule: string };
  onClose: () => void;
}) {
  const [unlink] = useDeleteApiV1CollectionOperationsByOperationIdDepartmentMutation();
  if (action.kind === "link") return <Suspense fallback={<p role="status" className="text-sm text-muted-foreground">Opening form…</p>}>
    <LinkDepartmentDialog operation={action.item} require={permissions.link} audit={audit} onClose={onClose} />
  </Suspense>;
  const department = action.item.linkedDepartmentName || "its department";
  const confirm = async () => {
    const result = await unlink({ ...audit, operationId: action.item.id });
    if ("error" in result) return apiErrorMessage(result.error);
    toast.success(`Unlinked from ${department}`);
    return null;
  };
  return <ConfirmActionDialog require={permissions.unlink} title="Unlink department"
    description={`Unlink “${action.item.name}” from ${department}? It will no longer be offered in that department's product procedures or shown on its production activity board. Batches already using it keep their history.`}
    confirmLabel="Unlink" busyLabel="Unlinking…" onConfirm={confirm} onClose={onClose} />;
}
