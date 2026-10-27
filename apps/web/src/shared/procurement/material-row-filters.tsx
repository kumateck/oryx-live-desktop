import { Button } from "@/components/ui/button";
import { materialRowFilters, matchesMaterialRow, type MaterialRowFilter } from "./material-row-filter";

/** Filters the displayed rows of an editor; the complete field array remains in the form. */
export function MaterialRowFilters({ kinds, value, onChange }: {
  kinds: readonly (string | undefined)[];
  value: MaterialRowFilter;
  onChange: (value: MaterialRowFilter) => void;
}) {
  const shown = kinds.filter((kind) => matchesMaterialRow(value, kind)).length;
  return <div className="space-y-2">
    <div role="group" aria-label="Filter material rows" className="flex flex-wrap gap-2">
      {materialRowFilters.map((filter) => <Button key={filter.value} type="button" size="sm"
        variant={value === filter.value ? "default" : "outline"} aria-pressed={value === filter.value}
        onClick={() => onChange(filter.value)}>
        {filter.label} ({kinds.filter((kind) => matchesMaterialRow(filter.value, kind)).length})
      </Button>)}
    </div>
    <p role="status" className="text-xs text-muted-foreground">Showing {shown} of {kinds.length} material rows. All rows are included when saving.</p>
    {shown === 0 ? <p className="text-sm text-muted-foreground">{kinds.length ? "No material rows match this filter." : "Add a material to get started."}</p> : null}
  </div>;
}
