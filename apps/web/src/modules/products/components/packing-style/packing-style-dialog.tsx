import { useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import type { SelectOption } from "@/shared/forms/form-wizard-types";
import { isDuplicateName, suggestedYield, type PackingStyle } from "../../lib/packing-styles";
import { packingStyleFormSchema, type PackingStyleFormValues } from "../../schemas/packing-style-schema";
import { PackingUnitsEditor } from "./packing-units-editor";

const blank: Partial<PackingStyleFormValues> = { name: "", description: "", isDefault: false, units: [{ uom: { value: "", label: "" }, quantity: Number.NaN }] };

export function PackingStyleDialog({ editing, styles, packingUnits, allUnits, fullBatchSize, baseUnit, onSubmit, onClose }: {
  /** The style being edited, or null to add one. */
  editing: PackingStyle | null;
  styles: readonly PackingStyle[];
  packingUnits: readonly SelectOption[];
  allUnits: readonly SelectOption[];
  fullBatchSize: number | null;
  baseUnit: string | null;
  onSubmit: (values: PackingStyleFormValues) => void;
  onClose: () => void;
}) {
  const form = useForm<PackingStyleFormValues>({ resolver: zodResolver(packingStyleFormSchema), defaultValues: editing ?? blank });
  const baseQuantity = useWatch({ control: form.control, name: "basePackingQuantity" });
  const suggestion = suggestedYield(fullBatchSize, typeof baseQuantity === "number" ? baseQuantity : null);

  const fields = useMemo(() => [
    { type: InputTypes.TEXT, name: "name", label: "Label", required: true, placeholder: "For example 10 x 10 blister" },
    { type: InputTypes.SELECT, name: "basePackingUom", label: "Base packing unit", mode: "single", source: "sync", options: packingUnits, required: true, placeholder: "Select packing unit" },
    { type: InputTypes.NUMBER, name: "basePackingQuantity", label: baseUnit ? `Base packing quantity (${baseUnit})` : "Base packing quantity", required: true, min: 0,
      description: "How much product one base pack holds." },
    { type: InputTypes.NUMBER, name: "expectedYield", label: "Expected yield", min: 0, description: "Base packs expected from one full batch." },
    { type: InputTypes.NUMBER, name: "packPerShipper", label: "Packs per shipper", required: true, min: 0 },
    { type: InputTypes.SWITCH, name: "isDefault", label: "Default packing style" },
    { type: InputTypes.TEXT, name: "description", label: "Description", placeholder: "Optional", className: "md:col-span-2" },
  ] as const satisfies readonly WizardField<PackingStyleFormValues>[], [packingUnits, baseUnit]);

  const submit = form.handleSubmit((values) => {
    if (isDuplicateName(styles, values.name, editing?.key ?? null)) {
      form.setError("name", { message: "Another packing style already uses this label" });
      return;
    }
    onSubmit(values);
  });

  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
    <DialogContent className="sm:max-w-2xl">
      <DialogHeader><DialogTitle>{editing ? "Edit packing style" : "Add packing style"}</DialogTitle>
        <DialogDescription>Changes are kept on this page until you save the packing styles.</DialogDescription></DialogHeader>
      <form noValidate onSubmit={(event) => { event.stopPropagation(); void submit(event); }} className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
        <DialogBody className="space-y-4">
          <FormWizard form={form} fields={fields} className="md:grid-cols-2" />
          {suggestion !== null && suggestion !== form.getValues("expectedYield") ? <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            A full batch fills about {new Intl.NumberFormat("en-US").format(suggestion)} base packs.
            <Button type="button" size="xs" variant="outline" onClick={() => form.setValue("expectedYield", suggestion, { shouldDirty: true, shouldValidate: true })}>Use as expected yield</Button>
          </p> : null}
          <PackingUnitsEditor control={form.control} errors={form.formState.errors} units={allUnits} />
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit">{editing ? "Update style" : "Add style"}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
