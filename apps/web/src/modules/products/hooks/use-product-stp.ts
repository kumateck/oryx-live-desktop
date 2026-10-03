import { productPermissions } from "../lib/product-access";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import {
  useGetApiV1ProductStpsByProductIdProductQuery, useGetApiV1StpDocumentsByOwnerTypeAndOwnerIdQuery, useLazyGetApiV1ConfigurationByModelTypeCountQuery,
  usePostApiV1ProductStpsMutation, usePutApiV1ProductStpsByIdMutation, useUploadStpDocumentVersionMutation,
} from "../api/stp-api";
import { nextStpNumber, stpNumbering } from "../lib/stp";
import { savedStpSchema, stpDocumentSchema, type StpFormValues } from "../schemas/stp-schema";

const audit = { module: "Quality Assurance", subModule: "Standard Test Procedure" } as const;
const ownerType = "ProductStandardTestProcedure";

/** A product's standard test procedure and its controlled document. A product has at most one. */
export function useProductStp(productId: string) {
  const stpQuery = useGetApiV1ProductStpsByProductIdProductQuery({ ...audit, productId });
  // A product without an STP answers 404; that is "none yet", not a failure.
  const none = Boolean(stpQuery.error && "status" in stpQuery.error && stpQuery.error.status === 404);
  const parsedStp = useMemo(() => !none && stpQuery.data ? savedStpSchema.safeParse(stpQuery.data) : null, [none, stpQuery.data]);
  const stp = parsedStp?.success ? parsedStp.data : null;
  const documentQuery = useGetApiV1StpDocumentsByOwnerTypeAndOwnerIdQuery({ ...audit, ownerType, ownerId: stp?.id ?? "" }, { skip: !stp });
  const parsedDocument = useMemo(() => stp && documentQuery.isSuccess ? stpDocumentSchema.safeParse(documentQuery.data ?? null) : null, [stp, documentQuery.isSuccess, documentQuery.data]);
  const [create] = usePostApiV1ProductStpsMutation();
  const [update] = usePutApiV1ProductStpsByIdMutation();
  const [upload] = useUploadStpDocumentVersionMutation();
  const [loadCount] = useLazyGetApiV1ConfigurationByModelTypeCountQuery();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const permission = usePermissionAction({ kind: "all", permissions: [productPermissions.edit], departmentType: 0 });
  const refetchStp = stpQuery.refetch;

  const suggestNumber = useCallback(async () => {
    const count = await loadCount({ ...audit, ...stpNumbering }).unwrap().catch(() => null);
    return count === null ? null : nextStpNumber(count);
  }, [loadCount]);

  /** Saves the STP, then its document. Returns true when everything asked for was saved. */
  const save = async (values: StpFormValues): Promise<boolean> => {
    const denied = permission.check();
    if (denied) { setMessage(denied); return false; }
    setMessage(""); setSaving(true);
    try {
      const details = { stpNumber: values.stpNumber, description: values.description ?? "" };
      let id = stp?.id ?? null;
      const result = id
        ? await update({ ...audit, id, domainEntitiesProductStandardTestProceduresUpdateProductStandardTestProcedureRequest: details })
        : await create({ ...audit, domainEntitiesProductStandardTestProceduresCreateProductStandardTestProcedureRequest: { ...details, productIds: [productId] } });
      if ("error" in result) { setMessage(apiErrorMessage(result.error)); return false; }
      if (!id) {
        // The create response is not a dependable ID, so the new STP is read back from the product.
        const fresh = savedStpSchema.safeParse((await refetchStp()).data);
        id = fresh.success ? fresh.data.id : null;
      }
      if (values.document) {
        if (!id) { setMessage("The STP was saved, but the app could not find it to attach the document. Reload the page and attach the document again."); return false; }
        const revoked = permission.check();
        if (revoked) { setMessage(`The STP details were saved. ${revoked} The document was not uploaded.`); return false; }
        const uploaded = await upload({ ...audit, ownerType, ownerId: id, file: values.document, ...(values.reasonForChange ? { reasonForChange: values.reasonForChange } : {}) });
        if ("error" in uploaded) { setMessage(`The STP details were saved, but the document was not uploaded: ${apiErrorMessage(uploaded.error)}`); return false; }
      }
      toast.success("Standard test procedure saved");
      return true;
    } finally {
      setSaving(false);
    }
  };

  const failure = none ? undefined : stpQuery.error ?? documentQuery.error;
  return {
    stp,
    document: parsedDocument?.success ? parsedDocument.data : null,
    loading: stpQuery.isLoading || (Boolean(stp) && documentQuery.isLoading),
    error: failure ? apiErrorMessage(failure) : (parsedStp && !parsedStp.success) || (parsedDocument && !parsedDocument.success) ? "The server returned an STP the app could not read." : null,
    retry: () => { void stpQuery.refetch(); if (stp) void documentQuery.refetch(); },
    saving, message, save, suggestNumber,
  };
}
export type ProductStpState = ReturnType<typeof useProductStp>;
