import { FileX2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/shared/skeleton/skeleton";

const skeletonWidths = ["w-3/4", "w-1/2", "w-2/3", "w-5/6"] as const;

/** Placeholder rows for the first load only; later refetches keep the existing rows on screen. */
export function DataTableSkeleton({ columns, rows }: { columns: number; rows: number }) {
  return Array.from({ length: rows }, (_, row) => <TableRow key={row} aria-hidden="true" className="hover:bg-transparent">
    {Array.from({ length: columns }, (_, column) => <TableCell key={column}>
      <Skeleton className={`h-4 ${skeletonWidths[(row + column) % skeletonWidths.length]}`} />
    </TableCell>)}
  </TableRow>);
}

export function DataTableMessage({ columns, tone, title, description, action }: {
  columns: number;
  tone: "empty" | "error";
  title: string;
  description?: string | null | undefined;
  action?: { label: string; onClick: () => void };
}) {
  const Icon = tone === "error" ? TriangleAlert : FileX2;
  return <TableRow className="hover:bg-transparent"><TableCell colSpan={columns} className="whitespace-normal">
    <div role={tone === "error" ? "alert" : "status"} className="flex flex-col items-center gap-2 py-10 text-center">
      <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground"><Icon aria-hidden="true" className="size-5" /></span>
      <p className="text-sm font-medium">{title}</p>
      {description ? <p className="max-w-md text-xs text-muted-foreground">{description}</p> : null}
      {action ? <Button type="button" size="sm" variant="outline" onClick={action.onClick}>{action.label}</Button> : null}
    </div>
  </TableCell></TableRow>;
}
