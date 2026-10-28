import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes as I } from "@/shared/forms/input-types";
import { hrApi } from "../api/shift-api";
import { audit, employeeSchema, employeeName, type Schedule, type Assignment, type ShiftEmployee } from "../schemas/contracts";
import { useShiftCommand } from "../hooks/use-shift-command";
const schema = z
  .object({ replacement: z.object({ value: z.uuid(), label: z.string() }).nullable() })
  .refine((v) => !!v.replacement, { path: ["replacement"], message: "Choose a replacement employee." });
export function SwapDialog({
  schedule,
  rows,
  assignment,
  employee,
  onClose,
}: {
  schedule: Schedule;
  rows: Assignment[];
  assignment: Assignment;
  employee: ShiftEmployee;
  onClose: () => void;
}) {
  const command = useShiftCommand(schedule, "swap", rows, onClose);
  const available = hrApi.useGetApiV1EmployeeByShiftScheduleIdAvailableQuery({ ...audit, shiftScheduleId: schedule.id, date: assignment.scheduleDate });
  const parsed = z.array(employeeSchema).safeParse(available.currentData);
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { replacement: null } });
  const fields: WizardField<z.infer<typeof schema>>[] = [
    {
      type: I.SELECT,
      name: "replacement",
      label: "Replacement employee",
      mode: "single",
      source: "sync",
      options: parsed.success
        ? parsed.data
            .filter((e) => e.employeeId !== employee.employeeId)
            .map((e) => ({ value: e.employeeId, label: `${employeeName(e)} · ${e.staffNumber ?? "No staff number"}` }))
        : [],
      required: true,
    },
  ];
  const unavailable = available.isError || (!available.isLoading && !parsed.success);
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !command.busy) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Replace {employeeName(employee)}</DialogTitle>
          <DialogDescription>
            Replace this employee on {assignment.scheduleDate.slice(0, 10)} for {assignment.shiftType.shiftName}, {assignment.shiftCategory.name}. The server
            checks leave, conflicts and working-hours policy.
          </DialogDescription>
        </DialogHeader>
        <form
          noValidate
          className="flex min-h-0 flex-1 flex-col gap-4"
          onSubmit={form.handleSubmit(async (v) => {
            if (v.replacement)
              await command.run({
                shiftScheduleId: schedule.id,
                shiftCategoryId: assignment.shiftCategory.id,
                shiftTypeId: assignment.shiftType.shiftTypeId,
                scheduleDate: assignment.scheduleDate,
                employeeId: employee.employeeId,
                newEmployeeId: v.replacement.value,
              });
          })}
        >
          <DialogBody>
            <fieldset disabled={command.busy || !command.allowed || unavailable}>
              <FormWizard form={form} fields={fields} />
            </fieldset>
            {unavailable ? <p role="alert">Available replacements could not be verified. Close and retry.</p> : null}
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
            <Button disabled={command.busy || !command.allowed || unavailable}>{command.busy ? "Replacing and verifying…" : "Confirm replacement"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
