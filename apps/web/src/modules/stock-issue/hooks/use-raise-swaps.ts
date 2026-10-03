import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { useLazyGetApiV1MaterialByMaterialIdShelfQuery, usePostApiV1WarehouseSwapMutation } from "../api/stock-issue-api";
import { shelfRecordsSchema, swapRequestFor, type ShelfRecord, type SwapSuggestion } from "../lib/alternative-batches";
import { audit } from "../lib/stock-issue";

export interface SwapOutcome { key: string; reason: string | null }

/**
 * Asks for the chosen swaps, one request at a time and in order. Each is checked against the shelves as they are
 * now before it is sent. Every suggestion gets an outcome, so a run that only partly works says exactly which
 * swaps were asked for and why the others were not.
 */
export function useRaiseSwaps(requisitionId: string) {
  const [loadShelves] = useLazyGetApiV1MaterialByMaterialIdShelfQuery();
  const [create] = usePostApiV1WarehouseSwapMutation();
  return async (suggestions: readonly SwapSuggestion[]): Promise<SwapOutcome[]> => {
    const shelves = new Map<string, ShelfRecord[] | string>();
    const outcomes: SwapOutcome[] = [];
    for (const suggestion of suggestions) {
      let records = shelves.get(suggestion.materialId);
      if (records === undefined) {
        const loaded = await loadShelves({ ...audit, materialId: suggestion.materialId });
        const parsed = loaded.error ? null : shelfRecordsSchema.safeParse(loaded.data ?? []);
        records = loaded.error ? apiErrorMessage(loaded.error) : parsed?.success ? parsed.data : "The server returned shelves the app could not read.";
        shelves.set(suggestion.materialId, records);
      }
      if (typeof records === "string") { outcomes.push({ key: suggestion.key, reason: records }); continue; }
      const request = swapRequestFor(suggestion, records, requisitionId);
      if ("reason" in request) { outcomes.push({ key: suggestion.key, reason: request.reason }); continue; }
      const result = await create({ ...audit, domainEntitiesWarehousesCreateSwapRequest: request.body });
      outcomes.push({ key: suggestion.key, reason: "error" in result && result.error ? apiErrorMessage(result.error) : null });
    }
    return outcomes;
  };
}
