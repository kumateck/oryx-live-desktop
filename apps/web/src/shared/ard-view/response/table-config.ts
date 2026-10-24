import type { QuestionOptionDto } from "@/shared/ard-view/dto";
import { parseTableConfig, type TableConfig } from "@/shared/questions/table-question";

export const parseTablePayload = (value: unknown): unknown => {
  let parsed = value;
  for (let depth = 0; depth < 5; depth += 1) {
    if (typeof parsed === "string") {
      if (!parsed.trim()) return null;
      try {
        parsed = JSON.parse(parsed);
        continue;
      } catch {
        return parsed;
      }
    }
    if (parsed && typeof parsed === "object" && "value" in parsed) {
      parsed = parsed.value;
      continue;
    }
    break;
  }
  return parsed;
};

export const getTableConfig = (options?: QuestionOptionDto[] | null): TableConfig | null => {
  const parsed = parseTablePayload(options?.[0]?.name);
  return parsed && typeof parsed === "object" ? parseTableConfig(JSON.stringify(parsed)) : null;
};

