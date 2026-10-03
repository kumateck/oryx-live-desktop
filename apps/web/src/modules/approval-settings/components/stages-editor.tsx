import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useFieldArray, useWatch, type UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import type { SelectOption } from "@/shared/forms/form-wizard-types";
import { InputTypes } from "@/shared/forms/input-types";
import type { WorkflowFormValues } from "../schemas/workflow-schema";

type Form = UseFormReturn<WorkflowFormValues>;
const kinds = [{ value: "role", label: "Anyone with a role" }, { value: "user", label: "A named person" }];

function StageLine({ form, index, count, roles, users, loading, roleOnly, onMove, onRemove }: { form: Form; index: number; count: number; roles: readonly SelectOption[]; users: readonly SelectOption[]; loading: boolean; roleOnly: boolean;
  onMove: (to: number) => void; onRemove: (() => void) | null }) {
  const kind = useWatch({ control: form.control, name: `stages.${index}.kind` });
  const byRole = roleOnly || kind !== "user";
  const fields: WizardField<WorkflowFormValues>[] = [
    ...(roleOnly ? [] : [{ type: InputTypes.RADIO, name: `stages.${index}.kind`, label: `Stage ${index + 1} is approved by`, options: kinds, required: true } satisfies WizardField<WorkflowFormValues>]),
    { type: InputTypes.SELECT, name: `stages.${index}.approver`, label: byRole ? `Role for stage ${index + 1}` : `Person for stage ${index + 1}`, mode: "single", source: "sync", options: byRole ? roles : users, required: true, placeholder: loading ? "Loading…" : byRole ? "Select a role" : "Select a person" },
  ];
  return <li className="flex items-start gap-2 rounded-md border p-3">
    <span aria-hidden="true" className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold">{index + 1}</span>
    <FormWizard form={form} fields={fields} className="min-w-0 flex-1 md:grid-cols-2" />
    <div className="flex shrink-0 gap-0.5">
      <Button type="button" size="icon-sm" variant="ghost" aria-label={`Move stage ${index + 1} up`} disabled={index === 0} onClick={() => onMove(index - 1)}><ArrowUp /></Button>
      <Button type="button" size="icon-sm" variant="ghost" aria-label={`Move stage ${index + 1} down`} disabled={index === count - 1} onClick={() => onMove(index + 1)}><ArrowDown /></Button>
      <Button type="button" size="icon-sm" variant="ghost" aria-label={`Remove stage ${index + 1}`} disabled={!onRemove} onClick={() => onRemove?.()}><Trash2 /></Button>
    </div>
  </li>;
}

/** The approvers a document passes through, top to bottom. Each must approve before the next is asked. */
export function StagesEditor({ form, roles, users, loading, roleOnly }: { form: Form; roles: readonly SelectOption[]; users: readonly SelectOption[]; loading: boolean; roleOnly: boolean }) {
  const stages = useFieldArray({ control: form.control, name: "stages" });
  const error = form.formState.errors.stages as { message?: string; root?: { message?: string } } | undefined;
  return <section className="space-y-2">
    <div className="flex items-center justify-between gap-2"><h2 className="text-sm font-semibold">Approval stages <span className="font-normal text-muted-foreground">({stages.fields.length})</span></h2>
      {roleOnly ? null : <Button type="button" size="sm" variant="outline" onClick={() => stages.append({ kind: "role", approver: null })}><Plus />Add stage</Button>}</div>
    <p className="text-sm text-muted-foreground">{roleOnly ? "This route goes to one quality role." : "A request goes to stage 1 first. Each stage has to approve before the next is asked."}</p>
    <ul className="space-y-2">{stages.fields.map((field, index) => <StageLine key={field.id} form={form} index={index} count={stages.fields.length} roles={roles} users={users} loading={loading} roleOnly={roleOnly}
      onMove={(to) => stages.move(index, to)} onRemove={stages.fields.length > 1 ? () => stages.remove(index) : null} />)}</ul>
    {error?.message ?? error?.root?.message ? <p role="alert" className="text-sm text-destructive">{error?.message ?? error?.root?.message}</p> : null}
  </section>;
}
