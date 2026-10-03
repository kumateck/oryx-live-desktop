import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { useGetApiV1ProductByProductIdQuery, usePutApiV1ProductPackageDescriptionByProductIdMutation } from "../api/product-api";
import { audit, productPermissions } from "../lib/product-access";
import { packingOrderSourceSchema, type PackingOrderFormValues } from "../schemas/packing-order-schema";

/** A product's packing instructions for its primary, secondary, and tertiary packs. */
export function usePackingOrder(productId: string) {
  const query = useGetApiV1ProductByProductIdQuery({ ...audit, productId });
  const [update, mutation] = usePutApiV1ProductPackageDescriptionByProductIdMutation();
  const parsed = useMemo(() => query.data ? packingOrderSourceSchema.safeParse(query.data) : null, [query.data]);
  const [message, setMessage] = useState("");
  const permission = usePermissionAction({ kind: "all", permissions: [productPermissions.edit], departmentType: 0 });

  const save = async (values: PackingOrderFormValues): Promise<boolean> => {
    const denied = permission.check();
    if (denied) { setMessage(denied); return false; }
    setMessage("");
    const result = await update({ ...audit, productId, domainEntitiesProductsUpdateProductPackageDescriptionRequest: values });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return false; }
    toast.success("Packing order saved");
    return true;
  };

  return {
    saved: parsed?.success ? parsed.data : null,
    loading: query.isLoading,
    error: query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned a product record the app could not read." : null,
    retry: () => { void query.refetch(); },
    saving: mutation.isLoading, message, save,
  };
}
