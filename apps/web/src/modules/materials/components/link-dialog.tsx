import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { settingsApi } from "@/shared/api/generated/settings";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import type { MaterialKind } from "@/shared/reference-data/kind-tabs";
import { usePostApiV1MaterialDepartmentMutation } from "../api/material-api";
import { audit, enteredLevel, levelUnit, materialPermissions, storedLevel } from "../lib/materials";
import { linkFormSchema, type LinkFormValues, type MaterialLink } from "../schemas/material-schema";

const { usePostApiV1CollectionMutation } = settingsApi;
export interface LinkTarget { id: string; name: string; code: string; kind: MaterialKind }

/**
 * Links a material to the user's department with its stock levels, or changes the levels of one already linked.
 * Levels are typed in the largest unit of the chosen unit's family.
 */
export function LinkDialog({ material, link, onClose }: { material: LinkTarget; link?: MaterialLink; onClose: () => void }) {
  const permission = usePermissionAction(link ? materialPermissions.editLinked[material.kind] : materialPermissions.link[material.kind]);
  const [loadUnits, units] = usePostApiV1CollectionMutation();
  useEffect(() => { void loadUnits({ ...audit, body: ["UnitOfMeasure"] }); }, [loadUnits]);
  const [save, saving] = usePostApiV1MaterialDepartmentMutation();
  const [message, setMessage] = useState("");
  const options = useMemo(() => (units.data?.UnitOfMeasure ?? []).flatMap((item) => item.id && (item.symbol || item.name) ? [{ value: item.id, label: item.symbol?.trim() || item.name?.trim() || "Unit" }] : []), [units.data]);
  const start = link ? { minimum: enteredLevel(link.minimum, link.unit), reorder: enteredLevel(link.reorder, link.unit), maximum: enteredLevel(link.maximum, link.unit) } : null;
  const form = useForm<LinkFormValues>({ resolver: zodResolver(linkFormSchema), defaultValues: { unit: link?.unitId && link.unit ? { value: link.unitId, label: link.unit } : null,
    minimum: start && start.minimum > 0 ? start.minimum : Number.NaN, reorder: start && start.reorder > 0 ? start.reorder : Number.NaN, maximum: start && start.maximum > 0 ? start.maximum : Number.NaN } });
  // Read here so the dialog re-renders, and its fields show their messages, when validation fails.
  void form.formState.errors;
  const unit = useWatch({ control: form.control, name: "unit" });
  const shown = unit ? levelUnit(unit.label) : "";
  const suffix = shown ? ` (${shown})` : "";
  const fields = useMemo((): WizardField<LinkFormValues>[] => [
    { type: InputTypes.SELECT, name: "unit", label: "Counted in", mode: "single", source: "sync", options, required: true, placeholder: units.isLoading || units.isUninitialized ? "Loading…" : "Select a unit", className: "md:col-span-3" },
    { type: InputTypes.NUMBER, name: "minimum", label: `Minimum level${suffix}`, min: 0, required: true },
    { type: InputTypes.NUMBER, name: "reorder", label: `Re-order level${suffix}`, min: 0, required: true },
    { type: InputTypes.NUMBER, name: "maximum", label: `Maximum level${suffix}`, min: 0, required: true },
  ], [options, units.isLoading, units.isUninitialized, suffix]);

  const submit = form.handleSubmit(async (values) => {
    const denied = permission.check();
    if (denied) { setMessage(denied); return; }
    setMessage("");
    if (!values.unit) return;
    const label = values.unit.label;
    // A level that was not touched is sent exactly as it was stored, so converting there and back cannot shift it.
    const keep = (entered: number, before: number | undefined, stored: number | undefined) => link && link.unitId === values.unit?.value && before !== undefined && stored !== undefined && entered === before ? stored : storedLevel(entered, label);
    const result = await save({ ...audit, body: [{ materialId: material.id, uoMId: values.unit.value, minimumStockLevel: keep(values.minimum, start?.minimum, link?.minimum), reOrderLevel: keep(values.reorder, start?.reorder, link?.reorder),
      maximumStockLevel: keep(values.maximum, start?.maximum, link?.maximum), density: link?.density ?? 0, densityUoMId: link?.densityUnitId ?? null }] });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    toast.success(link ? "Stock levels updated" : "Material linked", { description: material.name });
    onClose();
  });
  const busy = saving.isLoading;

  return <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
    <DialogContent className="sm:max-w-2xl">
      <DialogHeader><DialogTitle>{link ? "Stock levels" : "Link"} · {material.name}</DialogTitle>
        <DialogDescription>{link ? "The levels your department keeps this material between." : "Your department starts keeping this material. Set the levels its stock should stay between."}</DialogDescription></DialogHeader>
      <form noValidate onSubmit={(event) => { event.stopPropagation(); void submit(event); }} className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
        <DialogBody className="space-y-3">
          {units.error ? <p role="alert" className="text-sm text-destructive">{apiErrorMessage(units.error)}</p> : null}
          <FormWizard form={form} fields={fields} className="md:grid-cols-3" />
          <p className="text-xs text-muted-foreground">Stock at or below the re-order level should be bought again; it should not fall below the minimum or rise above the maximum.</p>
          {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
        </DialogBody>
        <DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={busy || !permission.allowed}>{busy ? <><Spinner />Saving…</> : link ? "Save levels" : "Link material"}</Button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
