import { useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import type { SelectOption } from "@/shared/forms/form-wizard-types";
import { InputTypes } from "@/shared/forms/input-types";
import { formatQuantityNumber } from "@/shared/units/quantity";
import { materialKind, useMaterialOptions } from "../../hooks/use-material-options";
import { packagingAudit } from "../../hooks/use-packaging";
import type { MaterialFacts } from "../../lib/bom";
import { packagingConflict, type PackagingLine } from "../../lib/packaging";
import { packagingItemFormSchema, type PackagingItemFormValues } from "../../schemas/packaging-schema";

const noExclusions: readonly string[] = [];

export function PackagingItemDialog({ editing, lines, packingStyles, onSubmit, onClose }: {
  editing: PackagingLine | null;
  lines: readonly PackagingLine[];
  packingStyles: readonly SelectOption[];
  onSubmit: (values: PackagingItemFormValues, facts: MaterialFacts | null) => void;
  onClose: () => void;
}) {
  const materials = useMaterialOptions(materialKind.packaging, packagingAudit);
  const form = useForm<PackagingItemFormValues>({ resolver: zodResolver(packagingItemFormSchema), defaultValues: editing
    ? { material: editing.material, packing: editing.packing, prescribedQuantity: editing.prescribedQuantity, packingExcessMargin: editing.packingExcessMargin }
    : { packing: null, packingExcessMargin: 0 } });
  const [material, prescribed, allowance] = useWatch({ control: form.control, name: ["material", "prescribedQuantity", "packingExcessMargin"] });
  const facts = materials.facts(material?.value);
  // A stable loader: the picker reloads its options whenever the loader it is given changes.
  const makeLoader = materials.loader;
  const loadMaterials = useMemo(() => makeLoader(noExclusions), [makeLoader]);

  const fields = useMemo(() => [
    { type: InputTypes.SELECT, name: "material", label: "Component material", mode: "single", source: "async", loadOptions: loadMaterials, required: true,
      placeholder: "Select a packing material", searchPlaceholder: "Search by name or code", className: "md:col-span-2" },
    { type: InputTypes.SELECT, name: "packing", label: "Packing style", mode: "single", source: "sync", options: packingStyles,
      placeholder: packingStyles.length ? "All packing styles" : "No packing styles saved yet", className: "md:col-span-2",
      description: "Leave empty when the material is used the same way for every packing style." },
    { type: InputTypes.NUMBER, name: "prescribedQuantity", label: "Prescribed quantity", required: true, min: 0 },
    { type: InputTypes.NUMBER, name: "packingExcessMargin", label: "Packing allowance", min: 0, description: "Extra issued to cover losses during packing." },
  ] as const satisfies readonly WizardField<PackagingItemFormValues>[], [loadMaterials, packingStyles]);

  const submit = form.handleSubmit((values) => {
    const conflict = packagingConflict(lines, values.material.value, values.packing?.value ?? null, editing?.key ?? null);
    if (conflict) { form.setError("material", { message: conflict }); return; }
    onSubmit(values, facts);
  });
  const total = typeof prescribed === "number" ? prescribed + (typeof allowance === "number" ? allowance : 0) : null;
  const code = facts?.code ?? (editing && editing.material.value === material?.value ? editing.code : "");

  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
    <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
      <DialogHeader><DialogTitle>{editing ? "Edit packing material" : "Add packing material"}</DialogTitle>
        <DialogDescription>Changes are kept on this page until you save the packing materials.</DialogDescription></DialogHeader>
      <form noValidate onSubmit={(event) => { event.stopPropagation(); void submit(event); }} className="min-w-0 space-y-4">
        <FormWizard form={form} fields={fields} className="md:grid-cols-2" />
        {material?.value ? <dl className="grid grid-cols-[8rem_minmax(0,1fr)] gap-x-4 gap-y-1 rounded-md bg-muted/50 p-3 text-sm">
          <dt className="text-muted-foreground">Code</dt><dd>{code || "–"}</dd>
          {facts ? <><dt className="text-muted-foreground">Specification</dt><dd className="break-words">{facts.specification || "–"}</dd></> : null}
          <dt className="text-muted-foreground">Total quantity</dt><dd>{total !== null && Number.isFinite(total) ? formatQuantityNumber(total, "calculated") : "–"}</dd>
        </dl> : null}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit">{editing ? "Update material" : "Add material"}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
