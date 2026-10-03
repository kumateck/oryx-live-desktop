import { useEffect, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { settingsApi } from "@/shared/api/generated/settings";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import type { MaterialKind } from "@/shared/reference-data/kind-tabs";
import { toLargestUnit } from "@/shared/units/quantity";
import { useCreateGrnMutation, usePostApiV1WarehouseDistributedMaterialMaterialBatchMutation } from "../api/receiving-api";
import { audit, grnNumber, grnPrefix } from "../lib/receiving";
import { grnFormSchema, type DeliveredMaterial, type GrnFormValues } from "../schemas/receiving-schema";

const { useLazyGetApiV1ConfigurationByModelTypeCountQuery } = settingsApi;
const fields: WizardField<GrnFormValues>[] = [
  { type: InputTypes.TEXT, name: "number", label: "GRN number", required: true },
  { type: InputTypes.TEXT, name: "declaration", label: "Declaration number" },
  { type: InputTypes.TEXT, name: "carrier", label: "Carrier's name", required: true, placeholder: "Driver or haulier" },
  { type: InputTypes.TEXT, name: "vehicle", label: "Vehicle number", required: true },
  { type: InputTypes.TEXTAREA, name: "remarks", label: "Remarks", rows: 2, className: "md:col-span-2" },
];

/** Puts the checked materials on one goods received note, which moves their batches into quarantine. */
export function CreateGrnDialog({ kind, materials, onClose, onDone }: { kind: MaterialKind; materials: readonly DeliveredMaterial[]; onClose: () => void; onDone: () => void }) {
  const [loadBatches, batches] = usePostApiV1WarehouseDistributedMaterialMaterialBatchMutation();
  const [create, creating] = useCreateGrnMutation();
  const [countUsed] = useLazyGetApiV1ConfigurationByModelTypeCountQuery();
  const [message, setMessage] = useState("");
  const form = useForm<GrnFormValues>({ resolver: zodResolver(grnFormSchema), defaultValues: { number: "", declaration: "", carrier: "", vehicle: "", remarks: "" } });
  // Read here so the dialog re-renders, and its fields show their messages, when validation fails.
  void form.formState.errors;
  const beta = materials[0]?.beta === true;
  // A suggestion only: two people can be offered the same number, and the field can be corrected.
  const suggested = useRef(false);
  useEffect(() => {
    if (suggested.current) return;
    suggested.current = true;
    const prefix = grnPrefix(kind, beta, new Date().getFullYear());
    void countUsed({ ...audit, modelType: "GRNNumber", prefix }).unwrap().then((used) => { if (typeof used === "number" && !form.getValues("number")) form.setValue("number", grnNumber(prefix, used)); }).catch(() => undefined);
  }, [kind, beta, countUsed, form]);
  const busy = batches.isLoading || creating.isLoading;

  const submit = form.handleSubmit(async (values) => {
    setMessage("");
    // The note is written against the batches the checklists recorded, so those are read first.
    const found = await loadBatches({ ...audit, body: materials.map((material) => material.id) });
    if ("error" in found) { setMessage(`The batches of the chosen materials could not be read: ${apiErrorMessage(found.error)}`); return; }
    const ids = (found.data ?? []).flatMap((batch) => batch.id ? [batch.id] : []);
    if (ids.length === 0) { setMessage("The chosen materials have no batches recorded, so there is nothing to put on the note."); return; }
    const result = await create({ ...audit, body: { grnNumber: values.number, declarationNumber: values.declaration || null, carrierName: values.carrier, vehicleNumber: values.vehicle, remarks: values.remarks || null, materialBatchIds: ids } });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    toast.success(`GRN ${values.number} created`, { description: `${ids.length} ${ids.length === 1 ? "batch is" : "batches are"} now in quarantine.` });
    onDone();
  });

  return <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
    <DialogContent className="sm:max-w-3xl">
      <DialogHeader><DialogTitle>Create goods received note</DialogTitle>
        <DialogDescription>{materials.length === 1 ? "The batches of this material" : `The batches of these ${materials.length} materials`} go on one note and move into quarantine. This cannot be undone.</DialogDescription></DialogHeader>
      <form noValidate onSubmit={(event) => { event.stopPropagation(); void submit(event); }} className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
        <DialogBody className="space-y-3">
          <ul aria-label="Materials on the note" className="divide-y rounded-md border text-sm">{materials.map((material) => <li key={material.id} className="flex flex-wrap items-baseline justify-between gap-2 p-2.5">
            <span className="min-w-0 break-words"><span className="font-medium">{material.materialName}</span> <span className="text-muted-foreground">· invoice {material.invoiceCode ?? "not recorded"} · {material.batches} {material.batches === 1 ? "batch" : "batches"}</span></span>
            <span>{toLargestUnit(material.quantity, material.unit, "calculated")?.text ?? material.quantity}</span></li>)}</ul>
          <FormWizard form={form} fields={fields} className="md:grid-cols-2" />
          {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
        </DialogBody>
        <DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={busy}>{busy ? <><Spinner />Creating…</> : "Create GRN"}</Button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
