/** How a record code is produced, as configured per record type in the backend. */
export const namingType = { sequential: 0, random: 1, timestamp: 2 } as const;

export interface CodeRule {
  prefix: string;
  namingType: number;
  minimumLength: number;
  maximumLength: number;
}

/**
 * The next code for a rule. `existingCount` is how many records already use the prefix; a
 * sequential code is the next number, padded to the minimum length. `random` supplies digits for
 * random codes and `now` the timestamp, so results can be tested.
 */
export function generateCode(rule: CodeRule, existingCount: number, random: () => number = Math.random, now: () => number = Date.now): string {
  const minimum = Math.max(0, Math.trunc(rule.minimumLength) || 0);
  const maximum = Math.max(minimum, Math.trunc(rule.maximumLength) || minimum || 1);
  let body: string;
  if (rule.namingType === namingType.timestamp) body = String(now());
  else if (rule.namingType === namingType.random) body = String(random()).slice(2, 2 + maximum);
  else if (rule.namingType === namingType.sequential) body = String(Math.max(0, Math.trunc(existingCount) || 0) + 1);
  else return "";
  const padded = body.padStart(minimum, "0");
  // A number longer than the maximum keeps its last digits, which are the ones that change.
  return `${rule.prefix}${padded.length > maximum ? padded.slice(-maximum) : padded}`;
}
