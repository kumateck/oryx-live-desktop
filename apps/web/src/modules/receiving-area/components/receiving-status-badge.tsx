import { Badge } from "@/components/ui/badge";
import { receivingStatusLabels, type ReceivingStatus } from "../lib/receiving";

export function ReceivingStatusBadge({ status }: { status: ReceivingStatus }) {
  return <Badge variant={status >= 3 ? "default" : status === 2 ? "secondary" : "outline"}>{receivingStatusLabels[status]}</Badge>;
}
