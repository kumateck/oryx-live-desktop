import type { SelectOption } from "./form-wizard-types";
import { SearchableSelect } from "./searchable-select";

const everything = "\u0000all";

/**
 * A list filter whose first choice is "All …" (no filter). The value is the chosen option's id, or
 * undefined for "All", so a filter bar can switch from a shadcn Select without changing its state.
 */
export function SearchableFilterSelect({ label, all, value, options, onChange, disabled = false, loading = false, size = "sm", className }: {
  label: string;
  all: string;
  value: string | undefined;
  options: readonly SelectOption[];
  onChange: (value: string | undefined) => void;
  disabled?: boolean;
  loading?: boolean;
  size?: "default" | "sm";
  className?: string | undefined;
}) {
  const choices: readonly SelectOption[] = [{ value: everything, label: all }, ...options];
  const chosen = choices.find((option) => option.value === (value ?? everything)) ?? null;
  return <SearchableSelect label={label} size={size} className={className} options={choices} loading={loading} disabled={disabled} clearable={false}
    value={chosen} placeholder={all} searchPlaceholder={`Search ${label.toLocaleLowerCase()}`}
    onChange={(option) => onChange(!option || option.value === everything ? undefined : option.value)} />;
}
