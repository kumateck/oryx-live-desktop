import { Badge } from "@/components/ui/badge";
import { statusLabel, statusTone, type RequisitionStatus, type RequisitionType } from "../lib/requisition-status";

export function RequisitionStatusBadge({ status, type }: { status: RequisitionStatus; type: RequisitionType }) {
  return <Badge variant={statusTone(status)}>{statusLabel(status, type)}</Badge>;
}
