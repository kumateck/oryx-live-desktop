const ones = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
const scales = ["", "thousand", "million", "billion", "trillion"];

function hundreds(value: number): string {
  const parts: string[] = [];
  const hundred = Math.floor(value / 100);
  const rest = value % 100;
  if (hundred) parts.push(`${ones[hundred]} hundred`);
  if (rest) parts.push((hundred ? "and " : "") + (rest < 20 ? ones[rest] : `${tens[Math.floor(rest / 10)]}${rest % 10 ? `-${ones[rest % 10]}` : ""}`));
  return parts.join(" ");
}

/** A whole number in words, British style: 1,204 is "one thousand two hundred and four". */
export function numberInWords(value: number): string {
  const whole = Math.floor(Math.abs(value));
  if (whole === 0) return "zero";
  const groups: string[] = [];
  for (let rest = whole, scale = 0; rest > 0; rest = Math.floor(rest / 1000), scale += 1) {
    const group = rest % 1000;
    if (group) groups.unshift(`${hundreds(group)}${scales[scale] ? ` ${scales[scale]}` : ""}`);
  }
  // "one thousand and four": the last group takes "and" when it has no hundreds of its own.
  const last = whole % 1000;
  if (groups.length > 1 && last > 0 && last < 100) groups[groups.length - 1] = `and ${groups[groups.length - 1]}`;
  return groups.join(" ");
}

/**
 * An amount of money written out for a document, to two decimals: "Twelve thousand five hundred US Dollar and 50/100".
 * The fraction is given as hundredths so it reads the same in any currency. Null for an amount that is not a number.
 */
export function amountInWords(amount: number | null | undefined, currency: string | null | undefined): string | null {
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount < 0) return null;
  const cents = Math.round(amount * 100);
  const words = numberInWords(Math.floor(cents / 100));
  const name = currency?.trim();
  const text = `${words}${name ? ` ${name}` : ""}${cents % 100 ? ` and ${String(cents % 100).padStart(2, "0")}/100` : " only"}`;
  return text.charAt(0).toUpperCase() + text.slice(1);
}
