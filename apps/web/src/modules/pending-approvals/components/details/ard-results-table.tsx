import { Fragment, lazy, Suspense } from "react";
import { RichTextView } from "@/shared/rich-text/rich-text-view";
import { QuestionType } from "@/shared/questions/question-types";
import { answerFails, complianceLabels, testCompliance, type RecordedAnswer } from "../../lib/ard-results";
import type { ArdResultField, ArdResultSection } from "../../schemas/ard-result-schema";

const FormulaValue = lazy(() => import("./ard-formula-value"));
const isFormula = (field: ArdResultField, answer: RecordedAnswer | undefined) => Boolean(answer?.formulaGoverned)
  || (answer?.formField?.question?.type ?? field.question?.type) === QuestionType.Formula;

/** The same recorded evidence on the approval screen and its certificate preview. Calculations get the full row width. */
export function ArdResultsTable({ sections, recorded, certificate = false }: {
  sections: readonly ArdResultSection[]; recorded: ReadonlyMap<string, RecordedAnswer>; certificate?: boolean;
}) {
  const columns = certificate ? 5 : 4;
  return <div className="max-w-full overflow-x-auto rounded-lg border"><table className={certificate ? "print-table w-full table-fixed" : "w-full table-fixed text-sm"}>
    <caption className="sr-only">Tests, results and specifications</caption>
    <thead><tr className="border-b bg-muted/50 text-left text-xs text-muted-foreground">
      <th scope="col" className="w-12 p-2.5 font-medium">No.</th><th scope="col" className="w-[28%] p-2.5 font-medium">Test</th>
      <th scope="col" className="w-[30%] p-2.5 font-medium">{certificate ? "Result / observation" : "Result"}</th><th scope="col" className="p-2.5 font-medium">Specification</th>
      {certificate ? <th scope="col" className="w-[14%] p-2.5 font-medium">Compliance</th> : null}
    </tr></thead>
    <tbody>{sections.map((section, index) => {
      const fields = [...section.fields].sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0));
      const entries = fields.map((field) => ({ field, answer: field.id ? recorded.get(field.id) : undefined }));
      const formulas = entries.filter(({ field, answer }) => isFormula(field, answer));
      return <Fragment key={section.id ?? index}>
        <tr className="border-b align-top last:border-0"><td className="p-2.5 text-muted-foreground">{index + 1}</td>
          <td className="p-2.5">{section.groupName ? <div className="text-xs text-muted-foreground">{section.groupName}</div> : null}<RichTextView html={section.name} className="font-medium" /></td>
          <td className="p-2.5"><ul className="space-y-1">{entries.map(({ field, answer }, position) => <li key={field.id ?? position} className={answerFails(answer) ? "text-destructive" : undefined}>
            {fields.length > 1 && field.question?.label ? <span className="text-muted-foreground">{field.question.label}: </span> : null}
            {isFormula(field, answer) ? <span className="text-muted-foreground">See calculation below</span>
              : answer?.value ? <RichTextView html={answer.value} className="inline" /> : <span className="text-muted-foreground">No result</span>}
          </li>)}{fields.length === 0 ? <li className="text-muted-foreground">No result</li> : null}</ul></td>
          <td className="p-2.5">{section.description ? <RichTextView html={section.description} /> : <span className="text-muted-foreground">–</span>}</td>
          {certificate ? <td className="p-2.5">{complianceLabels[testCompliance(fields.map((field) => field.id), recorded)]}</td> : null}
        </tr>
        {formulas.length > 0 ? <tr className="border-b align-top last:border-0"><td /><td colSpan={columns - 1} className="p-3">
          <div className="min-w-0 space-y-4">{formulas.map(({ field, answer }, position) => <section key={field.id ?? position} className="min-w-0 space-y-2 overflow-x-auto">
            <RichTextView html={field.question?.label ?? section.name} className="font-semibold" />
            <Suspense fallback={<p role="status" className="text-muted-foreground">Loading recorded calculation…</p>}><FormulaValue field={field} answer={answer} /></Suspense>
          </section>)}</div>
        </td></tr> : null}
      </Fragment>;
    })}</tbody>
  </table></div>;
}
