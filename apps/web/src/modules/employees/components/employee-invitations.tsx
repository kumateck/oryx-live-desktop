import { useRef, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes as I } from "@/shared/forms/input-types";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { employeePermissions } from "../lib/access";
import { invitationsApi } from "../api/invitations-api";
const schema = z.object({ employees: z.array(z.object({ email: z.email().trim(), type: z.object({ value: z.enum(["0", "1"]), label: z.string() }).nullable().refine((v): boolean => v !== null, "Choose employment type") })).min(1).max(100) }).refine((v) => new Set(v.employees.map((row) => row.email.toLocaleLowerCase())).size === v.employees.length, { path: ["employees"], message: "Each invitation must have a different email address." });
type Values = z.infer<typeof schema>;
export function EmployeeInvitations({ onClose }: { onClose: () => void }) {
  const gate = usePermissionAction(employeePermissions.register); const guard = useRef(false); const [error, setError] = useState("");
  const [send, state] = invitationsApi.useInviteEmployeesMutation();
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { employees: [{ email: "", type: null }] } });
  const array = useFieldArray({ control: form.control, name: "employees" });
  const submit = form.handleSubmit(async (v) => {
    if (guard.current) return; const denied = gate.check(); if (denied) { setError(denied); return; }
    if (v.employees.some((row) => !row.type)) return;
    guard.current = true; setError("");
    try { const result = await send({ emailList: v.employees.map((row) => ({ email: row.email, employeeType: row.type?.value === "1" ? 1 : 0 })) }); if ("error" in result) { setError(`${apiErrorMessage(result.error)} Some invitations may already have been sent. Verify recipients before sending again.`); return; } toast.success("Employee invitations sent"); onClose(); }
    finally { guard.current = false; }
  });
  return <Dialog open onOpenChange={(open) => { if (!open && !state.isLoading) onClose(); }}><DialogContent className="sm:max-w-2xl"><DialogHeader><DialogTitle>Invite employees by email</DialogTitle><DialogDescription>The customer server sends an onboarding link to each listed address. Sending is an explicit action and is not repeated automatically after a failure.</DialogDescription></DialogHeader>
    <form noValidate className="flex min-h-0 flex-1 flex-col gap-4" onSubmit={submit}><DialogBody><fieldset disabled={state.isLoading || !gate.allowed} className="space-y-3">{array.fields.map((field, index) => {
      const fields: WizardField<Values>[] = [{ type: I.EMAIL, name: `employees.${index}.email`, label: "Email address", required: true }, { type: I.SELECT, name: `employees.${index}.type`, label: "Employment type", required: true, source: "sync", mode: "single", options: [{ value: "0", label: "Casual" }, { value: "1", label: "Permanent" }] }];
      return <div key={field.id} className="space-y-2 rounded-md border p-3"><FormWizard form={form} fields={fields} /><Button type="button" variant="ghost" className="text-destructive" onClick={() => array.remove(index)}>Remove invitation {index + 1}</Button></div>;
    })}<Button type="button" variant="outline" onClick={() => array.append({ email: "", type: null })}>Add invitation</Button></fieldset>
      {form.formState.errors.employees?.message ? <p role="alert">{form.formState.errors.employees.message}</p> : null}{error ? <p role="alert" className="text-destructive">{error}</p> : null}
    </DialogBody><DialogFooter><Button type="button" variant="outline" disabled={state.isLoading} onClick={onClose}>Cancel</Button><Button disabled={state.isLoading || !gate.allowed}>{state.isLoading ? "Sending…" : "Send invitations"}</Button></DialogFooter></form>
  </DialogContent></Dialog>;
}
