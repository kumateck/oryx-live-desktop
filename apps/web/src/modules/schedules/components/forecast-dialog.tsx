import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { useGetApiV1ProductionScheduleForecastQuery } from "../api/schedule-api";
import { forecastGroups } from "../lib/forecast";
import { audit } from "../lib/schedule-access";
import { halfBatch } from "../lib/schedule-products";
import { forecastSchema } from "../schemas/forecast-schema";
import { ForecastTable } from "./forecast-table";

export interface ForecastRequest { product: { value: string; label: string }; packing: { value: string; label: string }; sizeType: { value: string; label: string }; count: number; market: string | null }

/** The materials a planned product needs for its batches, against what the warehouse can supply. */
export function ForecastDialog({ request, onClose }: { request: ForecastRequest; onClose: () => void }) {
  const query = useGetApiV1ProductionScheduleForecastQuery({ ...audit, productId: request.product.value, productPackingId: request.packing.value,
    batchSize: request.sizeType.value === halfBatch ? 1 : 0, numberOfBatches: request.count });
  const parsed = useMemo(() => query.data ? forecastSchema.safeParse(query.data) : null, [query.data]);
  const groups = useMemo(() => forecastGroups(parsed?.success ? parsed.data : []), [parsed]);
  const error = query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned a forecast the app could not read." : null;
  const loading = query.isLoading;
  const table = { loading, error, onRetry: () => { void query.refetch(); } };
  const facts = [["Batches", `${request.count} × ${request.sizeType.label.toLowerCase()}`], ["Packing style", request.packing.label], ...(request.market ? [["Market type", request.market]] : [])];

  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
    <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-5xl">
      <DialogHeader><DialogTitle>Material forecast for {request.product.label}</DialogTitle>
        <DialogDescription>What these batches need, against usable warehouse stock. Stock already reserved for other batches is shown but not deducted.</DialogDescription></DialogHeader>
      <dl className="flex flex-wrap gap-x-8 gap-y-2 rounded-md bg-muted/50 p-3 text-sm">{facts.map(([label, value]) =>
        <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="font-medium">{value}</dd></div>)}</dl>
      {!loading && !error ? <p role="status" className={groups.short ? "text-sm text-destructive" : "text-sm"}>{groups.short
        ? `${groups.short} ${groups.short === 1 ? "material is" : "materials are"} short. They are listed first.` : "The warehouse has enough of every material."}</p> : null}
      <div className="grid min-w-0 gap-4 xl:grid-cols-2">
        <ForecastTable title="Raw materials" materials={groups.raw} {...table} />
        <ForecastTable title="Packaging materials" materials={groups.packaging} {...table} />
      </div>
      {groups.other.length ? <ForecastTable title="Other materials" materials={groups.other} {...table} /> : null}
      <DialogFooter><Button type="button" variant="outline" onClick={onClose}>Close</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}
