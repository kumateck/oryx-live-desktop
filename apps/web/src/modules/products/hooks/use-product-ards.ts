import { useMemo, useState } from "react";
import { toast } from "sonner";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import {
  useGetApiV1ProductArdProductByProductIdQuery, useGetApiV1ProductSpecificationsProductByIdQuery, usePostApiV1ProductArdMutation,
  usePutApiV1ProductArdByIdMutation, useUploadArdAttachmentsMutation,
} from "../api/ard-api";
import { useGetApiV1ProductStpsByProductIdProductQuery } from "../api/stp-api";
import { ardStageChoices, newArdRequest, updatedArdRequest, type ArdSource } from "../lib/ard";
import { ardSpecificationSourceSchema, ardStpSourceSchema, savedArdListSchema, type ArdFormValues, type SavedArd } from "../schemas/ard-schema";

const audit = { module: "Quality Assurance", subModule: "Analytical Raw Data" } as const;
const notFound = (error: object | undefined) => Boolean(error && "status" in error && error.status === 404);

/** A product's analytical raw data: one record per test stage, each created from the product's STP and that stage's specification. */
export function useProductArds(productId: string) {
  const list = useGetApiV1ProductArdProductByProductIdQuery({ ...audit, productId });
  const stpQuery = useGetApiV1ProductStpsByProductIdProductQuery({ ...audit, productId });
  const specQuery = useGetApiV1ProductSpecificationsProductByIdQuery({ ...audit, id: productId });
  const [create] = usePostApiV1ProductArdMutation();
  const [update] = usePutApiV1ProductArdByIdMutation();
  const [upload] = useUploadArdAttachmentsMutation();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // A product with none of these yet answers 404; that is an empty list, not a failure.
  const listMissing = notFound(list.error);
  const parsed = useMemo(() => list.data ? savedArdListSchema.safeParse(list.data) : null, [list.data]);
  const ards = useMemo(() => !listMissing && parsed?.success ? parsed.data : [], [listMissing, parsed]);
  const stp = useMemo(() => { const result = notFound(stpQuery.error) ? null : ardStpSourceSchema.safeParse(stpQuery.data); return result?.success ? result.data : null; }, [stpQuery.error, stpQuery.data]);
  const specifications = useMemo(() => { const result = ardSpecificationSourceSchema.safeParse(notFound(specQuery.error) ? null : specQuery.data ?? null); return result.success ? result.data : []; },
    [specQuery.error, specQuery.data]);
  const choices = useMemo(() => ardStageChoices(ards, stp, specifications), [ards, stp, specifications]);

  /** Saves an ARD, then its new attachments. Returns true when everything asked for was saved. */
  const save = async (values: ArdFormValues, target: { saved: SavedArd } | { source: ArdSource }): Promise<boolean> => {
    setMessage(""); setSaving(true);
    try {
      let id: string | null;
      if ("saved" in target) {
        const body = updatedArdRequest(values, target.saved);
        if (!body) { setMessage("This record has no STP or template form and cannot be saved. Ask Quality Control to repair it."); return false; }
        const result = await update({ ...audit, id: target.saved.id, domainEntitiesProductAnalyticalRawDataCreateProductAnalyticalRawDataRequest: body });
        if ("error" in result) { setMessage(apiErrorMessage(result.error)); return false; }
        id = target.saved.id;
      } else {
        const result = await create({ ...audit, domainEntitiesProductAnalyticalRawDataCreateProductAnalyticalRawDataRequest: newArdRequest(values, target.source) });
        if ("error" in result) { setMessage(apiErrorMessage(result.error)); return false; }
        id = typeof result.data === "string" && result.data ? result.data : null;
      }
      const files = values.attachments ?? [];
      if (files.length > 0) {
        const uploaded = id ? await upload({ ardId: id, files }) : null;
        if (!uploaded || "error" in uploaded) {
          toast.warning(`The record was saved, but its files were not attached${uploaded && "error" in uploaded ? `: ${apiErrorMessage(uploaded.error)}` : "."} Edit the record to attach them again.`);
          return true;
        }
      }
      toast.success("Analytical raw data saved");
      return true;
    } finally {
      setSaving(false);
    }
  };

  const failure = (listMissing ? undefined : list.error) ?? (notFound(stpQuery.error) ? undefined : stpQuery.error) ?? (notFound(specQuery.error) ? undefined : specQuery.error);
  return {
    ards, choices,
    loading: list.isLoading || stpQuery.isLoading || specQuery.isLoading,
    error: failure ? apiErrorMessage(failure) : parsed && !parsed.success ? "The server returned analytical raw data the app could not read." : null,
    retry: () => { void list.refetch(); void stpQuery.refetch(); void specQuery.refetch(); },
    saving, message, clearMessage: () => setMessage(""), save,
  };
}
