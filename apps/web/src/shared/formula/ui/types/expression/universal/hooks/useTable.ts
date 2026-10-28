import { useState, useCallback, useMemo } from "react";
import { CellData, ColumnStats } from "../types";
import { calculateStats } from "../../../utils";
import { buildFormulaTableVariables } from "../table-variables";
import { roundHalfAwayFromZero } from "../decimal-policy";

/**
 * Helper to create a slug for headers (used in cell variable names)
 * Rules:
 *  - Lowercase
 *  - Remove non-alphanumeric characters (no underscores)
 *  - Example: "Sample 1" -> "sample1", "Blank" -> "blank"
 */
export const headerToSlug = (h: string): string =>
  h
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, "")
    .trim();

export function useTableData(
  initialHeaders: string[] = [],
  initialData: CellData = [],
  standardInTable = true,
  inputDecimalPlaces = 12,
  tableCalculationDecimalPlaces = 12,
) {
  const [headers, setHeaders] = useState<string[]>(
    initialHeaders.length > 0
      ? initialHeaders
      : ["Standard", "Sample 1", "Sample 2"],
  );

  const [data, setData] = useState<CellData>(() => {
    if (initialData.length > 0) return initialData;
    return Array(5)
      .fill(null)
      .map(() => Array(initialHeaders.length || 3).fill(""));
  });

  const updateHeader = useCallback((colIdx: number, value: string) => {
    setHeaders((prev) => {
      const next = [...prev];
      next[colIdx] = value;
      return next;
    });
  }, []);

  // Allow scientific notation as well as plain decimals
  const updateCell = useCallback(
    (row: number, col: number, value: string) => {
      const fraction = value.split(/[eE]/, 1)[0]?.split(".")[1] ?? "";
      if (
        (value === "" || /^-?\d*\.?\d*(e[+-]?\d+)?$/i.test(value)) &&
        fraction.length <= inputDecimalPlaces
      ) {
        setData((prev) => {
          const next = prev.map((r) => [...r]);
          (next[row] ?? [])[col] = value;
          return next;
        });
      }
    },
    [inputDecimalPlaces],
  );

  const addSample = useCallback(() => {
    const existing = headers.filter((h) => /^Sample\s*\d+/i.test(h)).length;
    const newSampleName = `Sample ${existing + 1}`;
    setHeaders((prev) => [...prev, newSampleName]);
    setData((prev) => prev.map((row) => [...row, ""]));
  }, [headers]);

  const removeSample = useCallback(
    (colIdx: number) => {
      if (colIdx === 0) return;
      if (headers.length <= 2) return;
      setHeaders((prev) => prev.filter((_, i) => i !== colIdx));
      setData((prev) => prev.map((row) => row.filter((_, i) => i !== colIdx)));
    },
    [headers.length],
  );

  const addReading = useCallback(() => {
    const newRow = Array(headers.length).fill("");
    setData((prev) => [...prev, newRow]);
  }, [headers.length]);

  const removeReading = useCallback(
    (rowIdx: number) => {
      if (data.length <= 1) return;
      setData((prev) => prev.filter((_, i) => i !== rowIdx));
    },
    [data.length],
  );

  const stats = useMemo((): ColumnStats[] => {
    return headers.map((_, colIdx) => {
      const values = data
        .map((row) => row[colIdx])
        .filter((v) => v !== "" && !isNaN(Number(v)))
        .map((v) => Number(v));
      const calculated = calculateStats(values);
      return {
        avg: roundHalfAwayFromZero(
          calculated.avg,
          tableCalculationDecimalPlaces,
        ),
        sd: roundHalfAwayFromZero(calculated.sd, tableCalculationDecimalPlaces),
        rsd: roundHalfAwayFromZero(
          calculated.rsd,
          tableCalculationDecimalPlaces,
        ),
      };
    });
  }, [data, headers, tableCalculationDecimalPlaces]);

  const tableVars = useMemo(
    () => buildFormulaTableVariables(stats, standardInTable),
    [stats, standardInTable],
  );

  const updateTableData = useCallback(
    (newHeaders: string[], newData: CellData) => {
      setHeaders(newHeaders);
      setData(newData);
    },
    [],
  );

  return {
    headers,
    data,
    stats,
    tableVars,
    updateHeader,
    updateCell,
    addSample,
    removeSample,
    addReading,
    removeReading,
    updateTableData,
    headerToSlug,
  };
}
