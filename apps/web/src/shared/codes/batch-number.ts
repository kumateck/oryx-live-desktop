// Product batch numbers: the last letter and digits of the product code, a letter for the year, and a serial ("T12K004").
const yearLetters: Record<number, string> = {
  2018: "A", 2019: "B", 2020: "C", 2021: "D", 2022: "E", 2023: "F", 2024: "G", 2025: "J", 2026: "K", 2027: "L", 2028: "M", 2029: "N",
  2030: "P", 2031: "R", 2032: "S", 2033: "T", 2034: "U", 2035: "V", 2036: "W", 2037: "Y", 2038: "Z",
};

/** "TAB-R012" → "B012". Null when the code is not letters followed by up to three digits. */
function productPart(productCode: string): string | null {
  const match = /^([A-Z]+)-?R?(\d{1,3})$/i.exec(productCode.trim());
  const letters = match?.[1];
  const digits = match?.[2];
  return letters && digits ? `${letters.slice(-1)}${digits}`.toUpperCase() : null;
}

/** What every batch number of a product in a year starts with, or null when it cannot be worked out. */
export function batchPrefix(productCode: string, year: number): string | null {
  const part = productPart(productCode);
  const letter = yearLetters[year];
  return part && letter ? `${part}${letter}` : null;
}

export function batchNumber(productCode: string, year: number, serial: number): string | null {
  const prefix = batchPrefix(productCode, year);
  return prefix ? `${prefix}${String(serial).padStart(3, "0")}` : null;
}
