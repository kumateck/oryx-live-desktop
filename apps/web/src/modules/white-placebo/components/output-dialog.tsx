import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { FieldFrame } from "@/shared/forms/field-frame";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { useRecordWhitePlaceboOutputMutation } from "../api/white-placebo-api";
import { audit, permissions, quantity } from "../lib/white-placebo";
import { outputFormSchema, type OutputFormValues, type Preparation } from "../schemas/white-placebo";
import { apiErrorMessage } from "./load-state";
import { QuantityInput } from "./quantity-input";

const fields: WizardField<OutputFormValues>[] = [
  { name: "notes", label: "Weighing and yield variance notes", type: InputTypes.TEXTAREA, rows: 3, required: true,
    description: "Record the weighing reference, verification and explanation of any difference from expected output." },
];

export function OutputDialog({ preparation, close }: { preparation: Preparation; close: () => void }) {
  const form = useForm<OutputFormValues>({ resolver: zodResolver(outputFormSchema), defaultValues: { quantity: Number.NaN, preparedAt: "", notes: "" } });
  const [save, mutation] = useRecordWhitePlaceboOutputMutation();
  const [error, setError] = useState<string | null>(null);
  const permission = usePermissionAction(permissions.output);
  return <Dialog open onOpenChange={(open) => { if (!open && !mutation.isLoading) close(); }}><DialogContent>
    <DialogHeader><DialogTitle>Record weighed output · {preparation.batchNumber}</DialogTitle>
      <DialogDescription>Expected {quantity(preparation.expectedQuantity, preparation.unitSymbol)}. The actual net weight enters quarantine for the existing quality checks.</DialogDescription></DialogHeader>
    <form noValidate className="flex min-h-0 flex-1 flex-col gap-4" onSubmit={form.handleSubmit(async (values) => {
      const denied = permission.check();
      if (denied) { setError(denied); return; }
      setError(null);
      const result = await save({ ...audit, id: preparation.id, domainEntitiesMaterialsWhitePlaceboRecordWhitePlaceboOutput: {
        quantity: values.quantity, preparedAt: new Date(values.preparedAt).toISOString(), notes: values.notes,
      } });
      if ("error" in result) setError(apiErrorMessage(result.error)); else close();
    })}>
      <DialogBody className="space-y-4"><fieldset disabled={mutation.isLoading} className="min-w-0 space-y-4">
        <Controller control={form.control} name="quantity" render={({ field, fieldState }) => <FieldFrame id="actual-output" label="Actual net weight" required error={fieldState.error?.message}>
          <QuantityInput id="actual-output" label="Actual net weight" value={field.value} unit={preparation.unitSymbol} onChange={field.onChange} invalid={Boolean(fieldState.error)} />
        </FieldFrame>} />
        <FieldFrame id="prepared-at" label="Actual preparation date and time" required error={form.formState.errors.preparedAt?.message} description="Uses this device's local time. The permitted holding period starts here.">
          <Input id="prepared-at" type="datetime-local" {...form.register("preparedAt")} aria-invalid={Boolean(form.formState.errors.preparedAt)} />
        </FieldFrame>
        <FormWizard form={form} fields={fields} />
        <p className="text-sm text-muted-foreground">Store under: {preparation.storageConditions}. Holding period: {preparation.holdHours} hours. All issued ingredient quantities are consumed by this preparation.</p>
      </fieldset>{error ? <p role="alert" className="text-destructive">{error}</p> : null}</DialogBody>
      <DialogFooter><Button type="button" variant="outline" disabled={mutation.isLoading} onClick={close}>Cancel</Button>
        <Button type="submit" disabled={mutation.isLoading || !permission.allowed}>{mutation.isLoading ? "Recording…" : "Record output in quarantine"}</Button></DialogFooter>
    </form>
  </DialogContent></Dialog>;
}
