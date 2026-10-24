import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import type { MaterialKind } from "@/shared/reference-data/kind-tabs";
import { toLargestUnit } from "@/shared/units/quantity";
import { useCreateGrnMutation, usePostApiV1WarehouseDistributedMaterialMaterialBatchMutation } from "../api/receiving-api";
import { useGrnNumber } from "../hooks/use-grn-number";
import { audit, grnPermissions } from "../lib/receiving";
import { grnFormSchema, type DeliveredMaterial, type GrnFormValues } from "../schemas/receiving-schema";

const fields: WizardField<GrnFormValues>[] = [
  { type: InputTypes.TEXT, name: "number", label: "GRN number", required: true, readOnly: true, placeholder: "Generated automatically" },
  { type: InputTypes.TEXT, name: "declaration", label: "Declaration number" },
  { type: InputTypes.TEXT, name: "carrier", label: "Carrier's name", required: true, placeholder: "Driver or haulier" },
  { type: InputTypes.TEXT, name: "vehicle", label: "Vehicle number", required: true },
  { type: InputTypes.TEXTAREA, name: "remarks", label: "Remarks", rows: 2, className: "md:col-span-2" },
];

/** Puts the checked materials on one goods received note, which moves their batches into quarantine. */
export function CreateGrnDialog({ kind, materials, onClose, onDone }: { kind: MaterialKind; materials: readonly DeliveredMaterial[]; onClose: () => void; onDone: () => void }) {
  const [loadBatches, batches] = usePostApiV1WarehouseDistributedMaterialMaterialBatchMutation();
  const [create, creating] = useCreateGrnMutation();
  const permission = usePermissionAction(grnPermissions[kind]);
  const [message, setMessage] = useState("");
  const form = useForm<GrnFormValues>({ resolver: zodResolver(grnFormSchema), defaultValues: { number: "", declaration: "", carrier: "", vehicle: "", remarks: "" } });
  // Read here so the dialog re-renders, and its fields show their messages, when validation fails.
  void form.formState.errors;
  const beta = materials[0]?.beta === true;
  const number = useGrnNumber(form, kind, beta);
  const saving = batches.isLoading || creating.isLoading || form.formState.isSubmitting;
  const busy = number.busy || saving;

  const submit = form.handleSubmit(async (values) => {
    setMessage("");
    const denied = permission.check();
    if (denied) { setMessage(denied); return; }
    // The note is written against the batches the checklists recorded, so those are read first.
    const found = await loadBatches({ ...audit, body: materials.map((material) => material.id) });
    if ("error" in found) { setMessage(`The batches of the chosen materials could not be read: ${apiErrorMessage(found.error)}`); return; }
    const ids = (found.data ?? []).flatMap((batch) => batch.id ? [batch.id] : []);
    if (ids.length === 0) { setMessage("The chosen materials have no batches recorded, so there is nothing to put on the note."); return; }
    // Refresh the prefix count at issue, as Next does; the displayed number is only a preview.
    const issuedNumber = await number.generate();
    if (!issuedNumber) return;
    const lostAccess = permission.check();
    if (lostAccess) { setMessage(lostAccess); return; }
    const result = await create({ ...audit, body: { grnNumber: issuedNumber, declarationNumber: values.declaration || null, carrierName: values.carrier, vehicleNumber: values.vehicle, remarks: values.remarks || null, materialBatchIds: ids } });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    toast.success(`GRN ${issuedNumber} created`, { description: `${ids.length} ${ids.length === 1 ? "batch is" : "batches are"} now in quarantine.` });
    onDone();
  });

  return <Dialog open onOpenChange={(open) => { if (!open && !saving) onClose(); }}>
    <DialogContent className="sm:max-w-3xl">
      <DialogHeader><DialogTitle>Create goods received note</DialogTitle>
        <DialogDescription>{materials.length === 1 ? "The batches of this material" : `The batches of these ${materials.length} materials`} go on one note and move into quarantine. This cannot be undone.</DialogDescription></DialogHeader>
      <form noValidate onSubmit={(event) => { event.stopPropagation(); void submit(event); }} className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
        <DialogBody className="space-y-3">
          <ul aria-label="Materials on the note" className="divide-y rounded-md border text-sm">{materials.map((material) => <li key={material.id} className="flex flex-wrap items-baseline justify-between gap-2 p-2.5">
            <span className="min-w-0 break-words"><span className="font-medium">{material.materialName}</span> <span className="text-muted-foreground">· invoice {material.invoiceCode ?? "not recorded"} · {material.batches} {material.batches === 1 ? "batch" : "batches"}</span></span>
            <span>{toLargestUnit(material.quantity, material.unit, "calculated")?.text ?? material.quantity}</span></li>)}</ul>
          <FormWizard form={form} fields={fields} className="md:grid-cols-2" />
          <div className="flex flex-wrap items-center gap-2">
            <p role={number.unavailable ? "alert" : "status"} className="text-xs text-muted-foreground">
              {number.busy ? "Generating the GRN number…" : number.unavailable
                ? "The GRN number could not be generated. Retry before creating the note."
                : "Generated automatically for the warehouse, material kind and year. Refreshed when you create the note."}
            </p>
            {number.unavailable ? <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => void number.generate()}>Retry number generation</Button> : null}
          </div>
          {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
        </DialogBody>
        <DialogFooter><Button type="button" variant="outline" disabled={saving} onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={busy || number.unavailable || !permission.allowed}>{busy ? <><Spinner />Creating…</> : "Create GRN"}</Button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
