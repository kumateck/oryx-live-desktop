import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import type { SelectOption } from "@/shared/forms/form-wizard-types";
import { InputTypes } from "@/shared/forms/input-types";
import { useCopyProcedure } from "../../hooks/use-copy-procedure";
import type { ProcedureStep } from "../../lib/procedure";

interface Values { targets: SelectOption[] }

/** Copies the saved procedure onto other products: choose them, review, then confirm. */
export function CopyProcedureDialog({ productId, steps, onClose }: { productId: string; steps: readonly ProcedureStep[]; onClose: () => void }) {
  const copier = useCopyProcedure(productId);
  const form = useForm<Values>({ defaultValues: { targets: [] } });
  const targets = useWatch({ control: form.control, name: "targets" });
  const [review, setReview] = useState(false);
  const loadProducts = copier.loadProducts;
  const fields = useMemo(() => [{ type: InputTypes.SELECT, name: "targets", label: "Copy to", mode: "multiple", source: "async", loadOptions: loadProducts, required: true,
    placeholder: "Select products", searchPlaceholder: "Search by name or code" }] as const satisfies readonly WizardField<Values>[], [loadProducts]);
  const dropsArd = steps.some((step) => step.parties.some((item) => item.ard));
  const failed = copier.outcomes?.filter((item) => item.error) ?? [];

  const confirm = async () => {
    const results = await copier.copy(steps, targets);
    const bad = results.filter((item) => item.error).length;
    if (bad === 0) { toast.success(`Procedure copied to ${results.length} ${results.length === 1 ? "product" : "products"}`); onClose(); }
  };

  return <Dialog open onOpenChange={(open) => { if (!open && !copier.copying) onClose(); }}>
    <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
      <DialogHeader><DialogTitle>Copy procedure to other products</DialogTitle>
        <DialogDescription>{review ? "Check the products and steps, then confirm." : "Choose the products that should get this procedure."}</DialogDescription></DialogHeader>
      {copier.outcomes ? <div className="space-y-2 text-sm">
        <p>{copier.outcomes.length - failed.length} of {copier.outcomes.length} products were updated.</p>
        <ul role="alert" className="space-y-1">{failed.map((item) => <li key={item.product} className="break-words text-destructive">{item.product}: {item.error}</li>)}</ul>
      </div> : review ? <div className="space-y-3 text-sm">
        <p className="rounded-md border border-destructive/40 bg-destructive/5 p-3">This replaces the whole existing procedure of each product below. It cannot be undone.</p>
        {dropsArd ? <p className="text-muted-foreground">Analytical raw data belongs to this product and is not copied. Set it on each product's ATR instruction afterwards.</p> : null}
        <div className="grid gap-3 md:grid-cols-2">
          <div><h3 className="mb-1 font-medium">Products ({targets.length})</h3>
            <ul className="max-h-60 space-y-1 overflow-y-auto">{targets.map((item) => <li key={item.value} className="break-words">{item.label}</li>)}</ul></div>
          <div><h3 className="mb-1 font-medium">Steps ({steps.length})</h3>
            <ol className="max-h-60 list-decimal space-y-1 overflow-y-auto pl-5">{steps.map((step) => <li key={step.key} className="break-words">{step.operation.label}
              <span className="text-muted-foreground"> · {step.isCritical ? "Critical" : "Automated"}</span></li>)}</ol></div>
        </div>
      </div> : <FormWizard form={form} fields={fields} />}
      <DialogFooter>
        {copier.outcomes ? <Button type="button" onClick={onClose}>Close</Button> : <>
          <Button type="button" variant="outline" disabled={copier.copying} onClick={() => review ? setReview(false) : onClose()}>{review ? "Back" : "Cancel"}</Button>
          {review ? <Button type="button" variant="destructive" disabled={copier.copying} onClick={() => void confirm()}>
            {copier.copying ? <><Spinner />Copying…</> : `Replace procedure on ${targets.length} ${targets.length === 1 ? "product" : "products"}`}</Button>
            : <Button type="button" disabled={targets.length === 0} onClick={() => setReview(true)}>Review</Button>}
        </>}
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}
