import { useMemo, useState } from "react";
import { ArrowLeftRight, ChevronDown, ChevronRight } from "lucide-react";
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
import { KindSwitch } from "@/shared/reference-data/kind-switch";
import { materialKindLabels, useKindTabs, type MaterialKind } from "@/shared/reference-data/kind-tabs";
import { toLargestUnit } from "@/shared/units/quantity";
import { AlternativeBatches, issuePermissions } from "@/modules/stock-issue/public";
import { upcomingAudit as audit, upcomingPageSchema, type ReservedLot, type UpcomingBatch } from "../schemas/upcoming";

const pageSize = 10;
// One view key covers both kinds; the switch only chooses which lots to show.
const kindPermissions: Record<MaterialKind, string> = { 0: "CanViewUpcomingBatchIssues", 1: "CanViewUpcomingBatchIssues" };
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

/** One started batch: what it is, when it started, and the lots of one material kind reserved for it, with swaps the store may ask for. */
function BatchCard({ batch, kind, mayAsk, open, onToggle }: { batch: UpcomingBatch; kind: MaterialKind; mayAsk: boolean; open: boolean; onToggle: () => void }) {
  const [swapping, setSwapping] = useState(false);
  const lots = batch.materials.filter((lot) => lot.kind === kind);
  const label = `${batch.productName ?? "Product"} ${batch.batchNumber ?? ""}`.trim();
  const bodyId = `upcoming-${batch.bmrId}`;
  return <section aria-label={label} className="rounded-lg border bg-card">
    <div className="flex flex-wrap items-start justify-between gap-3 p-4">
      <button type="button" className="flex min-w-0 flex-1 items-start gap-2 rounded-md text-left focus-visible:outline-2 focus-visible:outline-ring" aria-expanded={open} aria-controls={bodyId} onClick={onToggle}>
        {open ? <ChevronDown aria-hidden="true" className="mt-0.5 size-4 shrink-0" /> : <ChevronRight aria-hidden="true" className="mt-0.5 size-4 shrink-0" />}
        <span className="min-w-0 space-y-1">
          <span className="block break-words font-semibold">{batch.productName ?? "Product"} <span className="text-sm font-normal text-muted-foreground">{batch.productCode ?? ""}</span></span>
          <span className="block text-sm text-muted-foreground">Schedule {batch.scheduleCode ?? "–"} · Started {formatDateTime(batch.startedAt) ?? "–"} · {show(batch.batchQuantity, batch.batchUnit)} · {lots.length} {materialKindLabels[kind].toLowerCase()} {lots.length === 1 ? "lot" : "lots"}</span>
        </span>
      </button>
      <div className="flex flex-wrap items-center gap-2">
        {batch.batchNumber ? <Badge variant="outline">Batch {batch.batchNumber}</Badge> : <Badge variant="secondary">Batch number not assigned yet</Badge>}
        {open ? <Button type="button" size="sm" variant="outline" aria-expanded={swapping} onClick={() => setSwapping((value) => !value)}><ArrowLeftRight />{swapping ? "Hide swaps" : "Earlier batches to swap"}</Button> : null}
      </div>
    </div>
    {open ? <div id={bodyId} className="space-y-3 border-t px-4 pb-4 pt-3">
      <Lots title={`${materialKindLabels[kind]} materials`} lots={lots} />
      {swapping ? <AlternativeBatches source={{ batchId: batch.productionScheduleProductId }} mayAsk={mayAsk} /> : null}
    </div> : null}
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
  // Raw and packaging lots are prepared by different stores: one kind at a time, kept in the address.
  const kinds = useKindTabs(kindPermissions);
  const kind = kinds.kind ?? 0;
  const batches = useMemo(() => parsed?.success ? parsed.data.data.filter((batch) => batch.materials.some((lot) => lot.kind === kind)) : [], [parsed, kind]);
  // The first batch opens; the rest stay folded until opened.
  const [toggled, setToggled] = useState<ReadonlySet<string>>(() => new Set());
  const isOpen = (batch: UpcomingBatch, index: number) => toggled.has(batch.bmrId) ? index !== 0 : index === 0;
  const toggle = (id: string) => setToggled((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const setAll = (open: boolean) => setToggled(new Set(batches.flatMap((batch, index) => (index === 0) === open ? [] : [batch.bmrId])));
  return <section className="min-w-0 space-y-4">
    <PageHeader title="Upcoming batch issues" crumbs={[]} actions={<KindSwitch tabs={kinds.tabs} kind={kinds.kind} onSelect={kinds.select} />} />
    <p className="text-sm text-muted-foreground">Batches whose production has started. Their lots are reserved; prepare them before the stock is requested, and swap to earlier batches where another store holds them.</p>
    {query.isLoading ? <PageSkeleton label="Loading upcoming batches" />
      : error ? <div role="alert" className="flex flex-wrap items-center gap-3 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm"><span>{error}</span><Button type="button" size="sm" variant="outline" onClick={() => void query.refetch()}>Retry</Button></div>
      : batches.length ? <>
        <div className="flex justify-end gap-2"><Button type="button" size="sm" variant="ghost" onClick={() => setAll(true)}>Expand all</Button><Button type="button" size="sm" variant="ghost" onClick={() => setAll(false)}>Collapse all</Button></div>
        {batches.map((batch, index) => <BatchCard key={batch.bmrId} batch={batch} kind={kind} mayAsk={mayAsk} open={isOpen(batch, index)} onToggle={() => toggle(batch.bmrId)} />)}
        <div className="flex items-center justify-end gap-2 text-sm"><span className="text-muted-foreground">Page {current} of {pages}</span>
          <Button type="button" size="sm" variant="outline" disabled={current <= 1} onClick={() => setPage({ key: search, number: current - 1 })}>Previous</Button>
          <Button type="button" size="sm" variant="outline" disabled={current >= pages} onClick={() => setPage({ key: search, number: current + 1 })}>Next</Button></div>
      </>
      : <p className="rounded-md border p-6 text-center text-sm text-muted-foreground">{search ? "No started batches match this search." : parsed?.success && parsed.data.data.length ? `No started batch on this page needs ${materialKindLabels[kind].toLowerCase()} materials.` : "No started batches are waiting for their BMR."}</p>}
  </section>;
}
