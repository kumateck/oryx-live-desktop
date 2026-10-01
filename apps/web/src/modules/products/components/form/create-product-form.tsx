import { useEffect, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useGeneratedCode } from "@/shared/codes/use-generated-code";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { UnsavedChangesGuard } from "@/shared/navigation/unsaved-changes";
import { usePostApiV1ProductMutation } from "../../api/product-api";
import type { ProductOptions } from "../../hooks/use-product-options";
import { audit, productDetailPath, productsPath } from "../../lib/product-access";
import { toProductRequest } from "../../lib/product-form";
import { productFormSchema, type ProductFormValues } from "../../schemas/product-form-schema";
import { FormActions } from "./form-shell";
import { ProductFormFields } from "./product-form-fields";

export function CreateProductForm({ options }: { options: ProductOptions }) {
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [saved, setSaved] = useState(false);
  const [createProduct, mutation] = usePostApiV1ProductMutation();
  const form = useForm<ProductFormValues>({ resolver: zodResolver(productFormSchema), defaultValues: { name: "", code: "" } });
  const code = useGeneratedCode("Product");
  const suggested = useRef(false);

  const suggestCode = async (replace: boolean) => {
    const next = await code.suggest();
    if (next && (replace || !form.getValues("code"))) form.setValue("code", next, { shouldValidate: true, shouldDirty: replace });
  };
  // Offer a code once, when the rule has loaded, without overwriting what the user typed meanwhile.
  useEffect(() => {
    if (!code.ready || suggested.current) return;
    suggested.current = true;
    void suggestCode(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once, when the rule becomes available
  }, [code.ready]);

  const submit = form.handleSubmit(async (values) => {
    setMessage("");
    const result = await createProduct({ ...audit, domainEntitiesProductsCreateProductRequest: toProductRequest(values) });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    setSaved(true);
    toast.success(`${values.name} was created`);
    // Continue on the new product, where its bill of materials and other records are added.
    void navigate(result.data ? productDetailPath(result.data) : productsPath, { replace: true });
  });

  return <form noValidate onSubmit={(event) => void submit(event)} className="min-w-0 space-y-4">
    <UnsavedChangesGuard when={form.formState.isDirty && !saved} />
    <ProductFormFields form={form} options={options} codeNote={<p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
      {code.unavailable ? "No code rule is set up for products; enter the code yourself." : "The code is suggested from the next number in the series. You can change it."}
      {code.ready ? <Button type="button" size="xs" variant="ghost" disabled={code.busy} onClick={() => void suggestCode(true)}>Suggest again</Button> : null}
    </p>} />
    <FormActions saving={mutation.isLoading} saveLabel="Create product" savingLabel="Creating…" error={message} onCancel={() => void navigate(productsPath)} />
  </form>;
}
