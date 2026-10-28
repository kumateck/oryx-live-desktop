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

const numberPattern = /-?\d[\d,]*(?:\.\d+)?/g;

const extractNumbers = (value: string) =>
  Array.from(value.matchAll(numberPattern))
    .map((match) => toNumber(match[0]))
    .filter((item): item is number => item !== null);

const getRange = (spec: string) => {
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
    return parseStoredFormulaResults(response)[0]?.value ?? "";
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
      return response
        ? [
            inferCompliance(
              sanitizeString(section.description),
              sanitizeString(getFieldResult(response, section)),
            ),
          ]
        : [];
    });

    return [
      {
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
