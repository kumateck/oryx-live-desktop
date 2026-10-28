import { FormulaType } from "@/shared/questions/question-types";
import { evaluationSettings } from "@/shared/formula/ui/types/evaluate/settings";
import type { FormResponseDto, QuestionOptionDto } from "@/shared/ard-view/dto";
import { TheAduseiPreviewPrint } from "@/shared/ard-view/response/print/switch";
import FormulaPrintPreview from "./formula-print-preview";
import { isGovernedFormulaResponse } from "../governed-formula-result";
import StoredFormulaResult from "./stored-formula-result";
import { normalizeFormulaResponse } from "./normalize-formula-response";

interface Props { questionOption?: QuestionOptionDto | undefined; responseRecord?: FormResponseDto | undefined; response?: string | null | undefined }

/** Shared with Oryx Next's detailed worksheet path. Read-only views always use recorded settings, never debug overrides. */
export default function ViewFormulaQuestion({ questionOption, responseRecord, response }: Props) {
  if (isGovernedFormulaResponse(responseRecord)) return <StoredFormulaResult response={responseRecord} />;
  const candidates = [questionOption, ...(responseRecord?.formField?.question?.options ?? [])];
  const definition = candidates.map((option) => evaluationSettings(option?.name ?? "")).find((entry) => entry !== null);
  if (!definition) return <p role="alert" className="text-sm text-destructive">Formula configuration unavailable. The recorded calculation cannot be displayed.</p>;
  const value = normalizeFormulaResponse(response ?? responseRecord?.value ?? "");
  return definition.type === FormulaType.Universal
    ? <FormulaPrintPreview settings={definition.settings} response={value} />
    : <TheAduseiPreviewPrint type={definition.type} settings={definition.settings} response={value} />;
}
