import { useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import type { SelectOption } from "@/shared/forms/form-wizard-types";
import { InputTypes } from "@/shared/forms/input-types";
import { toLargestUnit } from "@/shared/units/quantity";
import { Skeleton } from "@/shared/skeleton/skeleton";
import { materialKind, useMaterialOptions } from "../../hooks/use-material-options";
import { packagingAudit } from "../../hooks/use-packaging";
import { usePackagingUnit } from "../../hooks/use-packaging-unit";
import type { MaterialFacts } from "../../lib/bom";
import { packagingConflict, type PackagingLine, type PackagingUnit } from "../../lib/packaging";
import { packagingItemFormSchema, type PackagingItemFormValues } from "../../schemas/packaging-schema";
import { PackagingQuantityFields } from "./packaging-quantity-fields";

const noExclusions: readonly string[] = [];

export function PackagingItemDialog({ editing, lines, packingStyles, onSubmit, onClose }: {
  editing: PackagingLine | null;
  lines: readonly PackagingLine[];
  packingStyles: readonly SelectOption[];
  onSubmit: (values: PackagingItemFormValues, facts: MaterialFacts | null, unit: PackagingUnit) => void;
  onClose: () => void;
}) {
  const materials = useMaterialOptions(materialKind.packaging, packagingAudit);
  const form = useForm<PackagingItemFormValues>({ resolver: zodResolver(packagingItemFormSchema), defaultValues: editing
    ? { material: editing.material, packing: editing.packing, prescribedQuantity: editing.prescribedQuantity, packingExcessMargin: editing.packingExcessMargin }
    : { packing: null, packingExcessMargin: 0 } });
  const [material, prescribed, allowance] = useWatch({ control: form.control, name: ["material", "prescribedQuantity", "packingExcessMargin"] });
  const facts = materials.facts(material?.value);
  const linked = usePackagingUnit(material?.value, facts?.unit ?? (editing?.material.value === material?.value ? editing?.unit ?? null : null));
  // A stable loader: the picker reloads its options whenever the loader it is given changes.
  const makeLoader = materials.loader;
  const loadMaterials = useMemo(() => makeLoader(noExclusions), [makeLoader]);

  const fields = useMemo(() => [
    { type: InputTypes.SELECT, name: "material", label: "Component material", mode: "single", source: "async", loadOptions: loadMaterials, required: true,
      placeholder: "Select a packing material", searchPlaceholder: "Search by name or code", className: "md:col-span-2" },
    { type: InputTypes.SELECT, name: "packing", label: "Packing style", mode: "single", source: "sync", options: packingStyles,
      placeholder: packingStyles.length ? "All packing styles" : "No packing styles saved yet", className: "md:col-span-2",
      description: "Leave empty when the material is used the same way for every packing style." },
  ] as const satisfies readonly WizardField<PackagingItemFormValues>[], [loadMaterials, packingStyles]);

  const submit = form.handleSubmit((values) => {
    const conflict = packagingConflict(lines, values.material.value, values.packing?.value ?? null, editing?.key ?? null);
    if (conflict) { form.setError("material", { message: conflict }); return; }
    if (!linked.unit) { form.setError("material", { message: "The material's linked unit must be available before quantities can be entered." }); return; }
    onSubmit(values, facts, linked.unit);
  });
  const total = typeof prescribed === "number" ? prescribed + (typeof allowance === "number" ? allowance : 0) : null;
  const code = facts?.code ?? (editing && editing.material.value === material?.value ? editing.code : "");

  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
    <DialogContent className="sm:max-w-2xl">
      <DialogHeader><DialogTitle>{editing ? "Edit packing material" : "Add packing material"}</DialogTitle>
        <DialogDescription>Changes are kept on this page until you save the packing materials.</DialogDescription></DialogHeader>
      <form noValidate onSubmit={(event) => { event.stopPropagation(); void submit(event); }} className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
        <DialogBody className="space-y-4">
          <FormWizard form={form} fields={fields} className="md:grid-cols-2" />
          {linked.unit ? <PackagingQuantityFields key={`${material?.value}-${linked.unit.id}-${linked.unit.symbol}`} form={form} unit={linked.unit} />
            : linked.status === "loading" ? <div className="grid gap-4 md:grid-cols-2"><Skeleton className="h-14" /><Skeleton className="h-14" /></div>
            : material?.value ? <p role="alert" className="flex flex-wrap items-center gap-2 text-sm text-destructive">
              {linked.status === "error" ? "The material unit could not be loaded." : "No unit is set for this material. Set its unit on the material linkage first."}
              <Button type="button" size="sm" variant="outline" onClick={linked.retry}>Retry unit</Button>
            </p> : null}
          {material?.value ? <dl className="grid grid-cols-[8rem_minmax(0,1fr)] gap-x-4 gap-y-1 rounded-md bg-muted/50 p-3 text-sm">
            <dt className="text-muted-foreground">Code</dt><dd>{code || "–"}</dd>
            <dt className="text-muted-foreground">Material unit</dt><dd>{linked.unit?.symbol ?? "–"}</dd>
            {facts ? <><dt className="text-muted-foreground">Specification</dt><dd className="break-words">{facts.specification || "–"}</dd></> : null}
            <dt className="text-muted-foreground">Total quantity</dt><dd>{linked.unit ? toLargestUnit(total, linked.unit.symbol, "calculated")?.text ?? "–" : "–"}</dd>
          </dl> : null}
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={Boolean(material?.value) && linked.status !== "ready"}>{editing ? "Update material" : "Add material"}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
