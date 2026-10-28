import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes as I } from "@/shared/forms/input-types";
import { bandEditorSchema, bandCommand, type BandValues } from "../schemas/editor-schema";
import { ConfigDialog, ConfigFormBody, ConfigFooter } from "./config-dialog";
const fields: WizardField<BandValues>[] = [
  { type: I.NUMBER, name: "lowerBound", label: "Lower bound (GHS)", min: 0, required: true },
  {
    type: I.NUMBER,
    name: "upperBound",
    label: "Upper bound (GHS)",
    min: 0,
    description: "Leave blank for an uncapped band. Zero is a value, not a blank upper bound.",
  },
  { type: I.NUMBER, name: "rate", label: "Rate (%)", min: 0, max: 100, required: true },
  { type: I.DATE, name: "from", label: "Effective from", required: true },
  { type: I.DATE, name: "to", label: "Effective until", description: "Optional end date. The server's current-band list omits bands with an end date." },
];
export function BandDialog({ onClose }: { onClose: () => void }) {
  const form = useForm<BandValues>({
    resolver: zodResolver(bandEditorSchema),
    defaultValues: { lowerBound: Number.NaN, upperBound: null, rate: Number.NaN, from: null, to: null },
  });
  return (
    <ConfigDialog kind="band" original={null} onClose={onClose}>
      {(command) => (
        <form
          noValidate
          className="flex min-h-0 flex-1 flex-col gap-4"
          onSubmit={form.handleSubmit(async (values) => {
            const body = bandCommand(values);
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
