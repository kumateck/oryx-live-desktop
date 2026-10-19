import { z } from "zod";

const json = z.json();
const record = z.record(z.string(), json);

/** Older clients stored JSON inside JSON strings and value envelopes, sometimes with lowercase field names. */
export function normalizeFormulaResponse(raw: string): string {
  try {
    let value = json.parse(JSON.parse(raw));
    for (let depth = 0; depth < 8; depth += 1) {
      if (typeof value === "string") {
        try { value = json.parse(JSON.parse(value)); continue; } catch { break; }
      }
      const object = record.safeParse(value);
      if (!object.success) break;
      const nested = object.data.value;
      if (nested !== null && (typeof nested === "object" || typeof nested === "string")) {
        try {
          const decoded = typeof nested === "string" ? json.parse(JSON.parse(nested)) : nested;
          if (decoded !== null && (typeof decoded === "object" || typeof decoded === "string")) { value = decoded; continue; }
        } catch { /* A scalar value is not a formula envelope. */ }
      }
      const aliases = { standardInputs: "standardinputs", sampleInputs: "sampleinputs", tableData: "tabledata", manualVars: "manualvars" };
      const result = { ...object.data };
      for (const [canonical, legacy] of Object.entries(aliases)) {
        if (!(canonical in result) && legacy in result) result[canonical] = result[legacy] ?? null;
      }
      return JSON.stringify(result);
    }
    return typeof value === "string" ? value : JSON.stringify(value);
  } catch { return raw; }
}
