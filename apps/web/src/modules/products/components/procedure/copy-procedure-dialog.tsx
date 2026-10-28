import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import type { SelectOption } from "@/shared/forms/form-wizard-types";
import { InputTypes } from "@/shared/forms/input-types";
import { useLazyGetApiV1ProductByProductIdRoutesQuery, useGetApiV1DepartmentQuery } from "../../api/product-api";
import { useCopyProcedure } from "../../hooks/use-copy-procedure";
import type { ProcedureStep } from "../../lib/procedure";
import { fromSavedRoutes } from "../../lib/procedure";
import { savedRoutesSchema } from "../../schemas/procedure-schema";

export type CopyProcedureAction = "to-products" | "from-product" | "to-other-department" | "from-other-department";
interface Values { department: SelectOption | null; products: SelectOption[]; product: SelectOption | null }
const descriptions: Record<CopyProcedureAction, { title: string; description: string; mode: "to" | "from" }> = {
  "to-products": { title: "Copy procedure to products", description: "Select products in this department to receive this product’s saved procedure.", mode: "to" },
  "from-product": { title: "Copy procedure from product", description: "Select a product in this department. Its procedure will replace this product’s procedure.", mode: "from" },
  "to-other-department": { title: "Copy procedure to another department", description: "Choose a different department, then select products to receive this saved procedure.", mode: "to" },
  "from-other-department": { title: "Copy procedure from another department", description: "Choose a different department and source product. Its procedure will replace this product’s procedure.", mode: "from" },
};

/** Selects a procedure source or target set, reviews the replacement, then applies it. */
export function CopyProcedureDialog({ productId, departmentId, action, steps, onClose }: {
  productId: string; departmentId: string | null; action: CopyProcedureAction; steps: readonly ProcedureStep[]; onClose: () => void;
}) {
  const copier = useCopyProcedure(productId);
  const form = useForm<Values>({ defaultValues: { department: null, products: [], product: null } });
  const department = useWatch({ control: form.control, name: "department" });
  const products = useWatch({ control: form.control, name: "products" });
  const product = useWatch({ control: form.control, name: "product" });
  const [review, setReview] = useState(false);
  const [sourceSteps, setSourceSteps] = useState<ProcedureStep[] | null>(null);
  const [sourceError, setSourceError] = useState<string | null>(null);
  const [loadRoutes, sourceQuery] = useLazyGetApiV1ProductByProductIdRoutesQuery();
  const departmentsQuery = useGetApiV1DepartmentQuery({ module: "Settings", subModule: "Departments", type: 0, page: 1, pageSize: 250 });
  const departmentOptions = useMemo(() => (departmentsQuery.data?.data ?? []).flatMap((item) => {
    const id = item.id;
    const label = item.name;
    return id && label && (action !== "from-other-department" && action !== "to-other-department" || id !== departmentId) ? [{ value: id, label }] : [];
  }), [departmentsQuery.data, action, departmentId]);
  const selectedDepartmentId = action === "to-products" || action === "from-product" ? departmentId : department?.value ?? null;
  const selectedDepartmentLabel = action === "to-products" || action === "from-product"
    ? departmentOptions.find((item) => item.value === departmentId)?.label ?? "this department"
    : department?.label ?? "selected department";
  const loadOptions = useMemo(() => copier.loadProducts(selectedDepartmentId), [copier.loadProducts, selectedDepartmentId]);
  const info = descriptions[action];
  const fields = useMemo(() => [
    ...(action === "to-other-department" || action === "from-other-department" ? [{ type: InputTypes.SELECT, name: "department", label: action === "to-other-department" ? "Destination department" : "Source department", mode: "single", source: "sync", options: departmentOptions, required: true, disabled: departmentsQuery.isLoading || Boolean(departmentsQuery.error), placeholder: "Select a department" } as const] : []),
    ...(info.mode === "to" ? [{ type: InputTypes.SELECT, name: "products", label: `Products in ${selectedDepartmentLabel}`, mode: "multiple", source: "async", loadOptions, required: true, disabled: !selectedDepartmentId, placeholder: "Select products", searchPlaceholder: "Search by name or code" } as const]
      : [{ type: InputTypes.SELECT, name: "product", label: `Procedure source in ${selectedDepartmentLabel}`, mode: "single", source: "async", loadOptions, required: true, disabled: !selectedDepartmentId, placeholder: "Select a product", searchPlaceholder: "Search by name or code" } as const]),
  ] as const satisfies readonly WizardField<Values>[], [action, departmentOptions, departmentsQuery.isLoading, departmentsQuery.error, info.mode, selectedDepartmentLabel, loadOptions, selectedDepartmentId]);
  useEffect(() => {
    form.setValue("products", []);
    form.setValue("product", null);
    setSourceSteps(null);
    setSourceError(null);
  }, [selectedDepartmentId, form]);
  useEffect(() => {
    setSourceSteps(null);
    setSourceError(null);
  }, [product?.value]);
  const activeSteps = info.mode === "to" ? steps : sourceSteps ?? [];
  const failed = copier.outcomes?.filter((item) => item.error) ?? [];
  const dropsArd = activeSteps.some((step) => step.parties.some((item) => item.ard));

  const loadSource = async () => {
    if (!product) return;
    setSourceError(null);
    try {
      const result = await loadRoutes({ module: "Production", subModule: "Procedure", productId: product.value }).unwrap();
      const parsed = savedRoutesSchema.safeParse(result);
      if (!parsed.success) { setSourceError("The selected product's procedure could not be read."); return; }
      const next = fromSavedRoutes(parsed.data);
      if (next.length === 0) { setSourceError("The selected product does not have a saved procedure."); return; }
      setSourceSteps(next);
    } catch {
      setSourceError("The selected product's procedure could not be loaded. Check access and try again.");
    }
  };

  const confirm = async () => {
    const results = info.mode === "to" ? await copier.copy(steps, products) : await copier.copyToCurrent(activeSteps);
    const bad = results.filter((item) => item.error).length;
    if (bad === 0) { toast.success(`Procedure copied ${info.mode === "to" ? `to ${results.length} ${results.length === 1 ? "product" : "products"}` : "to this product"}`); onClose(); }
  };

  return <Dialog open onOpenChange={(open) => { if (!open && !copier.copying) onClose(); }}>
    <DialogContent className="sm:max-w-2xl">
      <DialogHeader><DialogTitle>{info.title}</DialogTitle>
        <DialogDescription>{review ? "Review the procedure and product selection before confirming." : info.description}</DialogDescription></DialogHeader>
      <DialogBody className="space-y-4">
        {copier.outcomes ? <div className="space-y-2 text-sm">
          <p>{copier.outcomes.length - failed.length} of {copier.outcomes.length} products were updated.</p>
          <ul role="alert" className="space-y-1">{failed.map((item) => <li key={item.product} className="break-words text-destructive">{item.product}: {item.error}</li>)}</ul>
        </div> : review ? <div className="space-y-3 text-sm">
          <p className="rounded-md border border-destructive/40 bg-destructive/5 p-3">This replaces the whole existing procedure {info.mode === "to" ? "on each selected product" : "on this product"}. It cannot be undone.</p>
          {dropsArd ? <p className="text-muted-foreground">Analytical raw data belongs to each product and is not copied. Set it on each product's ATR instruction afterwards.</p> : null}
          <p className="rounded-md border bg-muted/30 px-3 py-2">{info.mode === "to" ? "Destination department" : "Source department"}: <span className="font-medium">{selectedDepartmentLabel}</span></p>
          <div className="grid gap-3 md:grid-cols-2">
            <div><h3 className="mb-1 font-medium">{info.mode === "to" ? `Target products (${products.length})` : `Source product: ${product?.label ?? ""}`}</h3>
              {info.mode === "to" ? <ul className="max-h-60 space-y-1 overflow-y-auto">{products.map((item) => <li key={item.value} className="break-words rounded-md border px-3 py-2 font-medium">{item.label}</li>)}</ul> : null}</div>
            <div><h3 className="mb-1 font-medium">Procedure steps ({activeSteps.length})</h3>
              <ol className="max-h-60 list-decimal space-y-1 overflow-y-auto pl-5">{activeSteps.map((step) => <li key={step.key} className="break-words">{step.operation.label}<span className="text-muted-foreground"> · {step.isCritical ? "Critical" : "Automated"}</span></li>)}</ol></div>
          </div>
        </div> : <>
          {departmentsQuery.isError ? <p role="alert" className="text-sm text-destructive">Departments could not be loaded. Close and reopen this dialog to retry.</p> : null}
          <FormWizard form={form} fields={fields} />
          {sourceError ? <p role="alert" className="text-sm text-destructive">{sourceError}</p> : null}
          {info.mode === "from" ? <Button type="button" variant="outline" disabled={!product || sourceQuery.isFetching} onClick={() => void loadSource()}>
            {sourceQuery.isFetching ? <><Spinner />Loading procedure…</> : sourceSteps ? "Reload source procedure" : "Load source procedure"}</Button> : null}
        </>}
      </DialogBody>
      <DialogFooter>
        {copier.outcomes ? <Button type="button" onClick={onClose}>Close</Button> : <>
          <Button type="button" variant="outline" disabled={copier.copying} onClick={() => review ? setReview(false) : onClose()}>{review ? "Back" : "Cancel"}</Button>
          {review ? <Button type="button" variant="destructive" disabled={copier.copying} onClick={() => void confirm()}>
            {copier.copying ? <><Spinner />Copying…</> : info.mode === "to" ? `Replace procedure on ${products.length} ${products.length === 1 ? "product" : "products"}` : "Replace this procedure"}</Button>
            : <Button type="button" disabled={info.mode === "to" ? products.length === 0 : !sourceSteps?.length} onClick={() => setReview(true)}>Review</Button>}
        </>}
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}
