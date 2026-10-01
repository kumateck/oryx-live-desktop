import { useFieldArray, useWatch, type UseFormReturn } from "react-hook-form";
import { Plus, Shield, Trash2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownButton } from "@/shared/actions";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import type { SelectOption } from "@/shared/forms/form-wizard-types";
import { InputTypes } from "@/shared/forms/input-types";
import { actionOptions, atrAction } from "../../lib/procedure-actions";
import type { ProcedureStepFormValues } from "../../schemas/procedure-schema";

type Form = UseFormReturn<ProcedureStepFormValues>;

function PartyRow({ form, index, users, roles, ard, onRemove }: {
  form: Form; index: number; users: readonly SelectOption[]; roles: readonly SelectOption[]; ard: readonly SelectOption[]; onRemove: () => void;
}) {
  const [kind, action] = useWatch({ control: form.control, name: [`parties.${index}.kind`, `parties.${index}.action`] });
  const role = kind === "role";
  const fields: WizardField<ProcedureStepFormValues>[] = [
    { type: InputTypes.SELECT, name: `parties.${index}.who`, label: role ? "Role" : "User", mode: "single", source: "sync", options: role ? roles : users,
      required: true, placeholder: role ? "Select a role" : "Select a user" },
    { type: InputTypes.SELECT, name: `parties.${index}.action`, label: "Instruction", mode: "single", source: "sync", options: actionOptions, required: true,
      placeholder: "Select an instruction" },
    ...(action?.value === atrAction ? [{ type: InputTypes.SELECT, name: `parties.${index}.ard`, label: "Analytical raw data", mode: "single", source: "sync", options: ard,
      placeholder: ard.length ? "Select analytical raw data" : "This product has none yet" } satisfies WizardField<ProcedureStepFormValues>] : []),
  ];
  return <li className="rounded-md border p-3">
    <div className="mb-2 flex items-center justify-between gap-2">
      <span className="text-sm font-medium">{role ? "Role" : "User"} {index + 1}</span>
      <Button type="button" size="icon-sm" variant="ghost" aria-label={`Remove responsible ${role ? "role" : "user"} ${index + 1}`} onClick={onRemove}><Trash2 /></Button>
    </div>
    <FormWizard form={form} fields={fields} className="md:grid-cols-3" />
  </li>;
}

/** The users and roles responsible for a step, each with the instruction they carry out. */
export function PartyFields({ form, users, roles, ard }: { form: Form; users: readonly SelectOption[]; roles: readonly SelectOption[]; ard: readonly SelectOption[] }) {
  const parties = useFieldArray({ control: form.control, name: "parties" });
  const error = form.formState.errors.parties;
  const message = error?.root?.message ?? error?.message;
  const add = (kind: "user" | "role") => parties.append({ kind, who: null, action: null, ard: null });
  return <section className="space-y-3 rounded-lg border p-4" aria-label="Responsible users and roles">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div><h3 className="text-sm font-semibold">Responsible users and roles</h3>
        <p className="text-xs text-muted-foreground">Who carries out this step, and the instruction each one follows.</p></div>
      <DropdownButton label="Add responsible" icon={Plus} items={[
        { id: "user", label: "User", icon: User, onSelect: () => add("user") },
        { id: "role", label: "Role", icon: Shield, onSelect: () => add("role") },
      ]} />
    </div>
    {parties.fields.length === 0 ? <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">Nobody is assigned yet.</p>
      : <ul className="space-y-2">{parties.fields.map((field, index) => <PartyRow key={field.id} form={form} index={index} users={users} roles={roles} ard={ard}
        onRemove={() => parties.remove(index)} />)}</ul>}
    {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
  </section>;
}
