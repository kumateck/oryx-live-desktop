import { approvedProductPackingPermission, productPermissions } from "../lib/product-access";
import type { PermissionRequirement } from "@/shared/auth/access";
import { useAccess } from "@/shared/auth/use-access";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { useGetApiV1ProductByProductIdPackingQuery, usePostApiV1ProductByProductIdPackingApprovedProductMutation, usePostApiV1ProductByProductIdPackingMutation } from "../api/product-api";
import { addStyle, fromSaved, removeStyle, toPackingRequest, updateStyle, type PackingStyle } from "../lib/packing-styles";
import { packingStyleListSchema, type PackingStyleFormValues } from "../schemas/packing-style-schema";
import { randomId } from "@/shared/ids/random-id";

/**
 * Where packing styles are saved from. The product edit page saves as production planning; the finished goods
 * warehouse saves approved products through its own endpoint and permission. Both change the same styles.
 */
export type PackingSaveTarget = "product" | "approved-product";

const targets: Record<PackingSaveTarget, { audit: { module: string; subModule: string }; require: PermissionRequirement }> = {
  product: { audit: { module: "Production", subModule: "Packing Style" }, require: { kind: "all", permissions: [productPermissions.edit], departmentType: 0 } },
  "approved-product": { audit: { module: "Warehouse", subModule: "Approved Products" }, require: approvedProductPackingPermission },
};
const none: PackingStyle[] = [];

/**
 * A product's packing styles. The backend replaces the whole set in one request, so edits are kept
 * here as a draft until the user saves; `dirty` is true while the draft differs from what is saved.
 */
export function usePackingStyles(productId: string, target: PackingSaveTarget = "product") {
  const { audit, require } = targets[target];
  const query = useGetApiV1ProductByProductIdPackingQuery({ ...audit, productId });
  const [saveProduct, productMutation] = usePostApiV1ProductByProductIdPackingMutation();
  const [saveApproved, approvedMutation] = usePostApiV1ProductByProductIdPackingApprovedProductMutation();
  const parsed = useMemo(() => query.data ? packingStyleListSchema.safeParse(query.data) : null, [query.data]);
  const saved = useMemo(() => parsed?.success ? fromSaved(parsed.data) : none, [parsed]);
  const [draft, setDraft] = useState<PackingStyle[] | null>(null);
  const [message, setMessage] = useState("");
  const permission = usePermissionAction(require);
  const canEdit = useAccess().allows(require);
  const styles = draft ?? saved;

  const saveAll = async () => {
    const denied = permission.check();
    if (denied) { setMessage(denied); return; }
    setMessage("");
    const request = { ...audit, productId, body: toPackingRequest(styles) };
    const result = target === "approved-product" ? await saveApproved(request) : await saveProduct(request);
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    setDraft(null);
    toast.success("Packing styles saved");
  };

  return {
    styles,
    require,
    canEdit,
    dirty: draft !== null,
    loading: query.isLoading,
    error: query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned packing styles the app could not read." : null,
    retry: () => { void query.refetch(); },
    saving: target === "approved-product" ? approvedMutation.isLoading : productMutation.isLoading,
    saveError: message,
    add: (values: PackingStyleFormValues) => setDraft(addStyle(styles, values, `new-${randomId()}`)),
    update: (key: string, values: PackingStyleFormValues) => setDraft(updateStyle(styles, key, values)),
    remove: (key: string) => setDraft(removeStyle(styles, key)),
    discard: () => { setDraft(null); setMessage(""); },
    saveAll,
  };
}
