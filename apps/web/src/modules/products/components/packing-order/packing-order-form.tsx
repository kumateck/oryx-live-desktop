import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { UnsavedChangesGuard } from "@/shared/navigation/unsaved-changes";
import { packingOrderFormSchema, type PackingOrderFormValues } from "../../schemas/packing-order-schema";

const fields = [
  { type: InputTypes.RICHTEXT, name: "primaryPackDescription", label: "Primary pack", required: true, rows: 5, placeholder: "How the product is put in its immediate container",
    description: "The container in contact with the product, for example a bottle or blister." },
  { type: InputTypes.RICHTEXT, name: "secondaryPackDescription", label: "Secondary pack", required: true, rows: 5, placeholder: "How primary packs are put in their carton",
    description: "The pack that holds the primary pack, for example a carton with its leaflet." },
  { type: InputTypes.RICHTEXT, name: "tertiaryPackDescription", label: "Tertiary pack", required: true, rows: 5, placeholder: "How cartons are put in the shipper",
    description: "The outer pack used for storage and transport." },
] as const satisfies readonly WizardField<PackingOrderFormValues>[];

export function PackingOrderForm({ saved, saving, message, onSave }: {
  saved: PackingOrderFormValues;
  saving: boolean;
  message: string;
  onSave: (values: PackingOrderFormValues) => Promise<boolean>;
}) {
  const form = useForm<PackingOrderFormValues>({ resolver: zodResolver(packingOrderFormSchema), defaultValues: saved });
  const dirty = form.formState.isDirty;
  const submit = form.handleSubmit(async (values) => { if (await onSave(values)) form.reset(values); });

  return <form noValidate onSubmit={(event) => void submit(event)} className="min-w-0 space-y-4">
    <UnsavedChangesGuard when={dirty && !saving} />
    <FormWizard form={form} fields={fields} />
    {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
    <div className="flex flex-wrap justify-end gap-2">
      {dirty ? <Button type="button" variant="ghost" disabled={saving} onClick={() => form.reset(saved)}>Discard changes</Button> : null}
      <Button type="submit" disabled={saving}>{saving ? <><Spinner />Saving…</> : "Save packing order"}</Button>
    </div>
  </form>;
}
