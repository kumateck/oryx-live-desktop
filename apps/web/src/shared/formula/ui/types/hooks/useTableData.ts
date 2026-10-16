import { useState, useCallback, useMemo } from "react";
import { CellData, ColumnStats } from "../type";
import { calculateStats } from "../utils";

/**
 * Manage table data for complex formulas
 */
export function useTableData(
  initialHeaders: string[] = [],
  initialData: CellData = [],
) {
  const [headers, setHeaders] = useState<string[]>(
    initialHeaders.length > 0
      ? initialHeaders
      : ["Standard", "Sample 1", "Sample 2"],
  );

  const [data, setData] = useState<CellData>(() => {
    if (initialData.length > 0) return initialData;

    // Default empty data grid
    return Array(5)
      .fill(null)
      .map(() => Array(initialHeaders.length || 3).fill(""));
  });

  // Update a header value
  const updateHeader = useCallback((colIdx: number, value: string) => {
    setHeaders((prev) => {
      const next = [...prev];
      next[colIdx] = value;
      return next;
    });
  }, []);

  // // Update a cell value
  // const updateCell = useCallback((row: number, col: number, value: string) => {
  //   setData((prev) => {
  //     const next = prev.map((r) => [...r]);
  //     (next[row] ?? [])[col] = value;
  //     return next;
  //   });
  // }, []);
  // Update the updateCell function
  const updateCell = useCallback((row: number, col: number, value: string) => {
    // Accept empty string or valid numeric input
    if (value === "" || /^-?\d*\.?\d*$/.test(value)) {
      setData((prev) => {
        const next = prev.map((r) => [...r]);
        (next[row] ?? [])[col] = value;
        return next;
      });
    }
  }, []);
  // Add a new sample column
  const addSample = useCallback(() => {
    const sampleCount = headers.length;
    const newSampleName = `Sample ${sampleCount}`;

    setHeaders((prev) => [...prev, newSampleName]);
    setData((prev) => prev.map((row) => [...row, ""]));
  }, [headers.length]);

  // Remove a sample column
  const removeSample = useCallback(
    (colIdx: number) => {
      if (colIdx === 0) return; // Cannot remove standard
      if (headers.length <= 2) return; // Keep at least standard + 1 sample

      setHeaders((prev) => prev.filter((_, i) => i !== colIdx));
      setData((prev) => prev.map((row) => row.filter((_, i) => i !== colIdx)));
    },
    [headers.length],
  );

  // Add a new reading row
  const addReading = useCallback(() => {
    const newRow = Array(headers.length).fill("");
    setData((prev) => [...prev, newRow]);
  }, [headers.length]);

  // Remove a reading row
  const removeReading = useCallback(
    (rowIdx: number) => {
      if (data.length <= 1) return; // Keep at least 1 row

      setData((prev) => prev.filter((_, i) => i !== rowIdx));
    },
    [data.length],
  );

  // Calculate column statistics
  const stats = useMemo((): ColumnStats[] => {
    return headers.map((_, colIdx) => {
      const values = data
        .map((row) => row[colIdx])
        .filter((v) => v !== "" && !isNaN(Number(v)))
        .map((v) => Number(v));
      return calculateStats(values);
    });
  }, [data, headers]);

  // Generate table variable map
  const tableVars = useMemo((): Record<string, number | null> => {
    const vars: Record<string, number | null> = {
      standardAvg: stats[0]?.avg ?? null,
      standardSD: stats[0]?.sd ?? null,
      standardRSD: stats[0]?.rsd ?? null,
    };

    // Add sample stats
    for (let i = 1; i < headers.length; i++) {
      vars[`sample${i}Avg`] = stats[i]?.avg ?? null;
      vars[`sample${i}SD`] = stats[i]?.sd ?? null;
      vars[`sample${i}RSD`] = stats[i]?.rsd ?? null;
    }

    return vars;
  }, [stats, headers]);

  // Add this new method to update both headers and data at once
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
  };
}
