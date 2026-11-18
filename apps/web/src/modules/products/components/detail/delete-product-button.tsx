import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmActionDialog } from "@/shared/actions";
import type { PermissionRequirement } from "@/shared/auth/access";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { useDeleteApiV1ProductByProductIdMutation } from "../../api/product-api";
import { audit } from "../../lib/product-access";
import type { ProductDetail } from "../../schemas/product-detail-schema";

/** Deletes a product nothing uses yet. The server refuses one in use and names what uses it; the dialog shows that reason. */
export function DeleteProductButton({ product, require, context, listPath }: { product: Pick<ProductDetail, "id" | "name">; require: PermissionRequirement;
  context: { context?: string }; listPath: string }) {
  const [open, setOpen] = useState(false);
  const [remove] = useDeleteApiV1ProductByProductIdMutation();
  const navigate = useNavigate();
  const name = product.name ?? "this product";
  const confirm = async () => {
    const result = await remove({ ...audit, ...context, productId: product.id });
    if ("error" in result) return apiErrorMessage(result.error);
    toast.success(`${name} was deleted`);
    void navigate(listPath);
    return null;
  };
  return <>
    <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}><Trash2 />Delete product</Button>
    {open ? <ConfirmActionDialog require={require} title={`Delete ${name}?`} confirmLabel="Delete product" busyLabel="Deleting…" onConfirm={confirm} onClose={() => setOpen(false)}
      description="The product is removed from the product list. A product already used by a production schedule, production order, quotation or proforma invoice cannot be deleted." /> : null}
  </>;
}
