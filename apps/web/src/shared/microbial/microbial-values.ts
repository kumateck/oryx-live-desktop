// The microbial question types' stored answers, read and written in the server's formats (oryx-backend MicrobialValues).

export const organisms = [
  { value: "escherichia-coli", label: "Escherichia coli" },
  { value: "salmonella", label: "Salmonella" },
  { value: "staphylococcus-aureus", label: "Staphylococcus aureus" },
  { value: "pseudomonas-aeruginosa", label: "Pseudomonas aeruginosa" },
  { value: "candida-albicans", label: "Candida albicans" },
  { value: "bile-tolerant-gram-negative-bacteria", label: "Bile-tolerant gram-negative bacteria" },
  { value: "clostridia", label: "Clostridia" },
] as const;
export const organismName = (code: string | null | undefined) => organisms.find((item) => item.value === code)?.label ?? code ?? "";
export const cfuUnits = ["cfu/g", "cfu/mL", "cfu/plate"] as const;
export const quantityUnits = ["g", "mL"] as const;
export const growthOptions = [{ value: "Absent", label: "Absent" }, { value: "Present", label: "Present" }] as const;

export interface Dilution { sample: number | null; sampleUnit: string | null; diluent: number | null; factor: number }
export interface Incubation { temperature: number; hours: number; startedAt: string; endedAt: string | null }
export interface ColonyCount { plates: number[]; tooNumerousToCount: boolean }
export interface Cfu { average: number | null; factor: number; result: number | null; tooNumerousToCount: boolean; unit: string }

function object(raw: string | null | undefined): Record<string, unknown> | null {
  if (!raw?.trim()) return null;
  try { const value: unknown = JSON.parse(raw); return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null; } catch { return null; }
}
const number = (value: unknown) => typeof value === "number" && Number.isFinite(value) ? value : typeof value === "string" && value.trim() && Number.isFinite(Number(value)) ? Number(value) : null;
const text = (value: unknown) => typeof value === "string" && value.trim() ? value.trim() : null;
const date = (value: unknown) => { const raw = text(value); return raw && !Number.isNaN(new Date(raw).getTime()) ? raw : null; };

export function readDilution(raw: string | null | undefined): Dilution | null {
  const root = object(raw); const factor = number(root?.factor);
  if (!root || factor === null || factor <= 0) return null;
  const sample = number(root.sample); const diluent = number(root.diluent);
  if ((sample ?? 0) < 0 || (diluent ?? 0) < 0) return null;
  return { sample, sampleUnit: text(root.sampleUnit), diluent, factor };
}
export function readIncubation(raw: string | null | undefined): Incubation | null {
  const root = object(raw); const temperature = number(root?.temperature); const hours = number(root?.hours); const startedAt = date(root?.startedAt);
  if (!root || temperature === null || hours === null || hours <= 0 || !startedAt) return null;
  return { temperature, hours, startedAt, endedAt: date(root.endedAt) };
}
export function readColonyCount(raw: string | null | undefined): ColonyCount | null {
  const root = object(raw); if (!root) return null;
  const tooNumerousToCount = root.tooNumerousToCount === true;
  const plates = Array.isArray(root.plates) ? root.plates : [];
  if (plates.some((item) => typeof item !== "number" || !Number.isInteger(item) || item < 0)) return null;
  return tooNumerousToCount || plates.length > 0 ? { plates: plates as number[], tooNumerousToCount } : null;
}
export function readCfu(raw: string | null | undefined): Cfu | null {
  const root = object(raw); const factor = number(root?.factor); const unit = text(root?.unit);
  if (!root || factor === null || factor <= 0 || !unit) return null;
  const tooNumerousToCount = root.tooNumerousToCount === true; const result = number(root.result);
  if (!tooNumerousToCount && result === null) return null;
  return { average: number(root.average), factor, result, tooNumerousToCount, unit };
}

export const averageCount = (count: ColonyCount) => count.tooNumerousToCount || count.plates.length === 0 ? null : count.plates.reduce((sum, item) => sum + item, 0) / count.plates.length;
/** Average plate count × dilution factor, as the server calculates it. */
export function calculateCfu(count: ColonyCount, dilution: Dilution, unit: string): Cfu {
  const average = averageCount(count);
  return { average, factor: dilution.factor, result: average === null ? null : average * dilution.factor, tooNumerousToCount: count.tooNumerousToCount, unit };
}

const round = (value: number) => Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.?0+$/, "");
/** How each microbial answer reads in worksheets, prints and certificates. */
export function describe(type: number, raw: string | null | undefined): string | null {
  switch (type) {
    case 15: return raw?.trim() ? organismName(raw.trim()) : null;
    case 16: { const value = readDilution(raw); if (!value) return null; const parts = value.sample !== null && value.diluent !== null ? `${round(value.sample)} ${value.sampleUnit ?? ""} in ${round(value.diluent)} mL · ` : ""; return `${parts}1 in ${round(value.factor)}`.replace(/\s+/g, " "); }
    case 17: { const value = readIncubation(raw); if (!value) return null; return `${round(value.temperature)} °C for ${round(value.hours)} h${value.endedAt ? "" : " (in progress)"}`; }
    case 18: { const value = readColonyCount(raw); if (!value) return null; if (value.tooNumerousToCount) return "Too numerous to count"; const average = averageCount(value); return `${value.plates.map((item) => `${String(item)} cfu`).join(", ")}${average === null ? "" : ` · average ${round(average)}`}`; }
    case 19: { const value = readCfu(raw); if (!value) return null; return value.tooNumerousToCount ? `Too numerous to count (${value.unit})` : `${round(value.result ?? 0)} ${value.unit}`; }
    case 20: return raw?.trim() || null;
    default: return null;
  }
}

export const MicrobialLimitKind = { NotMoreThan: 0, Absent: 1 } as const;
export type MicrobialLimitKind = (typeof MicrobialLimitKind)[keyof typeof MicrobialLimitKind];
export interface MicrobialLimit { formFieldId: string; kind: MicrobialLimitKind; value: number | null; unit: string | null; organism: string | null; quantity: number | null; quantityUnit: string | null }
/** The limit as printed: "NMT 1000 cfu/g" or "Absence of Escherichia coli in 1 g". */
export const limitText = (limit: Pick<MicrobialLimit, "kind" | "value" | "unit" | "organism" | "quantity" | "quantityUnit">) => limit.kind === MicrobialLimitKind.NotMoreThan
  ? `NMT ${round(limit.value ?? 0)} ${limit.unit ?? ""}`.trim()
  : `Absence of ${organismName(limit.organism)} in ${round(limit.quantity ?? 0)} ${limit.quantityUnit ?? ""}`.trim();
export type Verdict = "complies" | "does-not-comply" | "unresolved";
/** The same verdict the server applies when the certificate is checked. */
export function evaluate(limit: MicrobialLimit, raw: string | null | undefined): Verdict {
  if (limit.kind === MicrobialLimitKind.Absent) return raw?.trim() === "Absent" ? "complies" : raw?.trim() === "Present" ? "does-not-comply" : "unresolved";
  const cfu = readCfu(raw);
  if (!cfu || cfu.unit !== limit.unit) return "unresolved";
  if (cfu.tooNumerousToCount) return "does-not-comply";
  return (cfu.result ?? Infinity) <= (limit.value ?? -1) ? "complies" : "does-not-comply";
}
