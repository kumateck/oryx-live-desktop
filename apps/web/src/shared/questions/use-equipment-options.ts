import { useCallback } from "react";
import { qcApi } from "@/shared/api/generated/qc";
import type { SelectLoader } from "@/shared/forms/form-wizard-types";

const audit = { module: "Quality Control", subModule: "QC Equipment" } as const;

/** Pages through QC equipment for equipment, instrument and table-cell answers. The option label is the equipment ID. */
export function useEquipmentOptions(): SelectLoader {
  const [load] = qcApi.useLazyGetApiV1QcEquipmentQuery();
  return useCallback<SelectLoader>(async (search, page, signal) => {
    const request = load({ ...audit, searchQuery: search, page, pageSize: 20 });
    signal.addEventListener("abort", () => request.abort(), { once: true });
    const result = await request.unwrap();
    const current = result.pageIndex ?? page;
    return {
      options: (result.data ?? []).flatMap((item) => item.id ? [{ value: item.id, label: item.equipmentId?.trim() || item.name?.trim() || item.id }] : []),
      hasNext: current < (result.pageCount ?? current), hasPrevious: current > 1,
    };
  }, [load]);
}
