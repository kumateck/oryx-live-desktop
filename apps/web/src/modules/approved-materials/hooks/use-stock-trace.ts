import { useMemo } from "react";
import { useGetPackagingMaterialStockTraceQuery, useGetRawMaterialStockTraceQuery, useGetRawMaterialStockTracePrintQuery, useGetPackagingMaterialStockTracePrintQuery } from "../api/approved-material-api";
import { stockTraceSchema } from "../schemas/stock-trace";
import { apiErrorMessage } from "@/shared/errors/api-error-message";

export function useStockTrace(materialId: string, departmentId: string, kind: 0 | 1, since: string, forPrint = false) {
  const args = { materialId, departmentId, since: `${since}T00:00:00Z`, module: "Warehouse", subModule: "Approved Materials" };
  const raw = useGetRawMaterialStockTraceQuery(args, { skip: forPrint || kind !== 0 });
  const packaging = useGetPackagingMaterialStockTraceQuery(args, { skip: forPrint || kind !== 1 });
  const rawPrint = useGetRawMaterialStockTracePrintQuery(args, { skip: !forPrint || kind !== 0, refetchOnMountOrArgChange: true });
  const packagingPrint = useGetPackagingMaterialStockTracePrintQuery(args, { skip: !forPrint || kind !== 1, refetchOnMountOrArgChange: true });
  const query = forPrint ? kind === 0 ? rawPrint : packagingPrint : kind === 0 ? raw : packaging;
  const parsed = useMemo(() => query.currentData ? stockTraceSchema.safeParse(query.currentData) : null, [query.currentData]);
  const matches = parsed?.success && parsed.data.materialId === materialId && parsed.data.departmentId === departmentId && parsed.data.materialKind === kind;
  const error = query.error ? apiErrorMessage(query.error) : parsed && (!parsed.success || !matches) ? "The stock trace is incomplete or does not match this material and department. Refresh before reporting balances." : null;
  const waiting = forPrint && query.isFetching;
  return { data: !error && !waiting && parsed?.success && matches ? parsed.data : null,
    loading: query.isFetching && (!query.currentData || forPrint), error,
    retry: () => { void query.refetch(); } };
}
