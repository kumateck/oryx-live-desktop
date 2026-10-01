import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDraft } from "../hooks/use-draft";
import { parseNumberInput } from "../lib/row-updates";

interface CellBase { label: string; disabled?: boolean; invalid?: boolean }

export function EditableTextCell({ value, onCommit, label, disabled, invalid, placeholder }: CellBase & {
  value: string | null | undefined;
  onCommit: (value: string) => void;
  placeholder?: string;
}) {
  const draft = useDraft(value ?? "", (text) => onCommit(text.trim()));
  return <Input aria-label={label} aria-invalid={invalid || undefined} disabled={disabled} placeholder={placeholder} className="h-8"
    value={draft.value} onChange={(event) => draft.onChange(event.target.value)} onBlur={draft.onBlur} onKeyDown={draft.onKeyDown} />;
}

export function EditableNumberCell({ value, onCommit, label, disabled, invalid, min, max, placeholder, prefix }: CellBase & {
  value: number | null | undefined;
  /** Null when the field was cleared or the entry was not a number. */
  onCommit: (value: number | null) => void;
  min?: number;
  max?: number;
  placeholder?: string;
  /** Shown before the number, such as a currency code. Not part of the value. */
  prefix?: string;
}) {
  const saved = value === null || value === undefined || !Number.isFinite(value) ? "" : String(value);
  const draft = useDraft(saved, (text) => onCommit(parseNumberInput(text, { min, max })));
  // A text input with a decimal keypad: type="number" changes value on scroll and hides bad input.
  const input = <Input aria-label={label} aria-invalid={invalid || undefined} disabled={disabled} placeholder={placeholder} inputMode="decimal"
    className="h-8 min-w-0 text-right tabular-nums" value={draft.value} onChange={(event) => draft.onChange(event.target.value)}
    onBlur={draft.onBlur} onKeyDown={draft.onKeyDown} />;
  return prefix ? <span className="flex min-w-0 items-center gap-1.5"><span aria-hidden="true" className="shrink-0 text-xs text-muted-foreground">{prefix}</span>{input}</span> : input;
}

export function EditableSelectCell({ value, onCommit, label, disabled, invalid, options, placeholder = "Select" }: CellBase & {
  value: string | null | undefined;
  onCommit: (value: string) => void;
  options: readonly { value: string; label: string }[];
  placeholder?: string;
}) {
  const known = options.some((option) => option.value === value);
  return <Select value={known && value ? value : ""} onValueChange={onCommit} {...(disabled ? { disabled } : {})}>
    <SelectTrigger size="sm" aria-label={label} aria-invalid={invalid || undefined} className="h-8 w-full"><SelectValue placeholder={placeholder} /></SelectTrigger>
    <SelectContent>{options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
  </Select>;
}
