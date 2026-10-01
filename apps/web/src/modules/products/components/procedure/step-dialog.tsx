import { useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import type { ProcedureOptions } from "../../hooks/use-procedure-options";
import { hasOperation, type ProcedureStep } from "../../lib/procedure";
import { procedureStepFormSchema, type ProcedureStepFormValues } from "../../schemas/procedure-schema";
import { PartyFields } from "./party-fields";

export function StepDialog({ editing, steps, options, onSubmit, onClose }: {
  editing: ProcedureStep | null;
  steps: readonly ProcedureStep[];
  options: ProcedureOptions;
  onSubmit: (values: ProcedureStepFormValues) => void;
  onClose: () => void;
}) {
  const form = useForm<ProcedureStepFormValues>({ resolver: zodResolver(procedureStepFormSchema), defaultValues: editing
    ? { operation: editing.operation, workCenters: editing.workCenters, estimatedTime: editing.estimatedTime || null, isCritical: editing.isCritical, parties: editing.parties }
    : { workCenters: [], estimatedTime: null, isCritical: false, parties: [] } });

  // Operations already used by another step are not offered; the one being edited stays available.
  const operations = useMemo(() => options.operations.filter((item) => !hasOperation(steps, item.value, editing?.key ?? null)), [options.operations, steps, editing]);
  const fields = useMemo(() => [
    { type: InputTypes.SELECT, name: "operation", label: "Operation", mode: "single", source: "sync", options: operations, required: true,
      placeholder: operations.length ? "Select an operation" : "No operations left for this department" },
    { type: InputTypes.SELECT, name: "workCenters", label: "Work centers", mode: "multiple", source: "sync", options: options.workCenters, required: true,
      placeholder: "Select work centers" },
    { type: InputTypes.MOMENT, name: "estimatedTime", label: "Estimated time" },
    { type: InputTypes.SWITCH, name: "isCritical", label: "Critical step", description: "A critical step is completed by a person. Any other step is automated." },
  ] as const satisfies readonly WizardField<ProcedureStepFormValues>[], [operations, options.workCenters]);

  const submit = form.handleSubmit((values) => {
    if (hasOperation(steps, values.operation.value, editing?.key ?? null)) { form.setError("operation", { message: "This operation is already a step" }); return; }
    onSubmit(values);
  });

  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
    <DialogContent className="sm:max-w-4xl">
      <DialogHeader><DialogTitle>{editing ? "Edit step" : "Add step"}</DialogTitle>
        <DialogDescription>Changes are kept on this page until you save the procedure.</DialogDescription></DialogHeader>
      <form noValidate onSubmit={(event) => { event.stopPropagation(); void submit(event); }} className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
        <DialogBody className="space-y-4">
          {options.error ? <p role="alert" className="flex flex-wrap items-center gap-2 text-sm text-destructive">{options.error}
            <Button type="button" size="sm" variant="outline" onClick={options.retry}>Retry</Button></p> : null}
          <FormWizard form={form} fields={fields} className="md:grid-cols-2" />
          <PartyFields form={form} users={options.users} roles={options.roles} ard={options.ard} />
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit">{editing ? "Update step" : "Add step"}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
