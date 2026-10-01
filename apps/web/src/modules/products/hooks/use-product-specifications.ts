import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { useSession } from "@/shared/auth/session-provider";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import type { SelectLoader } from "@/shared/forms/form-wizard-types";
import {
  useGetApiV1ProductSpecificationsProductByIdQuery, useLazyGetApiV1ConfigurationByModelTypeCountQuery, useLazyGetApiV1FormQuery,
  usePostApiV1ProductSpecificationsMutation, usePutApiV1ProductSpecificationsByIdMutation,
} from "../api/specification-api";
import { ardStages, type ArdStage } from "../lib/ard";
import { newSpecificationRequest, nextSpecificationNumber, specificationNumbering, specificationPrefix, updatedSpecificationRequest } from "../lib/specification";
import { savedSpecificationListSchema, type SavedSpecification, type SpecificationFormValues } from "../schemas/specification-schema";

const audit = { module: "Production", subModule: "Product Specification" } as const;
const ardTemplate = 0;
export type SpecificationTarget = { saved: SavedSpecification } | { stage: ArdStage };

/** A product's specifications: one per test stage, each with the template form its tests are recorded on. */
export function useProductSpecifications(productId: string, division: number | null) {
  const { state } = useSession();
  const userId = state.status === "authenticated" ? state.session.user.id : null;
  const list = useGetApiV1ProductSpecificationsProductByIdQuery({ ...audit, id: productId });
  const [create] = usePostApiV1ProductSpecificationsMutation();
  const [update] = usePutApiV1ProductSpecificationsByIdMutation();
  const [loadForms] = useLazyGetApiV1FormQuery();
  const [loadCount] = useLazyGetApiV1ConfigurationByModelTypeCountQuery();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // A product with no specifications answers 404; that is an empty list, not a failure.
  const missing = Boolean(list.error && "status" in list.error && list.error.status === 404);
  const parsed = useMemo(() => list.data ? savedSpecificationListSchema.safeParse(list.data) : null, [list.data]);
  const specifications = useMemo(() => !missing && parsed?.success ? parsed.data : [], [missing, parsed]);
  const openStages = useMemo(() => ardStages.filter((stage) => !specifications.some((item) => item.testStage === stage.value)), [specifications]);

  const loadTemplates = useCallback<SelectLoader>(async (search, page, signal) => {
    const request = loadForms({ ...audit, searchQuery: search, page, pageSize: 20, type: ardTemplate });
    signal.addEventListener("abort", () => request.abort(), { once: true });
    const result = await request.unwrap();
    const current = result.pageIndex ?? page;
    return {
      options: (result.data ?? []).flatMap((form) => form.id ? [{ value: form.id, label: form.name?.trim() || "Unnamed template" }] : []),
      hasNext: current < (result.pageCount ?? current), hasPrevious: current > 1,
    };
  }, [loadForms]);

  /** The next number in the stage's series, or null when it cannot be worked out and must be typed. */
  const suggestNumber = useCallback(async (stage: ArdStage) => {
    const prefix = specificationPrefix(division, stage);
    if (!prefix) return null;
    const count = await loadCount({ ...audit, modelType: specificationNumbering, prefix }).unwrap().catch(() => null);
    return count === null ? null : nextSpecificationNumber(prefix, count);
  }, [division, loadCount]);

  const save = async (values: SpecificationFormValues, target: SpecificationTarget): Promise<boolean> => {
    setMessage("");
    if (!("saved" in target) && !userId) { setMessage("Your session could not be identified. Sign in again and retry."); return false; }
    setSaving(true);
    try {
      const result = "saved" in target
        ? await update({ ...audit, id: target.saved.id, domainEntitiesProductSpecificationsUpdateProductSpecificationRequest: updatedSpecificationRequest(values, target.saved) })
        : await create({ ...audit, domainEntitiesProductSpecificationsCreateProductSpecificationRequest: newSpecificationRequest(values, { productId, stage: target.stage, userId: userId ?? "" }) });
      if ("error" in result) { setMessage(apiErrorMessage(result.error)); return false; }
      toast.success("saved" in target ? "Specification saved" : "Specification created");
      return true;
    } finally {
      setSaving(false);
    }
  };

  return {
    specifications, openStages,
    loading: list.isLoading,
    error: !missing && list.error ? apiErrorMessage(list.error) : parsed && !parsed.success ? "The server returned specifications the app could not read." : null,
    retry: () => { void list.refetch(); },
    saving, message, clearMessage: () => setMessage(""), save, loadTemplates, suggestNumber,
  };
}
export type ProductSpecificationsState = ReturnType<typeof useProductSpecifications>;
