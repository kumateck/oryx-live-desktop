import { type FieldValues, type UseFormReturn } from "react-hook-form";
import { RichTextView } from "@/shared/rich-text/rich-text-view";
import type { SelectLoader } from "@/shared/forms/form-wizard-types";
import { isUniformityFormula } from "@/shared/formula/formula-preview";
import { QuestionType } from "@/shared/questions/question-types";
import { AnswerFieldsContext } from "./answer-context";
import { AnswerItem, type DraftControls } from "./answer-item";
import { questionDefinition, type FormField, type FormSection } from "./form-model";

const headerTypes: readonly number[] = [QuestionType.Equipment, QuestionType.Instrument];
const isUniformity = (field: FormField) => field.question.type === QuestionType.Formula && isUniformityFormula(questionDefinition(field.question));

/** Uniformity formulas are answered above the test table; every other field sits under its section. */
export function splitUniformity(sections: readonly FormSection[]) {
  const uniformity = sections.flatMap((section) => section.fields.filter(isUniformity));
  const tests = sections.map((section) => ({ ...section, fields: section.fields.filter((field) => !isUniformity(field)) })).filter((section) => section.fields.length > 0);
  return { uniformity, tests };
}

/**
 * The analytical worksheet as an analyst fills it in: each test numbered, its equipment and instruments next to the
 * test name, and its observations below.
 */
export function AnswerSheet({ form, sections, loadEquipment, drafts, disabled = false }: {
  form: UseFormReturn<FieldValues>; sections: readonly FormSection[]; loadEquipment: SelectLoader; drafts: DraftControls | null; disabled?: boolean;
}) {
  const { uniformity, tests } = splitUniformity(sections);
  const byId = new Map(sections.flatMap((section) => section.fields.map((field) => [field.id, field] as const)));
  return <AnswerFieldsContext.Provider value={byId}><div className="min-w-0 space-y-4">
    {uniformity.map((field) => <AnswerItem key={field.id} form={form} field={field} loadEquipment={loadEquipment} drafts={drafts} disabled={disabled} className="rounded-lg border bg-card p-3" />)}
    {tests.length > 0 ? <div className="max-w-full overflow-x-auto rounded-lg border bg-card"><table className="w-full table-fixed border-collapse text-sm">
      <thead><tr className="bg-muted"><th scope="col" className="w-16 border-b px-3 py-2 text-left font-semibold">No.</th><th scope="col" className="border-b px-3 py-2 text-left font-semibold">Test and observations</th></tr></thead>
      <tbody>{tests.map((section, index) => { const header = section.fields.filter((field) => headerTypes.includes(field.question.type)); const body = section.fields.filter((field) => !headerTypes.includes(field.question.type));
        return [<tr key={`${section.id}-head`} className="border-b"><td className="border-r px-3 py-2 align-top font-semibold">{index + 1}.</td>
          <td className="px-3 py-2"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0 flex-1 font-medium"><RichTextView html={section.name} />{section.description ? <RichTextView html={section.description} className="mt-1 text-sm font-normal text-muted-foreground" /> : null}</div>
            {header.length ? <div className="flex flex-wrap justify-end gap-3">{header.map((field) => <AnswerItem key={field.id} form={form} field={field} loadEquipment={loadEquipment} drafts={drafts} disabled={disabled}
              label={field.question.type === QuestionType.Equipment ? "Equipment ID" : "Instrument ID"} className="w-72 max-w-full" />)}</div> : null}</div></td></tr>,
          body.length ? <tr key={`${section.id}-body`} className="border-b"><td className="border-r" /><td className="space-y-4 px-3 py-3">
            {body.map((field) => <AnswerItem key={field.id} form={form} field={field} loadEquipment={loadEquipment} drafts={drafts} disabled={disabled} />)}</td></tr> : null];
      })}</tbody>
    </table></div> : null}
  </div></AnswerFieldsContext.Provider>;
}
