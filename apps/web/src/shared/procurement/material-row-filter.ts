export type MaterialRowFilter = "all" | "0" | "1" | "unassigned";
export const materialRowFilters = [
  { value: "all", label: "All materials" },
  { value: "0", label: "Raw materials" },
  { value: "1", label: "Packaging materials" },
  { value: "unassigned", label: "Unassigned" },
] as const;

export function matchesMaterialRow(filter: MaterialRowFilter, kind: string | undefined): boolean {
  if (filter === "all") return true;
  if (filter === "unassigned") return kind !== "0" && kind !== "1";
  return kind === filter;
}
