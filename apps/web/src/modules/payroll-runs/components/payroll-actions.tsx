import { useState } from "react";
import { Send, Check, X, CircleCheck, CircleX } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogBody, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { DropdownButton, ConfirmActionDialog } from "@/shared/actions";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes as I } from "@/shared/forms/input-types";
import { usePayrollCommand } from "../hooks/use-payroll-command";
import { payrollActionProblem, type PayrollAction } from "../lib/integrity";
import { payrollPermissions as p, type PayrollRun } from "../schemas/contracts";
const labels = {
  submit: "Generate payslips and submit",
  approve: "Approve assigned stage",
  reject: "Reject payroll",
  process: "Mark processed / paid",
  cancel: "Cancel run",
} as const;
const notes = {
  submit:
    "Generate payslips for active employees and begin approval. The current server can skip employees whose calculations fail. Review the generated count and totals before approval.",
  approve: "Approve your currently assigned stage after complete employee, payslip and total reconciliation. This does not transfer money.",
  reject:
    "Return this payroll to draft with a reason. Its existing payslips remain; cancel and replace it before generating again to avoid duplicate payslips.",
  process:
    "Record that this approved payroll has been processed or paid. This changes its financial status and cannot be cancelled afterward. No bank transfer is sent by this action.",
  cancel: "Cancel this payroll run while retaining its payroll and approval history. Processed payroll cannot be cancelled.",
} as const;
function Confirm({ row, action, onClose, onChanged }: { row: PayrollRun; action: PayrollAction; onClose: () => void; onChanged: () => void }) {
  const command = usePayrollCommand(row, action, onChanged);
  const require =
    action === "submit"
      ? p.create
      : action === "cancel"
        ? p.cancel
        : action === "approve"
          ? { kind: "all" as const, permissions: [p.approve, p.payslip, "CanViewActiveEmployee"] }
          : p.approve;
  return (
    <ConfirmActionDialog
      title={labels[action]}
      description={notes[action]}
      destructive={action === "cancel"}
      confirmLabel={labels[action]}
      busyLabel="Sending…"
      require={require}
      onClose={onClose}
      onConfirm={() => command.run("")}
    />
  );
}
const schema = z.object({ reason: z.string().trim().min(1, "Explain why this payroll is being rejected.") });
function Reject({ row, onClose, onChanged }: { row: PayrollRun; onClose: () => void; onChanged: () => void }) {
  const command = usePayrollCommand(row, "reject", () => {
    onChanged();
    onClose();
  });
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { reason: "" } });
  const fields: WizardField<z.infer<typeof schema>>[] = [{ type: I.TEXTAREA, name: "reason", label: "Rejection reason", rows: 4, required: true }];
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !command.busy) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject payroll</DialogTitle>
          <DialogDescription>{notes.reject}</DialogDescription>
        </DialogHeader>
        <form
          noValidate
          className="flex min-h-0 flex-1 flex-col gap-4"
          onSubmit={form.handleSubmit(async (values) => {
            await command.run(values.reason);
          })}
        >
          <DialogBody>
            <fieldset disabled={command.busy || !command.allowed}>
              <FormWizard form={form} fields={fields} />
            </fieldset>
            {command.error ? (
              <p role="alert" className="text-sm text-destructive">
                {command.error}
              </p>
            ) : null}
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={command.busy} onClick={onClose}>
              Back
            </Button>
            <Button variant="destructive" disabled={command.busy || !command.allowed}>
              {command.busy ? "Rejecting…" : "Confirm rejection"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
export function PayrollActions({ row, onChanged }: { row: PayrollRun; onChanged: () => void }) {
  const [selected, setSelected] = useState<{ row: PayrollRun; action: PayrollAction } | null>(null);
  const icons = { submit: Send, approve: Check, reject: X, process: CircleCheck, cancel: CircleX };
  return (
    <>
      <DropdownButton
        label="Payroll actions"
        items={(["submit", "approve", "reject", "process", "cancel"] as const).map((action) => ({
          id: action,
          label: labels[action],
          icon: icons[action],
          require: action === "submit" ? p.create : action === "cancel" ? p.cancel : p.approve,
          disabled: Boolean(payrollActionProblem(row, action)),
          disabledReason: payrollActionProblem(row, action) ?? "This action requires its matching workflow state.",
          destructive: action === "cancel" || action === "reject",
          onSelect: () => setSelected({ row: structuredClone(row), action }),
        }))}
      />
      {selected ? (
        selected.action === "reject" ? (
          <Reject row={selected.row} onClose={() => setSelected(null)} onChanged={onChanged} />
        ) : (
          <Confirm row={selected.row} action={selected.action} onClose={() => setSelected(null)} onChanged={onChanged} />
        )
      ) : null}
    </>
  );
}
