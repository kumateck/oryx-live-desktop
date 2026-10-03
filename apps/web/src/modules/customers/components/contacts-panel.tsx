import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmActionDialog } from "@/shared/actions";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { customerPermissions } from "../lib/customers";
import type { WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { useCreateCustomerContactMutation, useDeleteCustomerContactMutation, useGetCustomerContactsQuery, useUpdateCustomerContactMutation } from "../api/customer-api";
import { contactFormSchema, contactsSchema, type ContactFormValues, type CustomerContact } from "../schemas/customer-schema";
import { FormDialog } from "./form-dialog";

const fields: WizardField<ContactFormValues>[] = [
  { type: InputTypes.TEXT, name: "name", label: "Name", required: true },
  { type: InputTypes.TEXT, name: "role", label: "Role", placeholder: "For example, procurement lead" },
  { type: InputTypes.EMAIL, name: "email", label: "Email" },
  { type: InputTypes.TEXT, name: "phone", label: "Phone" },
  { type: InputTypes.SWITCH, name: "isPrimary", label: "Primary contact", className: "md:col-span-2" },
];
function ContactDialog({ customerId, contact, onClose }: { customerId: string; contact: CustomerContact | null; onClose: () => void }) {
  const [create, creating] = useCreateCustomerContactMutation();
  const [update, updating] = useUpdateCustomerContactMutation();
  const [message, setMessage] = useState("");
  const form = useForm<ContactFormValues>({ resolver: zodResolver(contactFormSchema), defaultValues: { name: contact?.name ?? "", role: contact?.role ?? "", email: contact?.email ?? "", phone: contact?.phone ?? "", isPrimary: contact?.isPrimary ?? false } });
  const permission = usePermissionAction(customerPermissions.contracts);
  const submit = form.handleSubmit(async (values) => {
    const denied = permission.check();
    if (denied) { setMessage(denied); return; }
    setMessage("");
    const body = { name: values.name, ...(values.role ? { role: values.role } : {}), ...(values.email ? { email: values.email } : {}), ...(values.phone ? { phone: values.phone } : {}), isPrimary: values.isPrimary };
    const result = contact ? await update({ customerId, id: contact.id, body }) : await create({ customerId, body });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    toast.success(contact ? "Contact updated" : "Contact added");
    onClose();
  });
  return <FormDialog allowed={permission.allowed} title={contact ? `Edit ${contact.name}` : "Add contact"} description="A customer has one primary contact; making this one primary replaces the current one." form={form} fields={fields} submitLabel={contact ? "Save contact" : "Add contact"}
    busy={creating.isLoading || updating.isLoading} message={message} onSubmit={(event) => void submit(event)} onClose={onClose} />;
}

type Open = { kind: "create" } | { kind: "edit" | "remove"; contact: CustomerContact } | null;
/** The people to reach at the customer, with the primary contact marked. */
export function ContactsPanel({ customerId }: { customerId: string }) {
  const query = useGetCustomerContactsQuery(customerId);
  const contacts = useMemo(() => { const parsed = contactsSchema.safeParse(query.data ?? []); return parsed.success ? parsed.data : []; }, [query.data]);
  const [remove] = useDeleteCustomerContactMutation();
  const [open, setOpen] = useState<Open>(null);
  return <section className="space-y-3 rounded-lg border bg-card p-4">
    <div className="flex flex-wrap items-center justify-between gap-2"><div><h2 className="text-sm font-semibold">Contacts</h2><p className="text-xs text-muted-foreground">Operational and commercial contacts, with one primary contact.</p></div>
      <Button type="button" size="sm" onClick={() => setOpen({ kind: "create" })}><Plus />Add contact</Button></div>
    {query.isLoading ? <div role="status" aria-label="Loading contacts" className="h-20 animate-pulse rounded-md bg-muted" />
      : query.error ? <p role="alert" className="text-sm text-destructive">{apiErrorMessage(query.error)}</p>
      : contacts.length === 0 ? <p className="text-sm text-muted-foreground">No contacts recorded.</p>
      : <ul className="divide-y">{contacts.map((contact) => <li key={contact.id} className="flex items-center justify-between gap-3 py-2 text-sm">
        <div className="min-w-0"><p className="flex flex-wrap items-center gap-2 font-medium"><span className="break-words">{contact.name}</span>{contact.isPrimary ? <Badge>Primary</Badge> : null}</p>
          <p className="break-words text-xs text-muted-foreground">{[contact.role, contact.email, contact.phone].filter(Boolean).join(" · ") || "No details"}</p></div>
        <div className="flex shrink-0 gap-1"><Button type="button" size="icon-sm" variant="ghost" aria-label={`Edit ${contact.name}`} onClick={() => setOpen({ kind: "edit", contact })}><Pencil /></Button>
          <Button type="button" size="icon-sm" variant="ghost" className="text-destructive" aria-label={`Remove ${contact.name}`} onClick={() => setOpen({ kind: "remove", contact })}><Trash2 /></Button></div></li>)}</ul>}
    {open?.kind === "create" ? <ContactDialog customerId={customerId} contact={null} onClose={() => setOpen(null)} /> : null}
    {open?.kind === "edit" ? <ContactDialog key={open.contact.id} customerId={customerId} contact={open.contact} onClose={() => setOpen(null)} /> : null}
    {open?.kind === "remove" ? <ConfirmActionDialog require={customerPermissions.contracts} title={`Remove ${open.contact.name}?`} description="The contact is archived and no longer shown for this customer." confirmLabel="Remove contact" busyLabel="Removing…" onClose={() => setOpen(null)}
      onConfirm={async () => { const result = await remove({ customerId, id: open.contact.id }); if ("error" in result) return apiErrorMessage(result.error); toast.success("Contact removed"); return null; }} /> : null}
  </section>;
}
