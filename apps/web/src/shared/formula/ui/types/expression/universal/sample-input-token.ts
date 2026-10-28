type SampleInputTokenContext = {
  sampleIndex?: number | undefined;
  headers: string[];
  inputVariables: Record<string, string | number>;
};

const toNumericToken = (value: string | number | undefined) => {
  if (value === "" || value === undefined) return null;
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? String(numeric) : null;
};

export const getSampleNumber = (headers: string[], sampleIndex?: number) => {
  if (typeof sampleIndex !== "number") return null;
  const headerMatch = headers[sampleIndex]?.match(/sample\s*(\d+)/i);
  return headerMatch ? Number(headerMatch[1]) : sampleIndex + 1;
};

export const resolveBareSampleInput = (
  varName: string,
  context: SampleInputTokenContext,
) => {
  if (varName.toLowerCase() !== "sampleinput") return null;
  const sampleNumber = getSampleNumber(context.headers, context.sampleIndex);
  if (sampleNumber === null) return null;
  const prefix = `sampleInput${sampleNumber}.`;
  const matches = Object.entries(context.inputVariables).filter(([key]) =>
    key.startsWith(prefix),
  );
  return matches.length === 1 ? toNumericToken(matches[0]?.[1]) : null;
};
