import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes as I } from "@/shared/forms/input-types";
import { pensionEditorSchema, pensionCommand, type PensionValues } from "../schemas/editor-schema";
import { ConfigDialog, ConfigFormBody, ConfigFooter } from "./config-dialog";
const fields: WizardField<PensionValues>[] = [
  { type: I.NUMBER, name: "employeeRate", label: "Employee rate (%)", min: 0, max: 100, required: true },
  { type: I.NUMBER, name: "employerRate", label: "Employer rate (%)", min: 0, max: 100, required: true },
  { type: I.NUMBER, name: "tier2Rate", label: "Tier 2 rate (%)", min: 0, max: 100, required: true },
  { type: I.NUMBER, name: "ceiling", label: "Insurable earnings ceiling (GHS)", min: 0, required: true },
  { type: I.DATE, name: "from", label: "Effective from", required: true },
  { type: I.DATE, name: "to", label: "Effective until" },
];
export function PensionDialog({ onClose }: { onClose: () => void }) {
  const form = useForm<PensionValues>({
    resolver: zodResolver(pensionEditorSchema),
    defaultValues: { employeeRate: Number.NaN, employerRate: Number.NaN, tier2Rate: Number.NaN, ceiling: Number.NaN, from: null, to: null },
  });
  return (
    <ConfigDialog kind="pension" original={null} onClose={onClose}>
      {(command) => (
        <form
          noValidate
          className="flex min-h-0 flex-1 flex-col gap-4"
          onSubmit={form.handleSubmit(async (values) => {
            const body = pensionCommand(values);
            if (body) await command.run(body);
          })}
        >
          <ConfigFormBody {...command}>
            <FormWizard form={form} fields={fields} />
          </ConfigFormBody>
          <ConfigFooter {...command} onClose={onClose} />
        </form>
      )}
    </ConfigDialog>
  );
}
