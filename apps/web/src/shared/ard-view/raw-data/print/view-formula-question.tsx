import { sanitizeString } from "@/shared/ard-view/legacy";
import { FormulaTypes } from "@/shared/ard-view/legacy";
import { normalizeFormulaSettings } from "@/shared/formula/formula-preview";
import {
  FormResponseDto,
  QuestionOptionDto,
} from "@/shared/ard-view/dto";
import {
  DEBUG_CLIENT_FORMULA_SETTINGS,
  isFormulaDebugEnabled,
} from "@/shared/formula/compute/formula-debug";
import { TheAduseiPreviewPrint } from "@/shared/ard-view/response/print/switch";
import FormulaPrintPreview from "./formula-print-preview";
import { isGovernedFormulaResponse } from "../governed-formula-result";
import StoredFormulaResult from "./stored-formula-result";

interface ViewFormulaQuestionProps {
  questionOption?: QuestionOptionDto | undefined;
  responseRecord?: FormResponseDto | undefined;
  response?: string | null | undefined;
}

const normalize = (value: unknown) => String(value ?? "").trim();

const parseFormulaSettings = (
  questionOption: QuestionOptionDto | undefined,
  responseRecord?: FormResponseDto,
) => {
  const tryParseFormulaConfig = (candidate: string) => {
    try {
      const normalizedCandidate = normalizeFormulaSettings(candidate);
      const firstPass = JSON.parse(normalizedCandidate) as unknown;
      const resolved =
        typeof firstPass === "string" ? JSON.parse(firstPass) : firstPass;
      if (!resolved || typeof resolved !== "object") return null;
      const firstObj = resolved as Record<string, unknown>;

      if (normalize(firstObj.type).length > 0) {
        return normalizeFormulaSettings(JSON.stringify(firstObj));
      }

      const nestedExpression = firstObj.expression;
      if (typeof nestedExpression === "string" && nestedExpression.trim()) {
        const nested = JSON.parse(nestedExpression) as unknown;
        if (!nested || typeof nested !== "object") return null;
        const nestedObj = nested as Record<string, unknown>;
        if (normalize(nestedObj.type).length > 0) {
          return normalizeFormulaSettings(JSON.stringify(nestedObj));
        }
      }
    } catch {
      return null;
    }

    return null;
  };

  const options = responseRecord?.formField?.question?.options ?? [];
  const candidates = [
    normalize((questionOption as { name?: unknown })?.name),
    normalize((questionOption as { value?: unknown })?.value),
    normalize((questionOption as { label?: unknown })?.label),
    ...options.flatMap((opt) => [
      normalize((opt as { name?: unknown })?.name),
      normalize((opt as { value?: unknown })?.value),
      normalize((opt as { label?: unknown })?.label),
    ]),
  ].filter(Boolean);

  for (const candidate of candidates) {
    const parsed = tryParseFormulaConfig(candidate);
    if (parsed) return parsed;
  }
  return "";
};

const resolveFormulaType = (settings: string): FormulaTypes | null => {
  try {
    if (!settings) return null;
    const parsed = JSON.parse(settings) as { type?: unknown };
    const typeNum = Number(parsed?.type);
    if (Number.isNaN(typeNum)) return null;
    return typeNum as FormulaTypes;
  } catch {
    return null;
  }
};

const normalizeFormulaResponse = (raw: string) => {
  try {
    if (!raw || raw.trim() === "") return raw;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object") return raw;

    const normalized = { ...parsed } as Record<string, unknown>;

    if ("standardinputs" in normalized && !("standardInputs" in normalized)) {
      normalized.standardInputs = normalized.standardinputs;
    }
    if ("sampleinputs" in normalized && !("sampleInputs" in normalized)) {
      normalized.sampleInputs = normalized.sampleinputs;
    }
    if ("tabledata" in normalized && !("tableData" in normalized)) {
      normalized.tableData = normalized.tabledata;
    }
    if ("manualvars" in normalized && !("manualVars" in normalized)) {
      normalized.manualVars = normalized.manualvars;
    }

    return JSON.stringify(normalized);
  } catch {
    return raw;
  }
};

const ViewFormulaQuestion = ({
  questionOption,
  responseRecord,
  response,
}: ViewFormulaQuestionProps) => {
  if (isGovernedFormulaResponse(responseRecord)) {
    return <StoredFormulaResult response={responseRecord} />;
  }
  const settings = isFormulaDebugEnabled()
    ? DEBUG_CLIENT_FORMULA_SETTINGS
    : parseFormulaSettings(questionOption, responseRecord);
  const formulaType = resolveFormulaType(settings);
  const normalizedResponse = normalizeFormulaResponse(sanitizeString(response));

  if (formulaType === FormulaTypes.Universal) {
    return (
      <FormulaPrintPreview settings={settings} response={normalizedResponse} />
    );
  }

  return (
    <TheAduseiPreviewPrint
      type={formulaType}
      settings={settings}
      response={normalizedResponse}
    />
  );
};

export default ViewFormulaQuestion;
