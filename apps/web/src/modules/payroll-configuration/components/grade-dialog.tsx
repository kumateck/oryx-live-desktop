import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes as I } from "@/shared/forms/input-types";
import { gradeEditorSchema, gradeCommand, type GradeValues } from "../schemas/editor-schema";
import type { ConfigRecord } from "../schemas/contracts";
import { ConfigDialog, ConfigFormBody, ConfigFooter } from "./config-dialog";
const levels = ["Junior staff", "Senior staff", "Senior management"];
const fields: WizardField<GradeValues>[] = [
  { type: I.TEXT, name: "name", label: "Grade name", required: true },
  { type: I.NUMBER, name: "minSalary", label: "Minimum salary (GHS)", min: 0, required: true },
  { type: I.NUMBER, name: "maxSalary", label: "Maximum salary (GHS)", min: 0, required: true },
  {
    type: I.SELECT,
    name: "level",
    label: "Employee level",
    mode: "single",
    source: "sync",
    options: levels.map((label, value) => ({ value: String(value), label })),
  },
];
export function GradeDialog({ original = null, onClose }: { original?: ConfigRecord | null; onClose: () => void }) {
  const row = original?.kind === "grade" ? original.row : null;
  const form = useForm<GradeValues>({
    resolver: zodResolver(gradeEditorSchema),
    defaultValues: {
      name: row?.name ?? "",
      minSalary: row?.minSalary ?? Number.NaN,
      maxSalary: row?.maxSalary ?? Number.NaN,
      level:
        row?.level === null || row?.level === undefined
          ? null
          : { value: row.level === 0 ? "0" : row.level === 1 ? "1" : "2", label: levels[row.level] ?? "Level" },
    },
  });
  return (
    <ConfigDialog kind="grade" original={original} onClose={onClose}>
      {(command) => (
        <form
          noValidate
          className="flex min-h-0 flex-1 flex-col gap-4"
          onSubmit={form.handleSubmit(async (values) => {
            await command.run(gradeCommand(values, original));
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
