type InputLabel = { key: string; label?: string | undefined };
type LabelContext = {
  concentrationUnit?: string | undefined;
  standardInputs?: readonly InputLabel[] | undefined;
  sampleInputs?: readonly (readonly InputLabel[])[] | undefined;
};

const descriptions: Readonly<Record<string, string>> = {
  Weight: "Weight", Conc: "Concentration", Absorbance: "Absorbance",
  PeakAreas: "Peak Areas", TitreValue: "Titre Value",
  Avg: "Average", SD: "Standard Deviation", RSD: "Relative Standard Deviation",
};

/** Display defaults only. Does not declare, bind, convert or evaluate a variable. */
export function testVariableLabel(key: string, label?: string | null, context?: LabelContext | null): string {
  if (label?.trim() && label.trim() !== key) return label.trim();
  const match = /^(standard|sample)(\d*)(Weight|Conc|Absorbance|PeakAreas|TitreValue|Avg|SD|RSD)$/.exec(key);
  if (!match) return key;
  const role = match[1] === "standard" ? "Standard" : "Sample";
  const sample = match[2] ?? "";
  const suffix = match[3] ?? "";
  let description = descriptions[suffix] ?? suffix;
  if (suffix === "Weight") {
    const inputs = role === "Standard" ? context?.standardInputs : context?.sampleInputs?.[sample ? Number(sample) - 1 : 0];
    const configured = inputs?.find(input => /^(wt|weight)$/i.test(input.key))?.label;
    if (configured?.trim()) description = configured.trim();
  }
  if (suffix === "Conc" && context?.concentrationUnit)
    description += ` (${context.concentrationUnit})`;
  return `${role}${sample ? ` ${sample}` : ""} ${description}`;
}
