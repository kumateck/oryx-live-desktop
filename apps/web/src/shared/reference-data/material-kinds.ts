export const materialKinds = [
  { value: "0", label: "Raw material" }, { value: "1", label: "Packaging material" },
] as const;
export function materialKind(value: string | undefined): 0 | 1 | null {
  return value === "0" ? 0 : value === "1" ? 1 : null;
}
