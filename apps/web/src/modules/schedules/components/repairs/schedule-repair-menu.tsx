import { lazy, Suspense, useMemo, useState } from "react";
import { Wrench } from "lucide-react";
import { DropdownButton } from "@/shared/actions";
import { Skeleton } from "@/shared/skeleton/skeleton";
import type { ScheduleRow } from "../../schemas/schedule-schema";
import { scheduleRepairRequirement, scheduleRepairTitles, type ScheduleRepairKind } from "../../schemas/schedule-repair";

const RepairDialog = lazy(() => import("./schedule-repair-dialog"));

export function ScheduleRepairMenu({ schedule, initialProductId }: { schedule: ScheduleRow; initialProductId: string | null }) {
  const [kind, setKind] = useState<ScheduleRepairKind | null>(null);
  const products = useMemo(() => [...new Map(schedule.products.flatMap((batch) => batch.productId
    ? [[batch.productId, { value: batch.productId, label: `${batch.code ? `${batch.code} · ` : ""}${batch.name}` }] as const] : [])).values()], [schedule.products]);
  return <>
    <DropdownButton label="Repair product batches" icon={Wrench} items={([0, 1, 2] as const).map((value) => ({
      id: `repair-${value}`, label: scheduleRepairTitles[value], require: scheduleRepairRequirement(value),
      disabled: products.length === 0, onSelect: () => setKind(value),
    }))} />
    {kind !== null ? <Suspense fallback={<Skeleton className="h-8 w-48" />}><RepairDialog key={`${schedule.id}-${kind}`} scheduleId={schedule.id}
      products={products} initialProductId={initialProductId} kind={kind} onClose={() => setKind(null)} /></Suspense> : null}
  </>;
}
