import { useMemo, useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { productionApi } from "@/shared/api/generated/production";
import { useAccess } from "@/shared/auth/use-access";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDateTime } from "@/shared/format/dates";
import { PageHeader } from "@/shared/navigation/page-header";
import { usePageSearch } from "@/shared/search/page-search";
import { PageSkeleton } from "@/shared/skeleton/page-skeletons";
import { toLargestUnit } from "@/shared/units/quantity";
import { AlternativeBatches, issuePermissions } from "@/modules/stock-issue/public";
import { upcomingAudit as audit, upcomingPageSchema, type ReservedLot, type UpcomingBatch } from "../schemas/upcoming";

const pageSize = 10;
const show = (value: number, unit: string | null) => toLargestUnit(value, unit, "calculated")?.text ?? `${value} ${unit ?? ""}`.trim();

function Lots({ title, lots }: { title: string; lots: readonly ReservedLot[] }) {
  if (lots.length === 0) return null;
  return <div className="space-y-1"><h3 className="text-sm font-semibold">{title}</h3>
    <Table aria-label={title}><TableHeader><TableRow><TableHead>Material</TableHead><TableHead>Lot</TableHead><TableHead>Store and shelf</TableHead><TableHead className="text-right">To pick</TableHead></TableRow></TableHeader>
      <TableBody>{lots.map((lot, index) => <TableRow key={`${lot.materialId}-${lot.lotNumber ?? ""}-${String(index)}`}>
        <TableCell className="whitespace-normal"><div className="break-words font-medium">{lot.materialName ?? "Material"}</div><div className="text-xs text-muted-foreground">{lot.materialCode ?? ""}</div></TableCell>
        <TableCell className="break-all">{lot.lotNumber ?? "–"}</TableCell>
        <TableCell className="whitespace-normal"><div>{lot.warehouse ?? "–"}</div><div className="text-xs text-muted-foreground">{lot.location || "No shelf recorded"}</div></TableCell>
        <TableCell className="text-right font-medium">{show(lot.quantity, lot.unit)}</TableCell>
      </TableRow>)}</TableBody></Table></div>;
}

/** One started batch: what it is, when it started, and the lots reserved for it, with swaps the store may ask for. */
function BatchCard({ batch, mayAsk }: { batch: UpcomingBatch; mayAsk: boolean }) {
  const [swapping, setSwapping] = useState(false);
  const raw = batch.materials.filter((lot) => lot.kind === 0);
  const packaging = batch.materials.filter((lot) => lot.kind === 1);
  return <section aria-label={`${batch.productName ?? "Product"} ${batch.batchNumber ?? ""}`.trim()} className="space-y-3 rounded-lg border bg-card p-4">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0 space-y-1">
        <h2 className="break-words font-semibold">{batch.productName ?? "Product"} <span className="text-sm font-normal text-muted-foreground">{batch.productCode ?? ""}</span></h2>
        <p className="text-sm text-muted-foreground">Schedule {batch.scheduleCode ?? "–"} · Started {formatDateTime(batch.startedAt) ?? "–"} · {show(batch.batchQuantity, batch.batchUnit)}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {batch.batchNumber ? <Badge variant="outline">Batch {batch.batchNumber}</Badge> : <Badge variant="secondary">Batch number not assigned yet</Badge>}
        <Button type="button" size="sm" variant="outline" aria-expanded={swapping} onClick={() => setSwapping((open) => !open)}><ArrowLeftRight />{swapping ? "Hide swaps" : "Earlier batches to swap"}</Button>
      </div>
    </div>
    <Lots title="Raw materials" lots={raw} />
    <Lots title="Packaging materials" lots={packaging} />
    {swapping ? <AlternativeBatches source={{ batchId: batch.productionScheduleProductId }} mayAsk={mayAsk} /> : null}
  </section>;
}

/**
 * Production has started on these batches and their stock is reserved, but their BMR is not issued and no stock is
 * requested yet. The warehouse prepares each lot from here, oldest start first, and can ask for swaps to earlier
 * batches before the requisition arrives.
 */
export function UpcomingBatchIssuesPage() {
  const access = useAccess();
  const search = usePageSearch("products, schedules or batch numbers");
  const [page, setPage] = useState({ key: search, number: 1 });
  const current = page.key === search ? page.number : 1;
  const query = productionApi.useListUpcomingBatchIssuesQuery({ ...audit, page: current, pageSize, searchQuery: search });
  const parsed = useMemo(() => query.data ? upcomingPageSchema.safeParse(query.data) : null, [query.data]);
  const mayAsk = access.allows(issuePermissions[0]) || access.allows(issuePermissions[1]);
  const pages = parsed?.success ? Math.max(1, parsed.data.pageCount ?? 1) : 1;
  const error = query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned batches the app could not read." : null;
  return <section className="min-w-0 space-y-4">
    <PageHeader title="Upcoming batch issues" crumbs={[]} />
    <p className="text-sm text-muted-foreground">Batches whose production has started. Their lots are reserved; prepare them before the stock is requested, and swap to earlier batches where another store holds them.</p>
    {query.isLoading ? <PageSkeleton label="Loading upcoming batches" />
      : error ? <div role="alert" className="flex flex-wrap items-center gap-3 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm"><span>{error}</span><Button type="button" size="sm" variant="outline" onClick={() => void query.refetch()}>Retry</Button></div>
      : parsed?.success && parsed.data.data.length ? <>
        {parsed.data.data.map((batch) => <BatchCard key={batch.bmrId} batch={batch} mayAsk={mayAsk} />)}
        <div className="flex items-center justify-end gap-2 text-sm"><span className="text-muted-foreground">Page {current} of {pages}</span>
          <Button type="button" size="sm" variant="outline" disabled={current <= 1} onClick={() => setPage({ key: search, number: current - 1 })}>Previous</Button>
          <Button type="button" size="sm" variant="outline" disabled={current >= pages} onClick={() => setPage({ key: search, number: current + 1 })}>Next</Button></div>
      </>
      : <p className="rounded-md border p-6 text-center text-sm text-muted-foreground">{search ? "No started batches match this search." : "No started batches are waiting for their BMR."}</p>}
  </section>;
}
