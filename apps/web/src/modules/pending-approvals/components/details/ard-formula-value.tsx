import { FormulaType } from "@/shared/questions/question-types";
import { evaluationSettings } from "@/shared/formula/ui/types/evaluate/settings";
import { SimplePreview } from "@/shared/ard-view/response/print/preview/simple";
import { UniformityPreview } from "@/shared/ard-view/response/print/preview/uniformity";
import FormulaPrintPreview from "@/shared/ard-view/raw-data/print/formula-print-preview";
import StoredFormulaResult from "@/shared/ard-view/raw-data/print/stored-formula-result";
import type { RecordedAnswer } from "../../lib/ard-results";
import type { ArdResultField } from "../../schemas/ard-result-schema";

/** Read-only evidence; governed answers always use server-stored results, never a browser recalculation. */
export default function ArdFormulaValue({ field, answer }: { field: ArdResultField; answer: RecordedAnswer | undefined }) {
  if (answer?.formulaGoverned) return <StoredFormulaResult response={{
    formulaGoverned: true, formulaResultFinalized: answer.formulaResultFinalized ?? false,
    formulaExecutionId: answer.formulaExecutionId ?? null, formulaDisplayResultsJson: answer.formulaDisplayResultsJson ?? null,
  }} />;
  if (!answer?.value) return <span className="text-muted-foreground">No result</span>;
  // Prefer question metadata returned with the recorded answer; use the template when it is absent.
  const options = answer.formField?.question?.options?.length ? answer.formField.question.options : field.question?.options;
  const definition = options?.map((option) => evaluationSettings(option.name ?? "")).find((entry) => entry !== null);
  if (!definition) return <p role="alert" className="text-destructive">Formula configuration unavailable. The recorded calculation cannot be displayed.</p>;
  const props = { settings: definition.settings, response: answer.value };
  switch (definition.type) {
    case FormulaType.Simple: return <SimplePreview {...props} />;
    case FormulaType.Uniformity: return <UniformityPreview {...props} />;
    case FormulaType.Universal: return <FormulaPrintPreview {...props} />;
  }
}
