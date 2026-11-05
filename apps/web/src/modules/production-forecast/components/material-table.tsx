import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "cn";
import { showQuantity } from "../lib/forecast";
import type { ForecastMaterial } from "../schemas/forecast";

/** One product's raw or packaging materials: one batch, all planned batches, and what the warehouse can cover. */
export function MaterialTable({ title, materials, batchCount }: { title: string; materials: ForecastMaterial[]; batchCount: number }) {
  if (materials.length === 0) return <div className="space-y-1"><h3 className="text-sm font-semibold">{title}</h3>
    <p className="text-sm text-muted-foreground">No materials could be forecast. See the notes above.</p></div>;
  return <div className="space-y-1">
    <h3 className="text-sm font-semibold">{title}</h3>
    <Table aria-label={title}>
      <TableHeader><TableRow>
        <TableHead>Material</TableHead><TableHead className="text-right">1 batch</TableHead>
        <TableHead className="text-right">All batches</TableHead><TableHead className="text-right">Already reserved</TableHead>
        <TableHead className="text-right">Can satisfy</TableHead><TableHead className="text-right">Batches covered</TableHead>
        <TableHead className="text-right">Shortfall</TableHead>
      </TableRow></TableHeader>
      <TableBody>{materials.map((material) => {
        const short = material.shortfallQuantity > 0;
        return <TableRow key={material.materialId} data-short={short || undefined} className={cn(short && "bg-destructive/5")}>
          <TableCell className="whitespace-normal">
            <div className="break-words font-medium">{material.materialName}</div>
            <div className="text-xs text-muted-foreground">{material.materialCode || "No code"}
              {material.sharedWithProducts > 0 ? ` · also needed by ${material.sharedWithProducts} other ${material.sharedWithProducts === 1 ? "product" : "products"}` : ""}</div>
          </TableCell>
          <TableCell className="text-right">{showQuantity(material.perBatchQuantity, material.unit)}{material.perBatchQuantityVaries ? <div className="text-xs text-muted-foreground">varies by batch</div> : null}</TableCell>
          <TableCell className="text-right">{showQuantity(material.totalQuantity, material.unit)}<div className="text-xs text-muted-foreground">{material.batchCount} {material.batchCount === 1 ? "batch" : "batches"}</div></TableCell>
          <TableCell className="text-right">{material.reservedQuantity > 0 ? showQuantity(material.reservedQuantity, material.unit) : "–"}</TableCell>
          <TableCell className="text-right">{showQuantity(material.canSatisfyQuantity, material.unit)}<div className="text-xs text-muted-foreground">{showQuantity(material.freeInWarehouse, material.unit)} free in store</div></TableCell>
          <TableCell className={cn("text-right font-medium", material.batchesSatisfiable < batchCount && "text-destructive")}>{material.batchesSatisfiable} of {batchCount}</TableCell>
          <TableCell className={cn("text-right", short ? "font-medium text-destructive" : "text-muted-foreground")}>{short ? showQuantity(material.shortfallQuantity, material.unit) : "None"}</TableCell>
        </TableRow>;
      })}</TableBody>
    </Table>
  </div>;
}
