import { Columns3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export interface ToggleColumn { id: string; label: string; visible: boolean; canHide: boolean }

export function ColumnToggle({ columns, onToggle, onReset }: {
  columns: readonly ToggleColumn[];
  onToggle: (id: string, visible: boolean) => void;
  onReset: () => void;
}) {
  const shown = columns.filter((column) => column.visible).length;
  return <DropdownMenu>
    <DropdownMenuTrigger asChild><Button type="button" size="sm" variant="outline"><Columns3 aria-hidden="true" />Columns</Button></DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="max-h-80 w-56 overflow-y-auto">
      <DropdownMenuLabel>Show columns</DropdownMenuLabel>
      {columns.filter((column) => column.canHide).map((column) =>
        // The last visible column cannot be hidden: an empty table gives the user no way back.
        <DropdownMenuCheckboxItem key={column.id} checked={column.visible} disabled={column.visible && shown <= 1}
          onSelect={(event) => event.preventDefault()} onCheckedChange={(checked) => onToggle(column.id, checked === true)}>
          {column.label}</DropdownMenuCheckboxItem>)}
      <DropdownMenuSeparator />
      <DropdownMenuCheckboxItem checked={false} disabled={shown === columns.length} onSelect={onReset}>Show all</DropdownMenuCheckboxItem>
    </DropdownMenuContent>
  </DropdownMenu>;
}
