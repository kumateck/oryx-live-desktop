import { useCallback, useRef } from "react";
import { inventoryApi } from "@/shared/api/generated/inventory";
import type { SelectLoader, SelectOption } from "@/shared/forms/form-wizard-types";
import type { Classification } from "./contracts";
import type { Store } from "./stores";

/** An item chosen on a requisition line, with what the form needs to show beside it. */
export interface ItemChoice {
  id: string; name: string; code: string; classification: Classification; available: number;
  unitId: string; unitName: string; unitSymbol: string | null;
}

const label = (choice: ItemChoice) => `${choice.name} · ${choice.code}`;

/**
 * Active items of one store, searched on the server a page at a time. Every loaded item is remembered so the form can show
 * its code, stock and unit as soon as it is chosen.
 */
export function useItemChoices(store: Store, audit: { module: string; subModule: string }) {
  const [load] = inventoryApi.useLazyGetApiV1ItemsChoicesQuery();
  const known = useRef(new Map<string, ItemChoice>());
  const loadOptions = useCallback<SelectLoader>(async (searchQuery, page) => {
    const result = await load({ ...audit, store, searchQuery, page, pageSize: 20 }, true);
    if (result.error) throw new Error("Items could not be loaded. Try again.");
    const data = result.data;
    const options: SelectOption[] = [];
    for (const row of data?.data ?? []) {
      if (!row.id || !row.name || !row.code || row.unitOfMeasureId === undefined) continue;
      const choice: ItemChoice = {
        id: row.id, name: row.name, code: row.code, classification: (row.classification ?? 0) as Classification, available: row.availableQuantity ?? 0,
        unitId: row.unitOfMeasureId, unitName: row.unitOfMeasureName ?? "", unitSymbol: row.unitOfMeasureSymbol ?? null,
      };
      known.current.set(choice.id, choice);
      options.push({ value: choice.id, label: label(choice) });
    }
    return { options, hasNext: (data?.pageIndex ?? 1) < (data?.pageCount ?? 1), hasPrevious: (data?.pageIndex ?? 1) > 1 };
  }, [audit, load, store]);
  /** An item already shown by the picker, or one remembered from the record being edited. */
  const lookup = useCallback((id: string | undefined) => (id ? known.current.get(id) ?? null : null), []);
  const remember = useCallback((choice: ItemChoice) => { known.current.set(choice.id, choice); }, []);
  return { loadOptions, lookup, remember, label };
}
