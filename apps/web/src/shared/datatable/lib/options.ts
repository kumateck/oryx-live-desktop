export interface CellOption { value: string; label: string; disabled?: boolean }

export function filterOptions(options: readonly CellOption[], search: string): readonly CellOption[] {
  const term = search.trim().toLocaleLowerCase();
  return term ? options.filter((option) => option.label.toLocaleLowerCase().includes(term)) : options;
}

/**
 * Text for a closed picker. A saved value that is no longer among the options is reported as
 * unavailable rather than shown as blank.
 */
export function selectionSummary(options: readonly CellOption[], selected: readonly string[], multiple: boolean): string | null {
  const chosen = options.filter((option) => selected.includes(option.value));
  const unknown = selected.filter((value) => !options.some((option) => option.value === value)).length;
  if (chosen.length === 0 && unknown === 0) return null;
  if (multiple && chosen.length + unknown > 2) return `${chosen.length + unknown} selected`;
  return [...chosen.map((option) => option.label), ...(unknown ? [`${unknown} unavailable`] : [])].join(", ");
}

/** The complete new set of values after one option is switched on or off. */
export function toggleValue(values: readonly string[], value: string): string[] {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}
