import { useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogBody, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes as I } from "@/shared/forms/input-types";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { payrollApi } from "../api/payroll-api";
import { payrollRoot, payrollPermissions as p } from "../schemas/contracts";
const schema = z.object({ from: z.date().nullable(), to: z.date().nullable() }).superRefine((v, context) => {
  if (!v.from) context.addIssue({ code: "custom", path: ["from"], message: "Choose the payroll start date." });
  if (!v.to || (v.from && v.to <= v.from)) context.addIssue({ code: "custom", path: ["to"], message: "Choose an end date after the start date." });
});
const date = (value: Date): string =>
  `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}T00:00:00Z`;
const fields: WizardField<z.infer<typeof schema>>[] = [
  { type: I.DATE, name: "from", label: "Period starts", required: true },
  { type: I.DATE, name: "to", label: "Period ends", required: true },
];
export function CreatePayrollDialog({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const gate = usePermissionAction(p.create);
  const running = useRef(false);
  const ambiguous = useRef(false);
  const [error, setError] = useState("");
  const [create, state] = payrollApi.useCreatePayrollRunMutation();
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { from: null, to: null } });
  const submit = form.handleSubmit(async (values) => {
    if (running.current || !values.from || !values.to) return;
    const denied = gate.check();
    if (denied) {
      setError(denied);
      return;
    }
    if (ambiguous.current) {
      setError("The previous create was not confirmed. Review the register before creating another run.");
      return;
    }
    running.current = true;
    setError("");
    try {
      const result = await create({ periodStart: date(values.from), periodEnd: date(values.to) });
      if ("error" in result) {
        if (!result.error || !("status" in result.error) || typeof result.error.status !== "number" || result.error.status >= 500) ambiguous.current = true;
        setError(apiErrorMessage(result.error));
        return;
      }
      onClose();
      void navigate(`${payrollRoot}/${encodeURIComponent(result.data)}`);
    } finally {
      running.current = false;
    }
  });
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !state.isLoading) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create payroll run</DialogTitle>
          <DialogDescription>
            This creates a draft. Payslips are generated only when you submit it for approval. The server rejects periods overlapping another active payroll
            run.
          </DialogDescription>
        </DialogHeader>
        <form noValidate onSubmit={submit} className="flex min-h-0 flex-1 flex-col gap-4">
          <DialogBody>
            <fieldset disabled={state.isLoading || !gate.allowed}>
              <FormWizard form={form} fields={fields} />
            </fieldset>
            {error ? (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            ) : null}
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={state.isLoading} onClick={onClose}>
              Cancel
            </Button>
            <Button disabled={state.isLoading || !gate.allowed}>{state.isLoading ? "Creating…" : "Create draft"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
