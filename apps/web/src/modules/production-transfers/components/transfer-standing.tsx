import { Badge } from "@/components/ui/badge";
import { statusLabel, TransferStatus } from "../lib/transfers";
export function TransferStanding({ status }: { status: number | null | undefined }) {
  return <Badge variant={status === TransferStatus.Rejected ? "destructive" : status === TransferStatus.Approved || status === TransferStatus.Issued ? "secondary" : "outline"}>{statusLabel(status)}</Badge>;
}
