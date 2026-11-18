import type { UseFormReturn } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { TemplateRepairContext, TemplateRepairInput } from "../lib/template-repair-schema";

export function TemplateRepairSelection({ context, form, assignments, disabled }: {
  context: TemplateRepairContext; form: UseFormReturn<TemplateRepairInput>; assignments: TemplateRepairInput["assignments"]; disabled: boolean;
}) {
  const update = (next: TemplateRepairInput["assignments"]) => form.setValue("assignments", next, { shouldDirty: true, shouldValidate: true });
  return <div className="space-y-6">
    {context.tests.length === 0 ? <p>No open tests need additional field assignments.</p> : context.tests.map(test => {
      const selected = assignments.filter(a => a.formAssigneeId === test.formAssigneeId);
      const others = assignments.filter(a => a.formAssigneeId !== test.formAssigneeId);
      return <fieldset key={test.formAssigneeId} disabled={disabled || !test.eligible} className="min-w-0 space-y-3 border-b pb-5">
        <legend className="mb-2 flex max-w-full items-start gap-3 break-words font-medium">
          <Checkbox aria-label={`Select all missing fields for ${test.label}`} disabled={disabled || !test.eligible} checked={selected.length === test.missing.length && selected.length > 0 ? true : selected.length > 0 ? "indeterminate" : false}
            onCheckedChange={checked => update(checked ? [...others, ...test.missing.flatMap(missing => {
              const assigneeId = missing.suggestedAssigneeId ?? test.analysts[0]?.userId;
              return assigneeId ? [{ formAssigneeId: test.formAssigneeId, formFieldId: missing.formFieldId, assigneeId }] : [];
            })] : others)} />
          <span>{test.label}</span>
        </legend>
        <p className="text-sm text-muted-foreground">{test.answeredFields} saved answers kept · {test.missing.length} missing fields</p>
        {test.blocker ? <p className="text-sm" role="note">{test.blocker}</p> : null}
        <div className="space-y-3">{test.missing.map(missing => {
          const field = context.fields.find(f => f.formFieldId === missing.formFieldId);
          if (!field) return null;
          const chosen = selected.find(a => a.formFieldId === missing.formFieldId);
          const assigneeId = chosen?.assigneeId ?? missing.suggestedAssigneeId ?? test.analysts[0]?.userId;
          const without = assignments.filter(a => a.formAssigneeId !== test.formAssigneeId || a.formFieldId !== missing.formFieldId);
          return <div key={missing.formFieldId} className="grid min-w-0 items-center gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(12rem,18rem)]">
            <label className="flex min-w-0 items-center gap-3 text-sm"><Checkbox checked={Boolean(chosen)} disabled={disabled || !test.eligible || !assigneeId}
              onCheckedChange={checked => update(checked && assigneeId ? [...without, { formAssigneeId: test.formAssigneeId, formFieldId: missing.formFieldId, assigneeId }] : without)} />
              <span className="break-words">{field.section} · {field.label}{field.required ? " (required)" : ""}</span></label>
            <Select value={assigneeId ?? ""} disabled={disabled || !test.eligible || !chosen} onValueChange={value => update([...without, { formAssigneeId: test.formAssigneeId, formFieldId: missing.formFieldId, assigneeId: value }])}>
              <SelectTrigger aria-label={`Analyst for ${field.label} on ${test.label}`} className="w-full"><SelectValue placeholder="Choose an analyst" /></SelectTrigger>
              <SelectContent>{test.analysts.map(analyst => <SelectItem key={analyst.userId} value={analyst.userId}>{analyst.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>;
        })}</div>
      </fieldset>;
    })}
    {context.hiddenTests > 0 ? <p className="text-sm text-muted-foreground">{context.hiddenTests} tests are hidden because you do not have their reassignment permission.</p> : null}
    {form.formState.errors.assignments?.message ? <p role="alert" className="text-sm text-destructive">{form.formState.errors.assignments.message}</p> : null}
  </div>;
}
