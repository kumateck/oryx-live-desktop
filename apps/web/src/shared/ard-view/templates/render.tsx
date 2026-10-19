import StoredFormulaResult from "@/shared/ard-view/raw-data/print/stored-formula-result";
import { isGovernedFormulaResponse } from "@/shared/ard-view/raw-data/governed-formula-result";
import { getCompactFormulaEvaluations } from "@/shared/ard-view/raw-data/print/formula-evaluation";
import { parsedResponseValueOnly } from "@/shared/ard-view/raw-data/print/question-renderers/parsers/value";
import { renderPrintStoredResponseValue } from "@/shared/ard-view/raw-data/print/question-view";
import { hasMeaningfulResponse } from "@/shared/ard-view/raw-data/print/section-utils";
import { formatCompactFormulaResult } from "@/shared/ard-view/raw-data/print/compact-formula-result";
import { QuestionType, sanitizeNumber, sanitizeString } from "@/shared/ard-view/legacy";
import {
  FormFieldDto,
  FormResponseDto,
} from "@/shared/ard-view/dto";
import { ReactNode } from "react";

export const renderSpecificationResult = (
  response: FormResponseDto,
  templateField: FormFieldDto,
) => {
  if (isGovernedFormulaResponse(response)) return <StoredFormulaResult response={response} />;
  const questionType = sanitizeNumber(templateField.question?.type ?? response.formField?.question?.type);
  if (questionType !== sanitizeNumber(QuestionType.Formula)) {
    return renderPrintStoredResponseValue(response, templateField);
  }

  const compact = getCompactFormulaEvaluations(
    response.value,
    sanitizeString(templateField.question?.options?.[0]?.name),
  );
  const hasAverage = compact.average !== null;
  const entries = compact.entries.filter((entry) => entry.result !== null);

  if (!hasAverage && !entries.length) return <span className="text-muted-foreground">Result unavailable</span>;

  if (hasAverage) {
    return (
      <span className="text-sm font-semibold">
        Average content:{" "}
        {formatCompactFormulaResult(
          compact.average,
          compact.decimalPlaces,
          compact.percentageResults,
        )}
      </span>
    );
  }

  return (
    <div className="space-y-1 text-sm">
      {entries.map((entry, index) => (
        <div key={`${entry.label}-${index}`} className="flex gap-2">
          {entries.length > 1 ? <span className="font-semibold">{entry.label}:</span> : null}
          <span>
            {formatCompactFormulaResult(
              entry.result,
              compact.decimalPlaces,
              compact.percentageResults,
            )}
          </span>
        </div>
      ))}
    </div>
  );
};

export const isSpecificationSummaryType = (type?: number | null) => {
  const questionType = sanitizeNumber(type);
  return (
    questionType === sanitizeNumber(QuestionType.ShortAnswer) ||
    questionType === sanitizeNumber(QuestionType.LongAnswer) ||
    questionType === sanitizeNumber(QuestionType.Paragraph) ||
    questionType === sanitizeNumber(QuestionType.Formula)
  );
};

const normalizeComplianceResult = (value?: string | null) =>
  parsedResponseValueOnly(sanitizeString(value))
    .replace(/[^a-z]+/gi, " ")
    .trim()
    .toLowerCase();

const normalizeDistinctResult = (response?: FormResponseDto) => {
  const complianceValue = normalizeComplianceResult(response?.value);
  if (complianceValue === "complies") return complianceValue;

  const normalizedValue = parsedResponseValueOnly(
    sanitizeString(response?.value),
  )
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
  return normalizedValue || sanitizeString(response?.value).trim();
};

// Helper function to get all responses for a section
export const getResponsesForSection = (
  fields: FormFieldDto[],
  responseMap: Map<string, FormResponseDto>,
): ReactNode => {
  const fieldsWithResponses = fields.map((field) => ({
    field,
    response: field.id ? responseMap.get(field.id) : undefined,
  }));

  const seenResults = new Set<string>();
  const renderedFields = fieldsWithResponses.map(
    ({ field, response }, index) => {
      if (!isSpecificationSummaryType(field.question?.type)) return null;
      if (!hasMeaningfulResponse(response)) return null;

      const distinctKey =
        sanitizeNumber(field.question?.type) ===
        sanitizeNumber(QuestionType.Formula)
          ? `${sanitizeString(field.id)}:${normalizeDistinctResult(response)}`
          : normalizeDistinctResult(response);
      if (distinctKey && seenResults.has(distinctKey)) return null;
      if (distinctKey) seenResults.add(distinctKey);

      return (
        <div key={field.id ?? index} className="space-y-1 text-left">
          {renderSpecificationResult(response!, field)}
        </div>
      );
    },
  );

  const visibleFields = renderedFields.filter(Boolean);
  if (!visibleFields.length) return <span>-</span>;
  return <div className="space-y-2">{visibleFields}</div>;
};
