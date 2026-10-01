/** Turns "unitPrice" or "unit_price" into "Unit price" for columns whose header is not plain text. */
export function columnLabel(id: string): string {
  const words = id.replace(/[_-]+/g, " ").replace(/([a-z0-9])([A-Z])/g, "$1 $2").trim().toLowerCase();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : id;
}
