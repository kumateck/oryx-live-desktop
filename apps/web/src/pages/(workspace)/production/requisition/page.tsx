import { Navigate } from "react-router";
import { createRequisitionPath, requisitionsPath, viewRequisitionPermissions } from "@/modules/requisitions/lib/requisition-access";
import { useAccess } from "@/shared/auth/use-access";

/** The section has no page of its own: it opens the list, or the create page for someone who may only raise requisitions. */
export default function RequisitionIndexPage() {
  const { has } = useAccess();
  return <Navigate replace to={viewRequisitionPermissions.some((permission) => has(permission)) ? requisitionsPath : createRequisitionPath} />;
}
