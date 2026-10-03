import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CollectionDefinition } from "../lib/collections";

export function CollectionPicker({ definitions, selected, onSelect }: {
  definitions: readonly CollectionDefinition[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  const groups = [...new Set(definitions.map((item) => item.group))];
  return <Select value={selected} onValueChange={onSelect}>
    <SelectTrigger aria-label="Choose collection" className="w-full sm:w-64"><SelectValue placeholder="Choose collection" /></SelectTrigger>
    <SelectContent position="popper">
      {groups.map((group) => <SelectGroup key={group}>
        <SelectLabel>{group}</SelectLabel>
        {definitions.filter((item) => item.group === group).map((item) => <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>)}
      </SelectGroup>)}
    </SelectContent>
  </Select>;
}
