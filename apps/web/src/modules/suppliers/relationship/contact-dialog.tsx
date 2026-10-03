import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { useState, type FormEvent } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { useCreateContactMutation, useUpdateContactMutation } from "./relationship-api";
import { contactSchema, type ContactValues } from "./schemas";
import type { Contact } from "./types";

const fields = [
  { type: InputTypes.TEXT, name: "name", label: "Contact name", required: true },
  { type: InputTypes.TEXT, name: "role", label: "Role" },
  { type: InputTypes.EMAIL, name: "email", label: "Email" },
  { type: InputTypes.TEXT, name: "phone", label: "Phone" },
  { type: InputTypes.SWITCH, name: "isPrimary", label: "Primary contact" },
] as const satisfies readonly WizardField<ContactValues>[];

export function ContactDialog({ supplierId, record, open, onOpenChange }: {
  supplierId: string; record?: Contact; open: boolean; onOpenChange: (open: boolean) => void;
}) {
  const [create, creating] = useCreateContactMutation();
  const [update, updating] = useUpdateContactMutation();
  const [error, setError] = useState("");
  const permission = usePermissionAction("CanManageSupplierContracts");
  const form = useForm<ContactValues>({ resolver: zodResolver(contactSchema), defaultValues: {
    name: record?.name ?? "", role: record?.role ?? "", email: record?.email ?? "", phone: record?.phone ?? "", isPrimary: record?.isPrimary ?? false,
  } });
  const save = async (event: FormEvent) => {
    event.preventDefault(); setError("");
    await form.handleSubmit(async (body) => {
      const denied = permission.check();
      if (denied) { setError(denied); return; }
      const result = record ? await update({ supplierId, id: record.id, body }) : await create({ supplierId, body });
      if ("error" in result) { setError(apiErrorMessage(result.error)); return; }
      toast.success(record ? "Contact updated" : "Contact added"); onOpenChange(false);
    })();
  };
  const busy = creating.isLoading || updating.isLoading;
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="sm:max-w-lg">
    <DialogHeader><DialogTitle>{record ? "Edit contact" : "Add contact"}</DialogTitle></DialogHeader>
    <form noValidate onSubmit={(event) => void save(event)} className="flex min-h-0 flex-1 flex-col gap-4">
      <DialogBody><FormWizard form={form} fields={fields} className="sm:grid-cols-2" />
        {error ? <p role="alert" className="mt-3 text-sm text-destructive">{error}</p> : null}</DialogBody>
      <DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>Cancel</Button>
        <Button type="submit" disabled={busy || !permission.allowed}>{busy ? <><Spinner />Saving…</> : "Save contact"}</Button></DialogFooter>
    </form>
  </DialogContent></Dialog>;
}
