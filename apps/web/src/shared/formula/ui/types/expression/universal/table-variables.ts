type ColumnStatistic = {
  avg: number | null;
  sd: number | null;
  rsd: number | null;
};

export type FormulaTableVariables = Record<string, number | null>;

export const buildFormulaTableVariables = (
  stats: ColumnStatistic[],
  standardInTable: boolean,
): FormulaTableVariables => {
  const variables: FormulaTableVariables = {
    standardAvg: standardInTable ? (stats[0]?.avg ?? null) : null,
    standardSD: standardInTable ? (stats[0]?.sd ?? null) : null,
    standardRSD: standardInTable ? (stats[0]?.rsd ?? null) : null,
  };
  const firstSampleColumn = standardInTable ? 1 : 0;

  for (
    let columnIndex = firstSampleColumn;
    columnIndex < stats.length;
    columnIndex++
  ) {
    const sampleNumber = columnIndex - firstSampleColumn + 1;
    variables[`sample${sampleNumber}Avg`] = stats[columnIndex]?.avg ?? null;
    variables[`sample${sampleNumber}SD`] = stats[columnIndex]?.sd ?? null;
    variables[`sample${sampleNumber}RSD`] = stats[columnIndex]?.rsd ?? null;
  }

  return variables;
};
