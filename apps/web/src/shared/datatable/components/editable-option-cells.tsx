import { toggleValue, type CellOption } from "../lib/options";
import { OptionPicker } from "./option-picker";

interface OptionCellBase {
  label: string;
  options: readonly CellOption[];
  disabled?: boolean;
  invalid?: boolean;
  loading?: boolean;
  placeholder?: string;
  emptyText?: string;
}

/** Searchable single choice, for option lists too long for a plain select. */
export function EditableComboboxCell({ value, onCommit, clearable = false, placeholder = "Select", emptyText = "No matching options", ...cell }: OptionCellBase & {
  value: string | null | undefined;
  /** Null when the choice was cleared. */
  onCommit: (value: string | null) => void;
  clearable?: boolean;
}) {
  return <OptionPicker {...cell} placeholder={placeholder} emptyText={emptyText} multiple={false} selected={value ? [value] : []}
    onPick={(next) => { if (next !== value) onCommit(next); }} onClear={clearable ? () => onCommit(null) : null} />;
}

/** Searchable multiple choice. Each change is reported with the complete new set of values. */
export function EditableMultiSelectCell({ values, onCommit, placeholder = "Select", emptyText = "No matching options", ...cell }: OptionCellBase & {
  values: readonly string[] | null | undefined;
  onCommit: (values: string[]) => void;
}) {
  const selected = values ?? [];
  return <OptionPicker {...cell} placeholder={placeholder} emptyText={emptyText} multiple selected={selected}
    onPick={(next) => onCommit(toggleValue(selected, next))} onClear={() => onCommit([])} />;
}
