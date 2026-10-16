import { sanitizeString } from "@/shared/ard-view/legacy";

export const valueOnlyText = (input: unknown): string => {
  if (input == null) return "";
  if (typeof input === "string") {
    const trimmed = input.trim();
    if (!trimmed) return "";
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      return valueOnlyText(parsed);
    } catch {
      return trimmed;
    }
  }
  if (Array.isArray(input)) {
    return input
      .map((item) => valueOnlyText(item))
      .filter(Boolean)
      .join(", ");
  }
  if (
    typeof input === "object" &&
    "value" in (input as Record<string, unknown>)
  ) {
    return sanitizeString((input as { value?: unknown }).value);
  }
  return sanitizeString(input);
};

export const normalizeScalarString = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (typeof parsed === "string") return parsed.trim();
  } catch {
    // keep raw value when it is not JSON
  }
  return trimmed;
};

export const parsedResponseValueOnly = (rawValue: string) => {
  if (!rawValue) return "";
  try {
    const parsed = JSON.parse(rawValue) as unknown;
    return valueOnlyText(parsed);
  } catch {
    return normalizeScalarString(rawValue);
  }
};
