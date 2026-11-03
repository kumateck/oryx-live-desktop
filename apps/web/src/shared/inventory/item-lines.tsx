import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AsyncOptionPicker } from "@/shared/forms/async-option-picker";
import type { SelectLoader } from "@/shared/forms/form-wizard-types";
import type { ItemChoice } from "./use-item-choices";

import { newItemLine, type ItemLine } from "./item-line-model";
export { itemLineProblems, newItemLine, type ItemLine } from "./item-line-model";

const unit = (item: ItemChoice | null) => item?.unitSymbol || item?.unitName || "";

/** Editable requisition lines: an item searched in the store, its code and stock, and the quantity wanted. */
export function ItemLinesEditor({ lines, onChange, loadItems, label, lookup, problems, showStock = true }: {
  lines: readonly ItemLine[]; onChange: (lines: ItemLine[]) => void; loadItems: SelectLoader; label: (item: ItemChoice) => string;
  lookup: (id: string) => ItemChoice | null; problems: ReadonlyMap<string, string>; showStock?: boolean;
}) {
  const update = (key: string, change: Partial<ItemLine>) => onChange(lines.map((line) => line.key === key ? { ...line, ...change } : line));
  return <section aria-label="Items" className="space-y-2">
    <div className="max-w-full overflow-x-auto"><table className="w-full min-w-[44rem] text-left text-sm">
      <thead className="border-b text-xs text-muted-foreground"><tr>
        <th scope="col" className="p-2">Item</th><th scope="col" className="w-28 p-2">Code</th>{showStock ? <th scope="col" className="w-28 p-2">In stock</th> : null}
        <th scope="col" className="w-40 p-2">Quantity</th><th scope="col" className="w-10 p-2"><span className="sr-only">Remove</span></th></tr></thead>
      <tbody>{lines.map((line, index) => {
        const problem = problems.get(line.key);
        const number = String(index + 1);
        return <tr key={line.key} className="border-b align-top last:border-0">
          <td className="p-2"><AsyncOptionPicker label={`Item for line ${number}`} placeholder="Search for an item" loadOptions={loadItems}
              value={line.item ? { value: line.item.id, label: label(line.item) } : null} onChange={(option) => update(line.key, { item: lookup(option.value) })} />
            {problem ? <p role="alert" className="mt-1 text-xs text-destructive">{problem}</p> : null}</td>
          <td className="p-2 font-mono text-xs">{line.item?.code ?? "–"}</td>
          {showStock ? <td className="p-2">{line.item ? `${String(line.item.available)} ${unit(line.item)}`.trim() : "–"}</td> : null}
          <td className="p-2"><div className="flex items-center gap-2"><Input aria-label={`Quantity for line ${number}`} inputMode="decimal" value={line.quantity}
            aria-invalid={problem ? true : undefined} onChange={(event) => update(line.key, { quantity: event.target.value })} className="w-24" />
            <span className="text-xs text-muted-foreground">{unit(line.item)}</span></div></td>
          <td className="p-2"><Button type="button" size="icon" variant="ghost" aria-label={`Remove line ${number}`} disabled={lines.length === 1}
            onClick={() => onChange(lines.filter((l) => l.key !== line.key))}><Trash2 /></Button></td>
        </tr>;
      })}</tbody></table></div>
    <Button type="button" size="sm" variant="outline" onClick={() => onChange([...lines, newItemLine()])}><Plus />Add item</Button>
    {problems.get("") ? <p role="alert" className="text-sm text-destructive">{problems.get("")}</p> : null}
  </section>;
}
