import type { SelectOption } from "./form-wizard-types";

export function isSelectOption(value: object | null | undefined): value is SelectOption {
  return value !== null && value !== undefined && "value" in value && "label" in value
    && typeof value.value === "string" && typeof value.label === "string";
}

export function fitSelectedLabels(widths: readonly number[], availableWidth: number): number {
  let used = 0;
  let visible = 0;
  for (const width of widths) {
    const hidden = widths.length - visible - 1;
    const countWidth = hidden > 0 ? 23 + String(hidden).length * 7 : 0;
    const next = used + Math.max(0, width) + (visible > 0 ? 4 : 0);
    if (next + countWidth > availableWidth) break;
    used = next;
    visible += 1;
  }
  return visible;
}
