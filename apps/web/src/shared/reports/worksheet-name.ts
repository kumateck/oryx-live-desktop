/** Excel names are case-insensitive, at most 31 characters, and cannot contain reserved characters. */
export function worksheetName(label: string, used: Set<string>): string {
  const base = [...label].map((character) => "\\/*?:[]".includes(character) ? " " : character).join("").replace(/^'+|'+$/g, "").trim().slice(0, 31) || "Sheet";
  let result = base; let suffix = 1;
  while (used.has(result.toLocaleLowerCase())) { const tail = ` (${suffix++})`; result = `${base.slice(0, 31 - tail.length)}${tail}`; }
  used.add(result.toLocaleLowerCase()); return result;
}
