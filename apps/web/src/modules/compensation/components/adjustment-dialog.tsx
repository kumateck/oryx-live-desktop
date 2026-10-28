import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogBody, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes as I } from "@/shared/forms/input-types";
import { adjustmentSchema, type AdjustmentValues } from "../schemas/editor-schema";
import { adjustmentLabels, type AdjustmentKind } from "../schemas/contracts";
import { useAdjustmentCommand } from "../hooks/use-adjustment-command";
export function AdjustmentDialog({ employeeId, kind, onClose }: { employeeId: string; kind: AdjustmentKind; onClose: () => void }) {
  const command = useAdjustmentCommand(kind, employeeId, null, onClose);
  const form = useForm<AdjustmentValues>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: { type: null, amount: Number.NaN, description: "", recurring: false, taxable: true, from: null, to: null },
  });
  const fields: WizardField<AdjustmentValues>[] = [
    {
      type: I.SELECT,
      name: "type",
      label: "Type",
      mode: "single",
      source: "sync",
      options: adjustmentLabels[kind].map((label, value) => ({ value: String(value), label })),
      required: true,
    },
    { type: I.NUMBER, name: "amount", label: kind === "relief" ? "Annual relief (GHS)" : "Amount (GHS)", min: 0, required: true },
    ...(kind !== "relief"
      ? [
          { type: I.TEXT, name: "description", label: "Description" } satisfies WizardField<AdjustmentValues>,
          { type: I.SWITCH, name: "recurring", label: "Recurring" } satisfies WizardField<AdjustmentValues>,
        ]
      : []),
    ...(kind === "addition" ? [{ type: I.SWITCH, name: "taxable", label: "Taxable" } satisfies WizardField<AdjustmentValues>] : []),
    { type: I.DATE, name: "from", label: "Effective from", required: true },
    { type: I.DATE, name: "to", label: "Effective until" },
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
          <DialogTitle>Add {kind === "relief" ? "annual tax relief" : kind}</DialogTitle>
          <DialogDescription>
            This affects future payroll calculations for the selected employee. Non-recurring entries require an end date: the current server applies records to
            every payroll period that overlaps their effective dates.
          </DialogDescription>
        </DialogHeader>
        <form
          noValidate
          onSubmit={form.handleSubmit(async (values) => {
            await command.run(values);
          })}
          className="flex min-h-0 flex-1 flex-col gap-4"
        >
          <DialogBody>
            <fieldset disabled={command.busy || !command.allowed}>
              <FormWizard form={form} fields={fields} />
            </fieldset>
            {command.error ? (
              <p role="alert" className="mt-3 text-sm text-destructive">
                {command.error}
              </p>
            ) : null}
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={command.busy} onClick={onClose}>
              Cancel
            </Button>
            <Button disabled={command.busy || !command.allowed}>{command.busy ? "Saving…" : "Add adjustment"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
