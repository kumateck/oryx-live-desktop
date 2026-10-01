/** "FinalPackingAndPartialReturn" becomes "Final packing and partial return". */
export function sentenceCase(value: string | null | undefined): string {
  const words = (value ?? "").replace(/[_-]+/g, " ").replace(/([a-z0-9])([A-Z])/g, "$1 $2").trim().toLowerCase();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : "";
}
