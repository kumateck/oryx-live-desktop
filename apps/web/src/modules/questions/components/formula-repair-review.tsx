import type { UseFormReturn } from "react-hook-form";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { ExpressionView } from "@/shared/formula/ui/math/expression-view";
import { formulaRepairDefaults } from "../lib/formula-repair";
import type { FormulaRepairValues, RepairPreview } from "../schemas/formula-repair-schema";

const reasonFields: WizardField<FormulaRepairValues>[] = [
  { type: InputTypes.TEXTAREA, name: "reason", label: "Reason for repair", required: true, rows: 2, placeholder: "What was wrong, and how the correction was confirmed" },
];

function Expression({ title, raw }: { title: string; raw: string }) {
  return <div className="min-w-0 space-y-1"><h3 className="text-sm font-medium">{title}</h3>
    <div className="max-w-full overflow-x-auto rounded-md border bg-background p-2"><ExpressionView expression={formulaRepairDefaults(raw).expression} print /></div></div>;
}

/** The reviewed impact of a repair. Changing the configuration or scope hides it until previewed again. */
export function FormulaRepairReview({ preview, form, updateQuestion }: { preview: RepairPreview; form: UseFormReturn<FormulaRepairValues>; updateQuestion: boolean }) {
  const ready = preview.blockers.length === 0;
  return <section aria-label="Repair preview" className="space-y-3 rounded-lg border bg-muted/20 p-4">
    <h2 className="font-semibold">Review repair</h2>
    <div className="grid gap-3 md:grid-cols-2"><Expression title="Before" raw={preview.before} /><Expression title="After" raw={preview.after} /></div>
    <ul className="list-disc space-y-1 pl-5 text-sm">
      {updateQuestion ? <li>The shared question changes for templates and tests started after this repair.</li> : <li>The shared question is not changed.</li>}
      <li>{preview.captures} existing test placements keep their current configuration as recorded history.</li>
      <li>{preview.selectedTests} selected test fields use the corrected formula. Entered readings are kept exactly as typed; their results are cleared until the server recalculates them.</li>
    </ul>
    {preview.tests.length ? <table className="w-full table-fixed text-left text-sm">
      <caption className="sr-only">Selected tests</caption>
      <thead className="text-muted-foreground"><tr><th className="w-1/2 font-medium">Test</th><th className="font-medium">Readings</th><th className="font-medium">After repair</th></tr></thead>
      <tbody>{preview.tests.map(test => <tr key={`${test.atrId}/${test.formFieldId}`} className="border-t align-top">
        <td className="break-words py-1 pr-2">{test.label}</td>
        <td className="py-1 pr-2">{test.hasReadings ? "Kept" : "None saved yet"}</td>
        <td className="py-1">{test.missingInputs ? "Needs inputs, then recalculation" : test.configurationChanges ? "Needs recalculation" : "Unchanged"}</td>
      </tr>)}</tbody>
    </table> : null}
    {preview.missingInputs.length ? <div className="space-y-1"><h3 className="text-sm font-medium">Missing inputs</h3>
      {preview.missingInputs.map(text => <p key={text} className="break-words text-sm text-muted-foreground">{text}</p>)}</div> : null}
    {preview.blockers.map(text => <p role="alert" key={text} className="text-sm text-destructive">{text}</p>)}
    {ready ? <FormWizard form={form} fields={reasonFields} /> : <p className="text-sm">Resolve the issues above, then preview again.</p>}
  </section>;
}
