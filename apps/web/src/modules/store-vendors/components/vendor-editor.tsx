import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes as I } from "@/shared/forms/input-types";
import { usePartnerCollections } from "@/shared/reference-data/use-partner-collections";
import { useAccess } from "@/shared/auth/use-access";
import { editorSchema, defaults, stores, storeValue, itemReadPermissions, type Vendor, type VendorValues } from "../schemas/vendor";
import { useVendorCommand } from "../hooks/use-vendor-command";
import { useVendorItems } from "../hooks/use-vendor-items";
export function VendorEditor({ original = null, onClose }: { original?: Vendor | null; onClose: () => void }) {
  const command = useVendorCommand(original, "save", onClose);
  const reference = usePartnerCollections();
  const { has } = useAccess();
  const form = useForm<VendorValues>({ resolver: zodResolver(editorSchema), defaultValues: defaults(original) });
  const selected = useWatch({ control: form.control, name: "store" });
  const load = useVendorItems(storeValue(selected?.value));
  const fields: WizardField<VendorValues>[] = [
    { type: I.TEXT, name: "name", label: "Vendor name", required: true },
    { type: I.TEXT, name: "contactPerson", label: "Contact person", required: true },
    { type: I.TEXT, name: "phone", label: "Telephone", required: true },
    { type: I.EMAIL, name: "email", label: "Email", required: true },
    { type: I.TEXTAREA, name: "address", label: "Address", required: true },
    { type: I.SELECT, name: "country", label: "Country", mode: "single", source: "sync", options: reference.countries, required: true },
    { type: I.SELECT, name: "currency", label: "Currency", mode: "single", source: "sync", options: reference.currencies, required: true },
    {
      type: I.SELECT,
      name: "store",
      label: "Search items in store",
      mode: "single",
      source: "sync",
      options: stores.flatMap((label, value) => (has(itemReadPermissions[value] ?? "") ? [{ value: String(value), label }] : [])),
    },
    {
      type: I.SELECT,
      name: "items",
      label: "Vendor items",
      mode: "multiple",
      source: "async",
      loadOptions: load,
      required: true,
      description: "Changing the search store preserves the items already selected. Vendors may supply items across stores.",
    },
  ];
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !command.busy) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{original ? "Edit store vendor" : "Create store vendor"}</DialogTitle>
          <DialogDescription>Maintain supplier contact details and the inventory items they supply.</DialogDescription>
        </DialogHeader>
        <form
          noValidate
          className="flex min-h-0 flex-1 flex-col gap-4"
          onSubmit={form.handleSubmit(async (v) => {
            await command.run(v);
          })}
        >
          <DialogBody>
            <fieldset disabled={command.busy || !command.allowed || reference.loading || !!reference.error}>
              <FormWizard form={form} fields={fields} />
            </fieldset>
            {reference.error ? (
              <p role="alert">
                {reference.error}{" "}
                <Button type="button" variant="link" onClick={reference.retry}>
                  Retry choices
                </Button>
              </p>
            ) : null}
            {command.error ? (
              <p role="alert" className="text-destructive">
                {command.error}
              </p>
            ) : null}
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={command.busy} onClick={onClose}>
              Cancel
            </Button>
            <Button disabled={command.busy || !command.allowed || reference.loading || !!reference.error}>{command.busy ? "Saving…" : "Save vendor"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
