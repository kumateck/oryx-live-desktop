import { toLargestUnit } from "@/shared/units/quantity";
import type { RequisitionLine } from "../schemas/requisition-schema";

export function RequisitionBatches({ line }: { line: RequisitionLine }) {
  return line.batches?.length ? <ul className="space-y-1">{line.batches.map(batch => <li key={batch.key} className="break-words">
    <span className="font-medium">{batch.number}</span><span className="text-muted-foreground"> · {toLargestUnit(batch.quantity, batch.unit, "calculated")?.text ?? batch.quantity}</span>
  </li>)}</ul> : <span className="text-muted-foreground">No allocation recorded</span>;
}
