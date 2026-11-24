import { hasCoaReporting } from "./coa-reporting";
import { QuestionType, sanitizeNumber, sanitizeString } from "@/shared/ard-view/legacy";
import {
  CertificateOfAnalysisComplies,
  FormResponseDto,
  FormSectionDto,
} from "@/shared/ard-view/dto";
import { getCompactFormulaEvaluations } from "./print/formula-evaluation";
import { getBestResponseMap } from "./print/response-pick";
import {
  isGovernedFormulaResponse,
  parseStoredFormulaResults,
} from "./governed-formula-result";

export type CoaComplianceItem = CertificateOfAnalysisComplies & {
  requiresReview?: boolean | undefined;
  reportingLocked?: boolean | undefined;
};

const normalizeText = (value?: string | null) =>
  sanitizeString(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const toNumber = (value: string) => {
  const numeric = Number(value.replace(/,/g, ""));
  return Number.isFinite(numeric) ? numeric : null;
};

// A minus sign only when it does not follow a number: in "1.00-1.300" the dash separates a range.
const numberPattern = /(?:(?<![\d.])-)?\d[\d,]*(?:\.\d+)?/g;

const extractNumbers = (value: string) =>
  Array.from(value.matchAll(numberPattern))
    .map((match) => toNumber(match[0]))
    .filter((item): item is number => item !== null);

const number = String.raw`(-?\d[\d,]*(?:\.\d+)?)`;
const upperLimit = new RegExp(String.raw`(?:\bnmt\b|not more than|\bmax(?:imum)?\b\.?|≤|<=|less than or equal to)\s*:?\s*` + number);
const lowerLimit = new RegExp(String.raw`(?:\bnlt\b|not less than|\bmin(?:imum)?\b\.?|≥|>=|greater than or equal to)\s*:?\s*` + number);

/** The limits a specification states: one-sided ("NMT 120.0%", "NLT 85%"), both, or a plain "2 to 4" range. */
const getRange = (spec: string) => {
  const upper = upperLimit.exec(spec)?.[1];
  const lower = lowerLimit.exec(spec)?.[1];
  if (upper !== undefined || lower !== undefined) {
    const max = upper === undefined ? null : toNumber(upper);
    const min = lower === undefined ? null : toNumber(lower);
    if ((upper !== undefined && max === null) || (lower !== undefined && min === null)) return null;
    return { min: min ?? Number.NEGATIVE_INFINITY, max: max ?? Number.POSITIVE_INFINITY };
  }
  const numbers = extractNumbers(spec);
  if (numbers.length < 2) return null;
  const [first = 0, second = 0] = numbers;
  return { min: Math.min(first, second), max: Math.max(first, second) };
};

export const inferCompliance = (specification: string, result: string) => {
  const normalizedResult = normalizeText(result);
  if (!normalizedResult) return { complies: false, isCertain: false };
  if (/does not comply|not complies|not comply|fails?/.test(normalizedResult)) {
    return { complies: false, isCertain: true };
  }
  if (/\bcomplies?\b|\bpasses?\b/.test(normalizedResult)) {
    return { complies: true, isCertain: true };
  }

  const normalizedSpec = normalizeText(specification);
  const range = getRange(normalizedSpec);
  const resultNumber = extractNumbers(normalizedResult)[0];
  if (range && resultNumber !== undefined) {
    return {
      complies: resultNumber >= range.min && resultNumber <= range.max,
      isCertain: true,
    };
  }

  if (normalizedSpec && normalizedResult) {
    return {
      complies: normalizedSpec === normalizedResult,
      isCertain: normalizedSpec === normalizedResult,
    };
  }

  return { complies: false, isCertain: false };
};

const getFieldResult = (response: FormResponseDto, section: FormSectionDto) => {
  const questionType = sanitizeNumber(response.formField?.question?.type);
  if (questionType !== sanitizeNumber(QuestionType.Formula)) {
    return sanitizeString(response.value);
  }

  if (isGovernedFormulaResponse(response)) {
    // Every sample's result must meet the specification, not only the first.
    const results = parseStoredFormulaResults(response).map((result) => result.value);
    return results.length ? results : "";
  }

  const templateField = section.fields?.find(
    (field) => field.id === response.formField?.id,
  );
  const compact = getCompactFormulaEvaluations(
    response.value,
    sanitizeString(templateField?.question?.options?.[0]?.name),
  );
  return compact.average !== null ? String(compact.average) : response.value;
};

export const buildCoaCompliancePayload = (
  sections?: FormSectionDto[],
  responses?: FormResponseDto[],
): CoaComplianceItem[] => {
  const responseMap = getBestResponseMap(responses ?? []);

  return (sections ?? []).flatMap((section) => {
    const formSectionId = sanitizeString(section.id);
    if (!formSectionId) return [];
    const fieldResults = (section.fields ?? []).flatMap((field) => {
      const response = field.id ? responseMap.get(field.id) : undefined;
      if (!response) return [];
      if (hasCoaReporting(response)) {
        if (response.coaReportingError) return [{ complies: false, isCertain: false }];
        return (response.coaReportedResults ?? []).map(result => result.converted
          ? { complies: result.complies === true, isCertain: result.complies !== null && result.complies !== undefined }
          : inferCompliance(sanitizeString(section.description), result.displayValue ?? ""));
      }
      const result = getFieldResult(response, section);
      return (Array.isArray(result) ? result : [result]).map((value) =>
        inferCompliance(sanitizeString(section.description), sanitizeString(value)));
    });

    const answers = (section.fields ?? []).flatMap(field => { const answer = field.id ? responseMap.get(field.id) : null; return answer ? [answer] : []; });
    const reportingFailure = answers.some(answer => Boolean(answer.coaReportingError) || answer.coaReportedResults?.some(result => result.converted && result.complies === false));
    const fullyReported = answers.length > 0 && answers.length === (section.fields ?? []).length
      && answers.every(answer => (answer.coaReportedResults?.length ?? 0) > 0 && answer.coaReportedResults?.every(result => result.converted));
    return [
      {
        ...(reportingFailure || fullyReported ? { reportingLocked: true } : {}),
        formSectionId,
        complies: fieldResults.length
          ? fieldResults.every((item) => item.complies)
          : false,
        requiresReview:
          fieldResults.length === 0 ||
          fieldResults.some((item) => !item.isCertain),
      },
    ];
  });
};
