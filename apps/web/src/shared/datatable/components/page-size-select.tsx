import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { pageSizeOptions } from "../lib/pagination";

export function PageSizeSelect({ pageSize, sizes, onChange }: {
  pageSize: number;
  sizes: readonly number[] | undefined;
  onChange: (pageSize: number) => void;
}) {
  return <label className="flex items-center gap-2">Rows per page
    <Select value={String(pageSize)} onValueChange={(value) => onChange(Number(value))}>
      <SelectTrigger size="sm" aria-label="Rows per page" className="h-7 w-[4.5rem] text-xs"><SelectValue /></SelectTrigger>
      <SelectContent side="top">{pageSizeOptions(pageSize, sizes).map((size) =>
        <SelectItem key={size} value={String(size)}>{size}</SelectItem>)}</SelectContent>
    </Select>
  </label>;
}
