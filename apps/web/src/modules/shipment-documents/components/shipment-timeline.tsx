import { Anchor, Check, FileText, PackageCheck, ShieldCheck, Truck, type LucideIcon } from "lucide-react";
import { cn } from "cn";
import { formatDateTime } from "@/shared/format/dates";
import { shipmentKinds, shipmentProgress, shipmentStageNotes, shipmentStatusLabels, type ShipmentKind, type ShipmentStatus } from "../lib/shipment-kinds";
import type { Shipment } from "../schemas/shipment-schema";

const icons: Record<ShipmentStatus, LucideIcon> = { 0: FileText, 1: Anchor, 2: ShieldCheck, 3: Truck, 4: PackageCheck };

/** The stages a delivery passes through: which are done, when each was reached, and how far along it is. */
export function ShipmentTimeline({ kind, shipment }: { kind: ShipmentKind; shipment: Pick<Shipment, "status" | "reached"> }) {
  const steps = shipmentKinds[kind].steps;
  const position = steps.indexOf(shipment.status);
  const progress = shipmentProgress(kind, shipment.status);
  return <section aria-label="Timeline" className="space-y-3 rounded-lg border bg-card p-4">
    <div className="flex flex-wrap items-baseline justify-between gap-2"><h2 className="text-sm font-semibold">Timeline</h2>
      <span className="text-sm"><span className="font-semibold">{progress.percent}%</span> <span className="text-muted-foreground">· {progress.done} of {progress.of} stages</span></span></div>
    <div role="progressbar" aria-label="Stages completed" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress.percent} className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${progress.percent}%` }} /></div>
    <ol aria-label="Stages" className="flex flex-wrap gap-2">{steps.map((step, index) => { const Icon = icons[step]; const done = index <= position;
      return <li key={step} aria-current={index === position ? "step" : undefined} className={cn("flex min-w-40 flex-1 items-start gap-2 rounded-lg border p-3", done ? "bg-background" : "opacity-60", index === position && "border-primary")}>
        <span aria-hidden="true" className={cn("flex size-7 shrink-0 items-center justify-center rounded-full border", done && "border-primary bg-primary text-primary-foreground")}>{done && index < position ? <Check className="size-3.5" /> : <Icon className="size-3.5" />}</span>
        <span className="min-w-0"><span className="block text-sm font-medium">{shipmentStatusLabels[step]}</span><span className="block text-xs text-muted-foreground">{shipmentStageNotes[step]}</span>
          <span className="mt-0.5 block text-xs">{done ? formatDateTime(shipment.reached[step]) ?? "Date not recorded" : "Not yet"}</span></span></li>; })}</ol>
  </section>;
}
