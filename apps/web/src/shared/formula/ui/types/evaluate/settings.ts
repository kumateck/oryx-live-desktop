import { z } from "zod";
import { formulaPreview } from "@/shared/formula/formula-preview";
import { FormulaType } from "@/shared/questions/question-types";

const objectSchema = z.record(z.string(), z.json());
type Json = z.infer<ReturnType<typeof z.json>>;

function nestedSettings(expression: Json | undefined): Record<string, Json> {
  if (typeof expression !== "string" || !expression.trim().startsWith("{")) return {};
  try {
    const nested = objectSchema.safeParse(JSON.parse(expression));
    return nested.success && typeof nested.data.expression === "string" ? nested.data : {};
  } catch {
    return {};
  }
}

/** Preserve the stored calculation contract while unwrapping legacy JSON and settings envelopes. */
export function evaluationSettings(raw: string): { type: FormulaType; settings: string } | null {
  try {
    let value = z.json().parse(JSON.parse(raw));
    for (let depth = 0; depth < 3 && typeof value === "string"; depth += 1) value = z.json().parse(JSON.parse(value));
    const root = objectSchema.parse(value);
    const candidates = [root, ...[root.schema, root.data, root.value, root.settings, root.formula].flatMap((candidate) => {
      const parsed = objectSchema.safeParse(candidate);
      return parsed.success ? [parsed.data] : [];
    })];
    const found = candidates.find((candidate) => typeof candidate.expression === "string" || typeof candidate.mode === "string");
    if (!found) return null;
    // The question editor stores a Simple formula as { type, expression: "<builder settings JSON>" }; read the inner settings.
    const payload = { ...found, ...nestedSettings(found.expression) };
    const type = formulaPreview(raw).type;
    if (type !== FormulaType.Uniformity && (typeof payload.expression !== "string" || !payload.expression.trim())) return null;
    return { type, settings: JSON.stringify({ ...root, ...payload, type }) };
  } catch {
    return null;
  }
}
