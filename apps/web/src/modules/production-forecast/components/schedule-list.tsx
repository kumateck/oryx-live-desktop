import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/shared/format/dates";
import { batchSizeLabel } from "../lib/forecast";
import type { ForecastBatch, ForecastSchedule } from "../schemas/forecast";

function Ready({ ready, reserved }: { ready: boolean; reserved: boolean }) {
  if (reserved) return <Badge variant="outline">Reserved</Badge>;
  return ready ? <Badge variant="secondary">Covered</Badge> : <Badge variant="destructive">Short</Badge>;
}

const batchLabel = (batch: ForecastBatch) => batch.batchNumber || "No batch number";

/** The month's schedules and their batches, with whether each batch's materials are covered. */
export function ScheduleList({ schedules }: { schedules: ForecastSchedule[] }) {
  return <section className="space-y-2" aria-labelledby="forecast-schedules">
    <h2 id="forecast-schedules" className="text-base font-semibold">Production schedules</h2>
    <Table aria-label="Production schedules and batches">
      <TableHeader><TableRow>
        <TableHead>Schedule</TableHead><TableHead>Batch</TableHead><TableHead>Product</TableHead>
        <TableHead>Size and packing</TableHead><TableHead>Raw materials</TableHead><TableHead>Packaging</TableHead>
      </TableRow></TableHeader>
      <TableBody>{schedules.flatMap((schedule) => schedule.batches.map((batch, index) => <TableRow key={batch.id}>
        <TableCell className="whitespace-normal">{index === 0 ? <><div className="font-medium">{schedule.code || "No code"}</div>
          <div className="text-xs text-muted-foreground">{formatDate(schedule.scheduledStartTime) ?? "–"} to {formatDate(schedule.scheduledEndTime) ?? "–"}</div></> : null}</TableCell>
        <TableCell className="whitespace-normal break-all">{batchLabel(batch)}{batch.started ? <div className="text-xs text-muted-foreground">Started</div> : null}</TableCell>
        <TableCell className="whitespace-normal"><div className="break-words">{batch.productName}</div><div className="text-xs text-muted-foreground">{batch.productCode}</div></TableCell>
        <TableCell className="whitespace-normal">{batchSizeLabel(batch.batchSize)}<div className="text-xs text-muted-foreground">{batch.packingStyle || "No packing style"}</div></TableCell>
        <TableCell><Ready ready={batch.rawReady} reserved={batch.rawReserved} /></TableCell>
        <TableCell><Ready ready={batch.packagingReady} reserved={batch.packagingReserved} /></TableCell>
      </TableRow>))}</TableBody>
    </Table>
  </section>;
}
