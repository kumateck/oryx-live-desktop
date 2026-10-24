import { useCallback, useEffect, useRef } from "react";
import type { UseFormReturn } from "react-hook-form";
import { useGeneratedCode } from "@/shared/codes/use-generated-code";
import { useLazyGetApiV1ProcurementBillingSheetQuery } from "../api/billing-api";
import { audit } from "../lib/billing-access";
import type { CreateSheetValues } from "../schemas/billing-schema";

/** BillingSheet uses its list count, as in Next; its generic configuration-count route is unsupported. */
export function useBillingSheetCode(form: UseFormReturn<CreateSheetValues>) {
  const [loadSheets] = useLazyGetApiV1ProcurementBillingSheetQuery();
  const countRecords = useCallback(async () => {
    const result = await loadSheets({ ...audit, page: 1, pageSize: 1 }, false).unwrap();
    return result.totalRecordCount ?? null;
  }, [loadSheets]);
  const { suggest, ready, busy, unavailable, refetchRule } = useGeneratedCode("BillingSheet", countRecords);
  const initialized = useRef(false);
  const suggestNumber = useCallback(async (replace: boolean) => {
    const next = await suggest();
    if (next && (replace || !form.getValues("code"))) {
      form.setValue("code", next, { shouldValidate: true, shouldDirty: replace });
    }
  }, [suggest, form]);

  useEffect(() => {
    if (!ready || initialized.current) return;
    initialized.current = true;
    void suggestNumber(false);
  }, [ready, suggestNumber]);

  const regenerate = useCallback(() => {
    if (ready) void suggestNumber(true);
    else {
      initialized.current = false;
      void refetchRule();
    }
  }, [ready, suggestNumber, refetchRule]);

  return { busy, unavailable, regenerate };
}
