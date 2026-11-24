import { testVariableLabel } from "@/shared/formula/display/variable-labels";
import { Plus, Variable } from "lucide-react";
import { DropdownButton } from "@/shared/actions";

export type AvailableVariable = {
  key: string;
  label: string;
  value: number | string | null;
  isTemplate: boolean;
};

type Props = {
  items: readonly AvailableVariable[];
  disabled?: boolean | undefined;
  onInsert: (key: string) => void;
  formatValue: (value: AvailableVariable["value"]) => string;
};

// Presentation only: retain each supplied key, label and value. Never create aliases here.
const inputGroup = (key: string) =>
  /^(standard|sample\d*)(?:Weight|Conc|Absorbance|PeakAreas|TitreValue)$/.exec(key)?.[1];

function VariableSummary({ item, formatValue }: {
  item: AvailableVariable; formatValue: Props["formatValue"];
}) {
  return <>
    <span className="min-w-0 flex-1 text-left">
      <span className="block break-words text-sm font-medium">{item.label.replace(/\s+\(auto\)$/, "")}</span>
      <span className="block break-words text-xs text-muted-foreground">:{item.key}{item.isTemplate ? " · Auto" : ` · ${formatValue(item.value)}`}</span>
    </span>
    <Plus className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
  </>;
}

function VariableAliases({ items, disabled, onInsert, formatValue, group }: Props & { group: string }) {
  const label = group === "standard" ? "standard" : group.replace(/^sample/, "sample ").trim();
  const title = label.charAt(0).toUpperCase() + label.slice(1);
  return <DropdownButton label={`${title} variable (${items.length} aliases)`} icon={Variable}
    align="start" disabled={disabled ?? false}
    items={items.map(item => ({
      id: item.key,
      label: `:${item.key}`,
      description: testVariableLabel(item.key, item.label.replace(/\s+\(auto\)$/, ""))
        + (item.isTemplate ? "" : ` · ${formatValue(item.value)}`),
      // Inserting a token is a local editor action; saving retains the editor's own permissions.
      onSelect: () => onInsert(item.key),
    }))} />;
}

export function AvailableVariables({ items, ...props }: Props) {
  const groups = new Map<string, AvailableVariable[]>();
  for (const item of items) {
    const group = inputGroup(item.key);
    if (group) groups.set(group, [...(groups.get(group) ?? []), item]);
  }
  const rendered = new Set<string>();
  return items.map(item => {
    const group = inputGroup(item.key);
    const aliases = group ? groups.get(group) : undefined;
    if (group && aliases && aliases.length > 1) {
      if (rendered.has(group)) return null;
      rendered.add(group);
      return <VariableAliases key={group} {...props} group={group} items={aliases} />;
    }
    return <button type="button" key={item.key} onClick={() => props.onInsert(item.key)} disabled={props.disabled}
      className="flex w-full items-center gap-2 rounded border border-border bg-muted/30 px-2.5 py-2 text-foreground hover:bg-muted disabled:opacity-50">
      <VariableSummary item={item} formatValue={props.formatValue} />
    </button>;
  });
}
