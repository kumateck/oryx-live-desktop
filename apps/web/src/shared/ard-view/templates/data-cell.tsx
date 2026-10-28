// A helper component for individual data fields to reduce repetition
// A helper component for each cell in the grid

import { cn } from "@/shared/ard-view/legacy";
import type { CSSProperties } from "react";

interface DataCellProps {
  label: string;
  value: string | number | undefined | null;
  valueClassName?: string | undefined;
  labelClassName?: string | undefined;
  isMultiLine?: boolean | undefined;
  rowSpan?: number | undefined;
  colSpan?: number | undefined;
  className?: string | undefined;
}
const DataCell = ({
  label,
  value,
  valueClassName = "",
  labelClassName = "",
  isMultiLine = false,
  rowSpan,
  colSpan,
  className = "",
}: DataCellProps) => {
  const gridSpanStyle: CSSProperties = {
    ...(rowSpan ? { gridRow: `span ${rowSpan} / span ${rowSpan}` } : {}),
    ...(colSpan ? { gridColumn: `span ${colSpan} / span ${colSpan}` } : {}),
  };

  return (
    <div className={cn("p-2", className)} style={gridSpanStyle}>
      <span className={cn("font-semibold", labelClassName)}>{label}</span>
      {isMultiLine ? (
        <div className={cn(valueClassName)}>{value || "-"}</div>
      ) : (
        <span className={cn("ml-2", valueClassName)}>{value || "-"}</span>
      )}
    </div>
  );
};
export default DataCell;
