import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes as I } from "@/shared/forms/input-types";
import { useAccess } from "@/shared/auth/use-access";
import { payrollConfigApi } from "@/shared/payroll/config-api";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { salarySchema, salaryDefaults, type SalaryValues } from "../schemas/editor-schema";
import type { Compensation } from "../schemas/contracts";
import { useSalarySave } from "../hooks/use-salary-save";
import { AllowanceFields } from "./allowances-fields";
export function SalaryEditor({ employeeId, current, onClose }: { employeeId: string; current: Compensation | null; onClose: () => void }) {
  const [original] = useState(current);
  const { has } = useAccess();
  const canGrades = has("CanViewPayrollConfiguration");
  const grades = payrollConfigApi.usePayrollGradesQuery(undefined, { skip: !canGrades });
  const form = useForm<SalaryValues>({ resolver: zodResolver(salarySchema), defaultValues: salaryDefaults(original) });
  const save = useSalarySave(employeeId, original, onClose);
  const fields: WizardField<SalaryValues>[] = [
    { type: I.NUMBER, name: "salary", label: "Basic salary (GHS)", min: 0, required: true },
    {
      type: I.SELECT,
      name: "grade",
      label: "Pay grade",
      mode: "single",
      source: "sync",
      options: (grades.currentData ?? []).map((row) => ({ value: row.id, label: row.name })),
      disabled: !canGrades || Boolean(grades.error) || grades.isFetching,
    },
    { type: I.DATE, name: "from", label: "New effective date", required: true },
    { type: I.TEXT, name: "bank", label: "Bank name" },
    { type: I.TEXT, name: "branch", label: "Bank branch" },
    { type: I.TEXT, name: "account", label: "Bank account number" },
    { type: I.TEXT, name: "tin", label: "TIN" },
    {
      type: I.SWITCH,
      name: "tier3",
      label: "Tier 3 voluntary pension enrollment",
      description: "Recorded as enrollment information. The current server calculation does not create a Tier 3 contribution from this flag.",
    },
  ];
  return (
    <section className="space-y-3 rounded-md border p-4">
      <h2 className="font-semibold">Create a new compensation record</h2>
      <p className="text-sm text-muted-foreground">
        This supersedes the current record from the new effective date. Earlier salary, allowances and bank details remain in history. It does not overwrite a
        processed payslip.
      </p>
      <form noValidate onSubmit={form.handleSubmit(save.run)} className="space-y-4">
        <fieldset disabled={save.busy || !save.allowed} className="space-y-4">
          <FormWizard form={form} fields={fields} className="sm:grid-cols-2" />
          <AllowanceFields form={form} />
        </fieldset>
        {grades.error ? (
          <p role="alert" className="text-sm text-destructive">
            {apiErrorMessage(grades.error)}{" "}
            <Button variant="outline" type="button" onClick={() => void grades.refetch()}>
              Retry grades
            </Button>
          </p>
        ) : null}
        {!canGrades ? (
          <p className="text-sm text-muted-foreground">
            Your access permits compensation management but not pay-grade configuration. The current grade is preserved.
          </p>
        ) : null}
        {save.error ? (
          <p role="alert" className="text-sm text-destructive">
            {save.error}
          </p>
        ) : null}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" disabled={save.busy} onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={save.busy || !save.allowed}>{save.busy ? "Saving…" : "Save new compensation"}</Button>
        </div>
      </form>
    </section>
  );
}
