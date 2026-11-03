import { ItemLinesEditor, type ItemLine } from "./item-lines";
import { inventoryLineProblems, type ItemLineRules } from "./item-line-schema";
import type { Store } from "./stores";
import { useItemChoices } from "./use-item-choices";

/** Shared presentation for the two requisition forms' lazy custom fields. */
export function InventoryLinesField({ id, invalid, describedBy, lines, onChange, store, audit, rules, showErrors, disabled }: {
  id: string; invalid: boolean; describedBy?: string | undefined;
  lines: ItemLine[]; onChange: (lines: ItemLine[]) => void; store: Store; audit: { module: string; subModule: string };
  rules: ItemLineRules; showErrors: boolean; disabled: boolean;
}) {
  const items = useItemChoices(store, audit);
  return <fieldset id={id} aria-labelledby={`${id}-label`} aria-invalid={invalid} aria-describedby={describedBy} disabled={disabled} className="min-w-0">
    <ItemLinesEditor lines={lines} onChange={onChange} loadItems={items.loadOptions} label={items.label} lookup={items.lookup}
      problems={showErrors ? inventoryLineProblems(lines, rules) : new Map()} />
  </fieldset>;
}
