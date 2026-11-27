import { useCallback, useMemo, useRef } from "react";
import { qcApi } from "@/shared/api/generated/qc";
import type { SelectLoader } from "@/shared/forms/form-wizard-types";
import type { AsyncSource, LinkedRecord } from "./table-question";

const audit = { module: "Quality Control", subModule: "QC Equipment" } as const;

/** Both record lists read the QC equipment list (reagents are kept there). Equipment is known by its ID, a reagent by its name. */
export const recordLabel = (source: AsyncSource, record: { name?: string | null; equipmentId?: string | null; id: string }) => {
  const name = record.name?.trim() || null;
  const code = record.equipmentId?.trim() || null;
  return source === "reagents" ? (name && code ? `${name} (${code})` : name ?? code ?? record.id) : code ?? name ?? record.id;
};

export interface RecordOptions {
  /** The options for a record list. */
  loader: (source: AsyncSource) => SelectLoader;
  /** A record already offered by a loader, for filling linked cells; null when it has not been loaded in this view. */
  lookup: (id: string) => LinkedRecord | null;
}

/** Pages through the record lists table cells choose from, remembering each record so linked cells can show its properties. */
export function useRecordOptions(): RecordOptions {
  const [load] = qcApi.useLazyGetApiV1QcEquipmentQuery();
  const seen = useRef(new Map<string, LinkedRecord>());
  const make = useCallback((source: AsyncSource): SelectLoader => async (search, page, signal) => {
    const request = load({ ...audit, searchQuery: search, page, pageSize: 20 });
    signal.addEventListener("abort", () => request.abort(), { once: true });
    const result = await request.unwrap();
    const current = result.pageIndex ?? page;
    return {
      options: (result.data ?? []).flatMap((item) => {
        if (!item.id) return [];
        seen.current.set(item.id, { name: item.name?.trim() || null, code: item.equipmentId?.trim() || null });
        return [{ value: item.id, label: recordLabel(source, { ...item, id: item.id }) }];
      }),
      hasNext: current < (result.pageCount ?? current), hasPrevious: current > 1,
    };
  }, [load]);
  // One stable loader per list, so a select does not reload its options on every render.
  const loaders = useMemo(() => ({ equipments: make("equipments"), reagents: make("reagents") }), [make]);
  const loader = useCallback((source: AsyncSource) => loaders[source], [loaders]);
  const lookup = useCallback((id: string) => seen.current.get(id) ?? null, []);
  return useMemo(() => ({ loader, lookup }), [loader, lookup]);
}
