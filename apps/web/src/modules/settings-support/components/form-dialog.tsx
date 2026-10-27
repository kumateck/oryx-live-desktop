import type { FieldValues, UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";

/** The add and edit dialog of a simple settings record: a form, the server's refusal if any, and Save. */
export function SettingsFormDialog<T extends FieldValues>({ title, description, form, fields, saving, submitDisabled = false, message, submitLabel, onSubmit, onClose }: {
  title: string; description: string; form: UseFormReturn<T>; fields: WizardField<T>[]; saving: boolean; submitDisabled?: boolean; message: string; submitLabel: string; onSubmit: (values: T) => Promise<void>; onClose: () => void;
}) {
  const submit = form.handleSubmit(onSubmit);
  return <Dialog open onOpenChange={(open) => { if (!open && !saving) onClose(); }}>
    <DialogContent className="sm:max-w-2xl">
      <DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{description}</DialogDescription></DialogHeader>
      <form noValidate onSubmit={(event) => { event.stopPropagation(); void submit(event); }} className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
        <DialogBody className="space-y-4"><FormWizard form={form} fields={fields} className="md:grid-cols-2" />
          {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}</DialogBody>
        <DialogFooter><Button type="button" variant="outline" disabled={saving} onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving || submitDisabled}>{saving ? <><Spinner />Saving…</> : submitLabel}</Button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
