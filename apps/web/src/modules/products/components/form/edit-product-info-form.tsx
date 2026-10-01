import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { UnsavedChangesGuard } from "@/shared/navigation/unsaved-changes";
import { usePutApiV1ProductByProductIdMutation } from "../../api/product-api";
import type { ProductOptions } from "../../hooks/use-product-options";
import { audit, productDetailPath } from "../../lib/product-access";
import { toFormValues, toProductRequest } from "../../lib/product-form";
import { productFormSchema, type ProductFormSource, type ProductFormValues } from "../../schemas/product-form-schema";
import { FormActions } from "./form-shell";
import { ProductFormFields } from "./product-form-fields";

export function EditProductInfoForm({ product, options }: { product: ProductFormSource; options: ProductOptions }) {
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [updateProduct, mutation] = usePutApiV1ProductByProductIdMutation();
  // Starting values are taken once per product (the page keys this form by product ID); a save resets the baseline below.
  const saved = useMemo(() => toFormValues(product), [product]);
  const form = useForm<ProductFormValues>({ resolver: zodResolver(productFormSchema), defaultValues: saved });

  const submit = form.handleSubmit(async (values) => {
    setMessage("");
    const result = await updateProduct({ ...audit, productId: product.id, domainEntitiesProductsUpdateProductRequest: toProductRequest(values) });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    form.reset(values);
    toast.success("Product information saved");
  });

  return <form noValidate onSubmit={(event) => void submit(event)} className="min-w-0 space-y-4">
    <UnsavedChangesGuard when={form.formState.isDirty} />
    <ProductFormFields form={form} options={options} />
    <FormActions saving={mutation.isLoading} saveLabel="Save changes" savingLabel="Saving…" error={message}
      onCancel={() => void navigate(productDetailPath(product.id))} />
  </form>;
}
