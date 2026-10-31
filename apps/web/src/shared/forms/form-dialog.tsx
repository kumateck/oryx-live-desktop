import type { ReactNode } from "react";
import type { FieldValues, UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";

/** The frame small record forms share: a title, the fields, any supporting detail, the server's reason when it refuses, and the two buttons. */
export function FormDialog<TValues extends FieldValues>({ allowed, title, description, form, fields, submitLabel, busy, message, wide = false, columns = "md:grid-cols-2", footnote = null, onSubmit, onClose }: {
  allowed: boolean; title: string; description: string; form: UseFormReturn<TValues>; fields: readonly WizardField<TValues>[]; submitLabel: string; busy: boolean; message: string; wide?: boolean; columns?: string; footnote?: ReactNode;
  onSubmit: (event: React.FormEvent) => void; onClose: () => void }) {
  // Read here so the dialog re-renders, and its fields show their messages, when validation fails.
  void form.formState.errors;
  return <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
    <DialogContent className={wide ? "sm:max-w-3xl" : "sm:max-w-xl"}>
      <DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{description}</DialogDescription></DialogHeader>
      <form noValidate onSubmit={(event) => { event.stopPropagation(); onSubmit(event); }} className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
        <DialogBody className="space-y-3"><FormWizard form={form} fields={fields} className={columns} />{footnote}{message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}</DialogBody>
        <DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={onClose}>Cancel</Button><Button type="submit" disabled={busy || !allowed}>{busy ? <><Spinner />Saving…</> : submitLabel}</Button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
