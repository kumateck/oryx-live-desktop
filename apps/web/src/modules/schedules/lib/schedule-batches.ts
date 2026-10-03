import { toLargestUnit } from "@/shared/units/quantity";
import type { ScheduleBatch } from "../schemas/schedule-schema";
import { isScheduleEnded } from "./schedule-dates";

/** Where one batch stands. A batch that was never started when its schedule ended is "missed" and can no longer be acted on. */
export type BatchState = "cancelled" | "started" | "missed" | "waiting";
export function batchState(batch: Pick<ScheduleBatch, "cancelled" | "started">, scheduleEnd: string | null | undefined, now = new Date()): BatchState {
  if (batch.cancelled) return "cancelled";
  if (batch.started) return "started";
  return isScheduleEnded(scheduleEnd, now) ? "missed" : "waiting";
}
export const batchStateLabels: Record<BatchState, string> = { cancelled: "Cancelled", started: "In production", missed: "Not started in time", waiting: "Awaiting start" };

/** Only a batch that has not started and is not cancelled can be taken off a schedule; the server refuses the others. */
export function batchRemovable(batch: Pick<ScheduleBatch, "cancelled" | "started">): boolean {
  return !batch.cancelled && !batch.started;
}

export function batchSizeText(batch: Pick<ScheduleBatch, "quantity" | "unit" | "half">): string {
  const size = toLargestUnit(batch.quantity, batch.unit, "calculated")?.text;
  return `${batch.half ? "Half" : "Full"}${size ? ` (${size})` : ""}`;
}

/** What tells one batch from its siblings: its batch number once it has one, otherwise its position. */
export function batchLabel(batch: Pick<ScheduleBatch, "batchNumber">, index: number): string {
  return batch.batchNumber ?? `Batch ${index + 1}`;
}

export interface BatchGroup { key: string; name: string; code: string | null; detail: string; batches: ScheduleBatch[] }

/** Batches that are the same product made the same way (size, packing style, market), kept together. */
export function groupBatches(batches: readonly ScheduleBatch[]): BatchGroup[] {
  const groups = new Map<string, BatchGroup>();
  for (const batch of batches) {
    const key = [batch.productId ?? batch.name, batch.quantity, batch.half, batch.packing?.id, batch.market?.id].join("::");
    const group = groups.get(key);
    if (group) { group.batches.push(batch); continue; }
    groups.set(key, { key, name: batch.name, code: batch.code, batches: [batch],
      detail: [batchSizeText(batch), batch.packing?.name ?? "No packing style", batch.market?.name].filter(Boolean).join(" · ") });
  }
  return [...groups.values()];
}

/** The first batches of a group that can still be removed, for "take N off". */
export function firstRemovable(group: BatchGroup, count: number): string[] {
  return group.batches.filter(batchRemovable).slice(0, Math.max(0, Math.trunc(count) || 0)).flatMap((batch) => batch.id ? [batch.id] : []);
}
