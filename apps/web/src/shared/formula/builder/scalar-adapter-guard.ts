// This adapter cannot yet preserve worksheet execution semantics. Never flatten them silently.
export const assertScalarAdapterSupported = (
  config: Record<string, unknown>,
  presentationPreset: string,
): void => {
  const preset = presentationPreset.trim().toLowerCase();
  const type = config.type === undefined ? undefined : Number(config.type);
  const worksheetKeys = [
    "tableData",
    "headers",
    "table",
    "tables",
    "standardInputs",
    "sampleInputs",
    "standardInTable",
    "formulaInTable",
    "avgAllResults",
    "numberOfSamples",
    "readings",
    "samples",
    "constants",
    "derivedValues",
  ];
  const carriesValue = (value: unknown): boolean => {
    if (
      value === null ||
      value === undefined ||
      value === false ||
      value === ""
    )
      return false;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "object") return Object.keys(value).length > 0;
    return true;
  };
  const worksheetKey = worksheetKeys.find(
    (key) => Object.hasOwn(config, key) && carriesValue(config[key]),
  );
  if (
    preset !== "simple" ||
    (type !== undefined && type !== 0) ||
    worksheetKey
  ) {
    throw new Error(
      "This configuration requires worksheet/source-aware execution, which is not yet connected " +
        "to the governed scalar adapter. No formula has been saved or converted. " +
        "Existing definitions are preserved; table statistics must not be replaced with manual scalar inputs.",
    );
  }
};
