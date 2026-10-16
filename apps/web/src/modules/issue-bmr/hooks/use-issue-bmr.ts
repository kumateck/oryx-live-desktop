import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { settingsApi } from "@/shared/api/generated/settings";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { monthEndIso, monthStartIso } from "@/shared/batch-dates/batch-dates";
import { batchNumber, batchPrefix } from "@/shared/codes/batch-number";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { toSmallestUnit } from "@/shared/units/quantity";
import {
  useGetApiV1ProductionScheduleManufacturingByBatchManufacturingRecordIdQuery, useGetApiV1ProductionScheduleMaterialStockByProductionScheduleProductIdQuery,
  useGetApiV1ProductionSchedulePackageMaterialStockByProductionScheduleProductIdQuery, usePutApiV1ProductionScheduleManufacturingByIdMutation,
  usePutApiV1ProductionScheduleManufacturingIssueByIdMutation,
} from "../api/issue-bmr-api";
import { issueBmrAudit, issueBmrPermissions } from "../lib/issue-bmr";
import { bmrMaterialsSchema, bmrSchema, type Bmr } from "../schemas/bmr-schema";
import type { IssueValues } from "../schemas/issue-schema";

const codeAudit = { module: "Settings", subModule: "Code Settings" } as const;

/** The next batch number for the product this year, from the count of numbers already given. Null when it cannot be worked out. */
function useSuggestedBatchNumber(bmr: Bmr | null) {
  const [loadCount] = settingsApi.useLazyGetApiV1ConfigurationByModelTypeCountQuery();
  const [suggestion, setSuggestion] = useState<{ value: string | null; note: string | null } | null>(null);
  useEffect(() => {
    if (!bmr || bmr.issuedAt || bmr.batchNumber) { setSuggestion({ value: bmr?.batchNumber ?? null, note: null }); return; }
    const year = new Date().getFullYear();
    const code = bmr.productCode ?? "";
    const prefix = batchPrefix(code, year);
    if (!prefix) { setSuggestion({ value: null, note: `The product code "${code}" is not in the usual form, so enter the batch number yourself.` }); return; }
    let active = true;
    loadCount({ ...codeAudit, modelType: "ProductBatchNumber", prefix }).unwrap()
      .then((count) => { if (active) setSuggestion({ value: batchNumber(code, year, count + 1), note: "Suggested from the numbers already given this year. Check it before issuing." }); })
      .catch(() => { if (active) setSuggestion({ value: null, note: "A batch number could not be suggested. Enter it yourself." }); });
    return () => { active = false; };
  }, [bmr, loadCount]);
  return suggestion;
}

/** One batch record: its details, the materials it needs, and the two-step save-then-issue. */
export function useIssueBmr(id: string) {
  const query = useGetApiV1ProductionScheduleManufacturingByBatchManufacturingRecordIdQuery({ ...issueBmrAudit, batchManufacturingRecordId: id });
  const bmr = useMemo(() => { const parsed = bmrSchema.safeParse(query.data ?? null); return parsed.success ? parsed.data : null; }, [query.data]);
  const scheduleProductId = bmr?.scheduleProductId ?? "";
  const stockArg = { ...issueBmrAudit, productionScheduleProductId: scheduleProductId };
  const raw = useGetApiV1ProductionScheduleMaterialStockByProductionScheduleProductIdQuery(stockArg, { skip: !scheduleProductId });
  const packaging = useGetApiV1ProductionSchedulePackageMaterialStockByProductionScheduleProductIdQuery(stockArg, { skip: !scheduleProductId });
  const rawRows = useMemo(() => bmrMaterialsSchema.safeParse(raw.data ?? null), [raw.data]);
  const packagingRows = useMemo(() => bmrMaterialsSchema.safeParse(packaging.data ?? null), [packaging.data]);
  const suggestion = useSuggestedBatchNumber(bmr);
  const [update, updating] = usePutApiV1ProductionScheduleManufacturingByIdMutation();
  const [issue, issuing] = usePutApiV1ProductionScheduleManufacturingIssueByIdMutation();
  const permission = usePermissionAction(issueBmrPermissions.issue);
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState("");

  /** Saves the details, then issues. If the details save but the issue fails, a retry only repeats the issue. */
  const submit = async (values: IssueValues): Promise<string | null> => {
    const denied = permission.check();
    if (denied) return denied;
    if (!bmr || !values.made || !values.expires || !values.unit) return "Complete the batch details first.";
    if (bmr.issuedAt) return "This record has already been issued.";
    setMessage("");
    if (!saved) {
      const body = { batchNumber: values.batchNumber.trim(), manufacturingDate: monthStartIso(values.made), expiryDate: monthEndIso(values.expires),
        batchQuantity: toSmallestUnit(values.quantity, values.unit.value), productPackingId: bmr.packingId };
      const result = await update({ ...issueBmrAudit, id: bmr.id, domainEntitiesProductsProductionUpdateBatchManufacturingRecord: body });
      if ("error" in result) return apiErrorMessage(result.error);
      setSaved(true);
    }
    const again = permission.check();
    if (again) return again;
    const result = await issue({ ...issueBmrAudit, id: bmr.id });
    if ("error" in result) { const reason = `The details were saved, but the record was not issued: ${apiErrorMessage(result.error)}`; setMessage(reason); return reason; }
    toast.success(`BMR ${values.batchNumber.trim()} issued`);
    return null;
  };

  const materialsError = (result: typeof rawRows, error: typeof raw.error) => error ? apiErrorMessage(error) : result.success ? null : "The server returned materials the app could not read.";
  return {
    query, bmr, suggestion, submit, saving: updating.isLoading || issuing.isLoading, saved, message,
    raw: { rows: rawRows.success ? rawRows.data : [], loading: raw.isLoading || !scheduleProductId && query.isLoading, error: materialsError(rawRows, raw.error), retry: () => void raw.refetch() },
    packaging: { rows: packagingRows.success ? packagingRows.data : [], loading: packaging.isLoading, error: materialsError(packagingRows, packaging.error), retry: () => void packaging.refetch() },
  };
}
