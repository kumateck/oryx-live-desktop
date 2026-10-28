import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes as I } from "@/shared/forms/input-types";
import { performanceApi } from "@/shared/performance/api";
import { CycleStatus } from "@/shared/performance/contracts";
import { usePerformanceEmployeeOptions } from "@/shared/performance/use-employee-options";
import { useReviewCreate } from "../hooks/use-review-create";
const option = z.object({ value: z.uuid(), label: z.string() });
const schema = z.object({ employee: option.nullable(), cycle: option.nullable(), reviewer: option.nullable() }).superRefine((v, ctx) => {
  for (const name of ["employee", "cycle", "reviewer"] as const)
    if (!v[name]) ctx.addIssue({ code: "custom", path: [name], message: "This field is required." });
  if (v.employee && v.employee.value === v.reviewer?.value)
    ctx.addIssue({ code: "custom", path: ["reviewer"], message: "The employee cannot review their own performance." });
});
export function CreateReviewDialog({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const create = useReviewCreate((id) => {
    onClose();
    void navigate(`/hr/performance-reviews/${encodeURIComponent(id)}`);
  });
  const load = usePerformanceEmployeeOptions();
  const cycles = performanceApi.usePerformanceCyclesQuery();
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { employee: null, cycle: null, reviewer: null } });
  const fields: WizardField<z.infer<typeof schema>>[] = [
    { type: I.SELECT, name: "employee", label: "Employee", mode: "single", source: "async", loadOptions: load, required: true },
    {
      type: I.SELECT,
      name: "cycle",
      label: "Active cycle",
      mode: "single",
      source: "sync",
      options: (cycles.currentData ?? []).filter((r) => r.status === CycleStatus.Active).map((r) => ({ value: r.id, label: r.name })),
      required: true,
    },
    { type: I.SELECT, name: "reviewer", label: "Reviewer (employee)", mode: "single", source: "async", loadOptions: load, required: true },
  ];
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !create.busy) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start performance review</DialogTitle>
          <DialogDescription>
            The review starts at self-assessment. Choose an employee reviewer; the server permits one review per employee and cycle.
          </DialogDescription>
        </DialogHeader>
        <form
          noValidate
          className="flex min-h-0 flex-1 flex-col gap-4"
          onSubmit={form.handleSubmit(async (v) => {
            if (v.employee && v.cycle && v.reviewer) await create.run({ employeeId: v.employee.value, cycleId: v.cycle.value, reviewerId: v.reviewer.value });
          })}
        >
          <DialogBody>
            <fieldset disabled={create.busy || !create.allowed}>
              <FormWizard form={form} fields={fields} />
            </fieldset>
            {cycles.isError ? <p role="alert">Cycle choices could not be loaded. Close and retry.</p> : null}
            {create.error ? (
              <p role="alert" className="text-destructive">
                {create.error}
              </p>
            ) : null}
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={create.busy} onClick={onClose}>
              Cancel
            </Button>
            <Button disabled={create.busy || !create.allowed}>{create.busy ? "Starting…" : "Start review"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
