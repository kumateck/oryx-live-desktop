import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes as I } from "@/shared/forms/input-types";
import { hrApi } from "../api/shift-api";
import { audit, employeeSchema, employeeName, type Schedule } from "../schemas/contracts";
import { useShiftCommand } from "../hooks/use-shift-command";
import { useShiftCategories } from "../hooks/use-shift-categories";
const option = z.object({ value: z.uuid(), label: z.string() });
const schema = z
  .object({ category: option.nullable(), type: option.nullable(), employees: z.array(option).min(1, "Choose at least one employee.") })
  .superRefine((v, ctx) => {
    for (const name of ["category", "type"] as const) if (!v[name]) ctx.addIssue({ code: "custom", path: [name], message: "This field is required." });
  });
export function AssignDialog({ schedule, onClose }: { schedule: Schedule; onClose: () => void }) {
  const command = useShiftCommand(schedule, "assign", null, onClose);
  const categories = useShiftCategories();
  const available = hrApi.useGetApiV1EmployeeByShiftScheduleIdAvailableQuery({ ...audit, shiftScheduleId: schedule.id, date: schedule.startDate });
  const parsed = z.array(employeeSchema).safeParse(available.currentData);
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { category: null, type: null, employees: [] } });
  const fields: WizardField<z.infer<typeof schema>>[] = [
    { type: I.SELECT, name: "category", label: "Shift category", mode: "single", source: "sync", options: categories.options, required: true },
    {
      type: I.SELECT,
      name: "type",
      label: "Shift type",
      mode: "single",
      source: "sync",
      options: schedule.shiftType.map((t) => ({ value: t.id, label: `${t.shiftName} · ${t.startTime}–${t.endTime}` })),
      required: true,
    },
    {
      type: I.SELECT,
      name: "employees",
      label: "Employees",
      mode: "multiple",
      source: "sync",
      options: parsed.success ? parsed.data.map((e) => ({ value: e.employeeId, label: `${employeeName(e)} · ${e.staffNumber ?? "No staff number"}` })) : [],
      required: true,
    },
  ];
  const unavailable = categories.error || available.isError || (!available.isLoading && !parsed.success);
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !command.busy) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign employees · {schedule.scheduleName}</DialogTitle>
          <DialogDescription>
            This assigns each selected employee on every calendar day in the schedule period. The server can skip unavailable employees; Live verifies the
            resulting calendar before reporting completion.
          </DialogDescription>
        </DialogHeader>
        <form
          noValidate
          className="flex min-h-0 flex-1 flex-col gap-4"
          onSubmit={form.handleSubmit(async (v) => {
            if (v.category && v.type)
              await command.run({
                shiftScheduleId: schedule.id,
                shiftCategoryId: v.category.value,
                shiftTypeId: v.type.value,
                employeeIds: v.employees.map((e) => e.value),
              });
          })}
        >
          <DialogBody>
            <fieldset disabled={command.busy || !command.allowed || !!unavailable}>
              <FormWizard form={form} fields={fields} />
            </fieldset>
            {unavailable ? <p role="alert">Employee or category choices could not be verified. Close and retry.</p> : null}
            {command.error ? (
              <p role="alert" className="text-destructive">
                {command.error}
              </p>
            ) : null}
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={command.busy} onClick={onClose}>
              Cancel
            </Button>
            <Button disabled={command.busy || !command.allowed || !!unavailable}>{command.busy ? "Assigning and verifying…" : "Confirm assignment"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
