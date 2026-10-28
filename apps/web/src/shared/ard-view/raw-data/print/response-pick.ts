import { sanitizeString } from "@/shared/ard-view/legacy";
import { FormResponseDto } from "@/shared/ard-view/dto";

const toEpoch = (value: unknown): number => {
  if (!value) return 0;
  const date = new Date(String(value));
  const time = date.getTime();
  return Number.isFinite(time) ? time : 0;
};

const hasLabelValueObject = (payload: unknown): boolean => {
  if (!payload || typeof payload !== "object") return false;
  if (!("value" in payload) || !("label" in payload)) return false;

  const value = (payload as { value?: unknown }).value;
  const label = (payload as { label?: unknown }).label;
  return sanitizeString(value).length > 0 && sanitizeString(label).length > 0;
};

const parseJsonMaybe = (value: unknown, depth = 0): unknown => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (typeof parsed === "string" && depth < 2) {
      return parseJsonMaybe(parsed, depth + 1);
    }
    return parsed;
  } catch {
    return value;
  }
};

const unwrapNestedValuePayload = (value: unknown, depth = 0): unknown => {
  if (depth > 3) return value;
  const parsed = parseJsonMaybe(value);
  if (!parsed || typeof parsed !== "object") return parsed;

  const record = parsed as Record<string, unknown>;
  if ("value" in record) {
    const nested = record.value;
    if (typeof nested === "string" || (nested && typeof nested === "object")) {
      const nestedParsed = parseJsonMaybe(nested);
      if (nestedParsed && typeof nestedParsed === "object") {
        return unwrapNestedValuePayload(nestedParsed, depth + 1);
      }
    }
  }

  return parsed;
};

const getResponseRichnessScore = (response: FormResponseDto): number => {
  const attachmentCount = response?.attachments?.length ?? 0;
  if (attachmentCount > 0) return 10 + attachmentCount;

  const raw = sanitizeString(response?.value);
  if (!raw) return 0;

  const parsed = unwrapNestedValuePayload(response?.value);
  if (typeof parsed === "string") {
    return sanitizeString(parsed).length > 0 ? 1 : 0;
  }

  if (hasLabelValueObject(parsed)) return 2;

  if (Array.isArray(parsed)) {
    const withLabelValue = parsed.some((item) => hasLabelValueObject(item));
    if (withLabelValue) return 2;
    if (parsed.length > 0) return 1;
  }

  if (parsed && typeof parsed === "object") {
    const record = parsed as Record<string, unknown>;
    const tableData = record.tableData;
    if (
      Array.isArray(tableData) &&
      tableData.some(
        (row) =>
          Array.isArray(row) &&
          row.some((cell) => sanitizeString(cell).length > 0),
      )
    ) {
      return 8;
    }
    const hasResults =
      Array.isArray(record.results) ||
      Array.isArray(record.evaluations) ||
      Array.isArray(record.expressionEvaluations) ||
      (record.sampleResults && typeof record.sampleResults === "object");
    if (hasResults) return 6;
    if (Object.keys(record).length > 0) return 3;
  }

  return 0;
};

export const getBestResponseMap = (responses: FormResponseDto[]) => {
  const latestByFieldId = new Map<string, FormResponseDto>();

  responses.forEach((item) => {
    const fieldId = sanitizeString(item?.formField?.id);
    if (!fieldId) return;

    const existing = latestByFieldId.get(fieldId);
    if (!existing) {
      latestByFieldId.set(fieldId, item);
      return;
    }

    const existingScore = getResponseRichnessScore(existing);
    const incomingScore = getResponseRichnessScore(item);

    if (incomingScore > existingScore) {
      latestByFieldId.set(fieldId, item);
      return;
    }
    if (incomingScore < existingScore) {
      return;
    }

    const existingTime = Math.max(
      toEpoch((existing as { updatedAt?: unknown })?.updatedAt),
      toEpoch((existing as { createdAt?: unknown })?.createdAt),
    );
    const incomingTime = Math.max(
      toEpoch((item as { updatedAt?: unknown })?.updatedAt),
      toEpoch((item as { createdAt?: unknown })?.createdAt),
    );

    if (incomingTime >= existingTime) {
      latestByFieldId.set(fieldId, item);
    }
  });

  return latestByFieldId;
};
