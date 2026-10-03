import { Badge } from "@/components/ui/badge";
import { shipmentStatus, shipmentStatusLabels, type ShipmentStatus } from "../lib/shipment-kinds";

export function ShipmentStatusBadge({ status }: { status: ShipmentStatus }) {
  return <Badge variant={status === shipmentStatus.arrived ? "default" : status === shipmentStatus.new ? "outline" : "secondary"}>{shipmentStatusLabels[status]}</Badge>;
}
