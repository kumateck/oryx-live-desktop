import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes as I } from "@/shared/forms/input-types";
import { performanceApi } from "@/shared/performance/api";
import { CycleStatus, goalStatuses, type Goal } from "@/shared/performance/contracts";
import { usePerformanceEmployeeOptions } from "@/shared/performance/use-employee-options";
import { goalEditorSchema, goalStatus, type GoalValues } from "../schemas/editor";
import { updateBody } from "../lib/rules";
import { useGoalCommand } from "../hooks/use-goal-command";
/** `self` fixes the employee to the signed-in employee, who cannot write manager comments. */
export function GoalEditor({ original = null, self = null, onClose }: { original?: Goal | null; self?: { id: string; name: string } | null; onClose: () => void }) {
  const command = useGoalCommand(original, "save", onClose, Boolean(self));
  const cycles = performanceApi.usePerformanceCyclesQuery();
  const load = usePerformanceEmployeeOptions();
  const form = useForm<GoalValues>({
    resolver: zodResolver(goalEditorSchema),
    defaultValues: {
      employee: original ? { value: original.employeeId, label: original.employeeName ?? original.employeeId } : self ? { value: self.id, label: self.name } : null,
      cycle: original ? { value: original.cycleId, label: original.cycleName ?? original.cycleId } : null,
      title: original?.title ?? "",
      description: original?.description ?? "",
      weight: original?.weight ?? Number.NaN,
      targetDate: original ? new Date(original.targetDate.slice(0, 10) + "T00:00:00") : null,
      status: {
        value: original?.status === 1 ? "1" : original?.status === 2 ? "2" : original?.status === 3 ? "3" : "0",
        label: goalStatuses[original?.status ?? 0] ?? "Not started",
      },
      progressPercentage: original?.progressPercentage ?? 0,
      managerComments: original?.managerComments ?? "",
    },
  });
  const fields: WizardField<GoalValues>[] = [
    { type: I.SELECT, name: "employee", label: "Employee", mode: "single", source: "async", loadOptions: load, required: true, disabled: !!original || !!self },
    {
      type: I.SELECT,
      name: "cycle",
      label: "Cycle",
      mode: "single",
      source: "sync",
      options: (cycles.currentData ?? []).filter((r) => r.status !== CycleStatus.Closed).map((r) => ({ value: r.id, label: r.name })),
      required: true,
      disabled: !!original,
    },
    { type: I.TEXT, name: "title", label: "Goal title", required: true },
    { type: I.TEXTAREA, name: "description", label: "Description" },
    { type: I.NUMBER, name: "weight", label: "Weight (%)", min: 1, max: 100, step: 1, required: true },
    { type: I.DATE, name: "targetDate", label: "Target date", required: true },
    ...(original
      ? ([
          {
            type: I.SELECT,
            name: "status",
            label: "Status",
            mode: "single",
            source: "sync",
            options: goalStatuses.map((label, value) => ({ label, value: String(value) })),
          },
          { type: I.NUMBER, name: "progressPercentage", label: "Progress (%)", min: 0, max: 100, step: 1 },
          ...(self ? [] : [{ type: I.TEXTAREA, name: "managerComments", label: "Manager comments" }] satisfies WizardField<GoalValues>[]),
        ] satisfies WizardField<GoalValues>[])
      : []),
  ];
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !command.busy) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{original ? "Edit goal" : "Create goal"}</DialogTitle>
          <DialogDescription>Set a measurable target within the cycle. The employee's goal weights may total at most 100%.</DialogDescription>
        </DialogHeader>
        <form
          noValidate
          className="flex min-h-0 flex-1 flex-col gap-4"
          onSubmit={form.handleSubmit(async (v) => {
            if (!v.employee || !v.cycle || !v.targetDate) return;
            const d = v.targetDate;
            const targetDate =
              original && d.toDateString() === new Date(original.targetDate.slice(0, 10) + "T00:00:00").toDateString()
                ? original.targetDate
                : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T00:00:00Z`;
            const body = { employeeId: v.employee.value, cycleId: v.cycle.value, title: v.title, description: v.description, weight: v.weight, targetDate };
            await command.run(body, original ? updateBody(body, goalStatus(v.status?.value), v.progressPercentage, v.managerComments) : undefined);
          })}
        >
          <DialogBody>
            <fieldset disabled={command.busy || !command.allowed}>
              <FormWizard form={form} fields={fields} />
            </fieldset>
            {cycles.isError ? <p role="alert">Cycle choices could not be loaded. Close and retry before creating a goal.</p> : null}
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
            <Button disabled={command.busy || !command.allowed}>{command.busy ? "Saving…" : "Save goal"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
