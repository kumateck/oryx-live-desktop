import { linkFormSchema } from "../schemas/material-schema";
import { storedLevel } from "./materials";

/** What has been filled in for one unlinked material, before it is linked. Levels are in the largest unit of the unit's family. */
export interface LinkDraft { name: string; unitId: string | null; unit: string | null; minimum: number | null; reorder: number | null; maximum: number | null }
export const emptyDraft = (name: string): LinkDraft => ({ name, unitId: null, unit: null, minimum: null, reorder: null, maximum: null });
/** A draft with nothing in it is not a change and is dropped. */
export const draftIsEmpty = (draft: LinkDraft) => draft.unitId === null && draft.minimum === null && draft.reorder === null && draft.maximum === null;

/** What still stops a draft being linked, or null when it is ready. The rules are the ones of linking a single material. */
export function draftIssue(draft: LinkDraft): string | null {
  const parsed = linkFormSchema.safeParse({ unit: draft.unitId && draft.unit ? { value: draft.unitId, label: draft.unit } : null, minimum: draft.minimum ?? Number.NaN, reorder: draft.reorder ?? Number.NaN, maximum: draft.maximum ?? Number.NaN });
  return parsed.success ? null : parsed.error.issues[0]?.message ?? "Complete the unit and levels";
}
/** The drafts that are ready, as the request that links them all at once. */
export function readyLinks(drafts: ReadonlyMap<string, LinkDraft>) {
  return [...drafts].filter(([, draft]) => draftIssue(draft) === null).map(([materialId, draft]) => ({ materialId, uoMId: draft.unitId ?? "", minimumStockLevel: storedLevel(draft.minimum ?? 0, draft.unit), reOrderLevel: storedLevel(draft.reorder ?? 0, draft.unit),
    maximumStockLevel: storedLevel(draft.maximum ?? 0, draft.unit), density: 0, densityUoMId: null }));
}
/** The unit types offered for a kind of material: raw materials are counted in raw units, packaging in raw or packing units. */
export const unitTypesFor = (kind: 0 | 1): number[] => kind === 0 ? [0] : [0, 1];
