import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { filterProblem, noFilters, type IssuedFilters } from "../lib/filters";

const all = "all";

/** Department and issue-date filters for the issued records and their printouts. */
export function IssuedFiltersBar({ filters, departments, onChange }: {
  filters: IssuedFilters; departments: readonly { value: string; label: string }[]; onChange: (filters: IssuedFilters) => void;
}) {
  const problem = filterProblem(filters);
  const active = filters.departmentId || filters.from || filters.to;
  return <div className="space-y-1">
    <div className="flex flex-wrap items-end gap-3">
      <div className="space-y-1"><Label htmlFor="issued-department">Department</Label>
        <Select value={filters.departmentId || all} onValueChange={(value) => onChange({ ...filters, departmentId: value === all ? "" : value })}>
          <SelectTrigger id="issued-department" className="w-60"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value={all}>All departments</SelectItem>
            {departments.map((department) => <SelectItem key={department.value} value={department.value}>{department.label}</SelectItem>)}</SelectContent>
        </Select></div>
      <div className="space-y-1"><Label htmlFor="issued-from">Issued from</Label>
        <Input id="issued-from" type="date" className="w-40" value={filters.from} onChange={(event) => onChange({ ...filters, from: event.target.value })} /></div>
      <div className="space-y-1"><Label htmlFor="issued-to">Issued to</Label>
        <Input id="issued-to" type="date" className="w-40" value={filters.to} aria-invalid={Boolean(problem)} onChange={(event) => onChange({ ...filters, to: event.target.value })} /></div>
      {active ? <Button type="button" variant="ghost" size="sm" onClick={() => onChange(noFilters)}><X />Clear filters</Button> : null}
    </div>
    {problem ? <p role="alert" className="text-sm text-destructive">{problem}</p> : null}
  </div>;
}
