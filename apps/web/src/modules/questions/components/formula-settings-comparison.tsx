import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "cn";
import type { SettingRow } from "../lib/formula-settings-comparison";

/**
 * Every setting of the formula the test uses now, beside the approved revision's when there is one: switches, table
 * layout, decimals, counts, constants, manual variables and input fields. Changed settings are marked, so the person
 * repairing sees exactly what the repair changes.
 */
export function FormulaSettingsComparison({ rows, approvedTitle }: { rows: readonly SettingRow[]; approvedTitle: string | null }) {
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">The formula settings could not be read.</p>;
  const changes = rows.filter((row) => row.changed).length;
  return <div className="space-y-2">
    <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-medium">All settings</h3>
      {approvedTitle ? <p className="text-sm text-muted-foreground">{changes ? `${changes} ${changes === 1 ? "setting changes" : "settings change"}` : "No setting changes"}</p> : null}</div>
    <Table aria-label="Formula settings">
      <TableHeader><TableRow><TableHead className="w-48">Setting</TableHead><TableHead>Current</TableHead>{approvedTitle ? <TableHead>{approvedTitle}</TableHead> : null}</TableRow></TableHeader>
      <TableBody>{rows.map((row) => <TableRow key={row.key} data-changed={row.changed || undefined} className={cn(row.changed && "bg-amber-500/10")}>
        <TableCell className="whitespace-normal align-top font-medium">{row.label}{row.changed ? <Badge variant="outline" className="ml-2 border-amber-500/60">Changed</Badge> : null}</TableCell>
        <TableCell className="whitespace-normal break-words align-top">{row.current}</TableCell>
        {approvedTitle ? <TableCell className={cn("whitespace-normal break-words align-top", row.changed && "font-medium")}>{row.approved}</TableCell> : null}
      </TableRow>)}</TableBody>
    </Table>
  </div>;
}
