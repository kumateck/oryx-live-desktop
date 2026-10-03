import { useMemo, useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { Link } from "react-router";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { swapRowsSchema, swapsPath } from "@/modules/swap-requests/swaps";
import { useCurrentUser } from "@/shared/auth/session-provider";
import { ClientDataTable, dataTableColumns } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatMonthYear } from "@/shared/format/dates";
import { useGetApiV1RequisitionByRequisitionIdAlternativeBatchesQuery, useGetApiV1WarehouseSwapQuery } from "../api/stock-issue-api";
import { useRaiseSwaps, type SwapOutcome } from "../hooks/use-raise-swaps";
import { alternativesSchema, swapSuggestions, type SwapSuggestion } from "../lib/alternative-batches";
import { audit, batchNumber } from "../lib/stock-issue";
import { amount } from "./batch-breakdown";
import { SwapReviewDialog } from "./swap-review-dialog";

const column = dataTableColumns<SwapSuggestion>();
const expiry = (value: string | null) => value ? `Expires ${formatMonthYear(value) ?? ""}` : "No expiry date";
const columns = column.columns([
  column.accessor("materialName", { header: "Material", cell: ({ row }) => <div className="min-w-0"><div className="break-words font-medium">{row.original.materialName}</div><div className="text-xs text-muted-foreground">{row.original.materialCode ?? "No code"}</div></div> }),
  column.display({ id: "current", header: "Set aside now", cell: ({ row }) => <div><div className="font-medium">{batchNumber(row.original.current.number)}</div>
    <div className="text-xs text-muted-foreground">{expiry(row.original.current.expires)} · {amount(row.original.current.reserved, row.original.unit)}</div></div> }),
  column.display({ id: "alternative", header: "Earlier batch", cell: ({ row }) => <div><div className="font-medium">{batchNumber(row.original.alternative.number)}</div>
    <div className="text-xs text-muted-foreground">{expiry(row.original.alternative.expires)} · {amount(row.original.alternative.available, row.original.unit)} on the shelf</div></div> }),
  column.accessor((row) => row.alternative.store, { id: "store", header: "Held by" }),
  column.display({ id: "quantity", header: "To swap", size: 170, cell: ({ row }) => <div className="flex flex-wrap items-center gap-1.5"><span>{amount(row.original.quantity, row.original.unit)}</span>{row.original.partial ? <Badge variant="secondary">Part of batch</Badge> : null}</div> }),
]);

/**
 * Batches in other stores that expire before the ones set aside for this requisition. Swapping to them uses the
 * older stock first. With `mayAsk`, swaps can be chosen and asked for; the other store then decides each one.
 */
export function AlternativeBatches({ requisitionId, mayAsk }: { requisitionId: string; mayAsk: boolean }) {
  const departmentId = useCurrentUser()?.departmentId ?? null;
  const query = useGetApiV1RequisitionByRequisitionIdAlternativeBatchesQuery({ ...audit, requisitionId });
  // Swaps this store has already asked for and that wait for a decision: that stock is not offered again.
  const waitingQuery = useGetApiV1WarehouseSwapQuery({ ...audit, departmentId: departmentId ?? "", direction: 1, status: 0, page: 1, pageSize: 100 }, { skip: !departmentId });
  const parsed = useMemo(() => query.data ? alternativesSchema.safeParse(query.data) : null, [query.data]);
  const waiting = useMemo(() => { const rows = swapRowsSchema.safeParse(waitingQuery.data?.data ?? []); return rows.success ? rows.data.filter((swap) => swap.status === 0) : []; }, [waitingQuery.data]);
  const suggestions = useMemo(() => {
    if (!parsed?.success) return [];
    const committed = new Map<string, number>();
    for (const swap of waiting) for (const batch of swap.giving) if (batch.batchId) committed.set(batch.batchId, (committed.get(batch.batchId) ?? 0) + batch.quantity);
    return swapSuggestions(parsed.data, committed);
  }, [parsed, waiting]);
  const [picked, setPicked] = useState<ReadonlySet<string>>(new Set());
  const [reviewing, setReviewing] = useState(false);
  const [outcomes, setOutcomes] = useState<readonly SwapOutcome[]>([]);
  const raise = useRaiseSwaps(requisitionId);
  const chosen = suggestions.filter((row) => picked.has(row.key));
  const error = query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned batches the app could not read." : null;
  const send = async () => {
    const results = await raise(chosen);
    const asked = results.filter((result) => result.reason === null);
    const refused = results.filter((result) => result.reason !== null);
    if (asked.length) toast.success(asked.length === 1 ? "1 swap asked for" : `${asked.length} swaps asked for`, { description: "The other store decides each one. The batches change once it approves." });
    // Only what was not asked for stays chosen, with its reason.
    setPicked(new Set(refused.map((result) => result.key)));
    setOutcomes(refused);
    if (refused.length === 0) setReviewing(false);
    else toast.error(refused.length === 1 ? "1 swap could not be asked for" : `${refused.length} swaps could not be asked for`);
  };
  return <section aria-label="Earlier batches in other stores" className="space-y-3 rounded-lg border bg-card p-4">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0"><h2 className="text-sm font-semibold">Earlier batches in other stores</h2>
        <p className="text-sm text-muted-foreground">Batches that expire before the ones set aside. Swapping to them uses the older stock first.</p></div>
      {mayAsk && suggestions.length > 0 ? <Button type="button" size="sm" disabled={chosen.length === 0} onClick={() => { setOutcomes([]); setReviewing(true); }}><ArrowLeftRight />Review swaps ({chosen.length})</Button> : null}
    </div>
    {waiting.length > 0 ? <p role="status" className="text-sm">{waiting.length === 1 ? "1 swap your store asked for is" : `${waiting.length} swaps your store asked for are`} waiting for a decision. <Link className="underline" to={`${swapsPath}?direction=1`}>See swap requests</Link></p> : null}
    {query.isLoading ? <p role="status" className="text-sm text-muted-foreground">Looking for earlier batches in other stores…</p>
      : error ? <div role="alert" className="flex flex-wrap items-center gap-3 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm"><span>{error}</span><Button type="button" size="sm" variant="outline" onClick={() => void query.refetch()}>Retry</Button></div>
      : suggestions.length === 0 ? <p className="text-sm text-muted-foreground">No other store holds a batch that expires before the ones set aside.</p>
      : <ClientDataTable label="Swaps that could be asked for" columns={columns} rows={suggestions} getRowId={(row) => row.key} fill={false} refreshing={query.isFetching}
          selection={mayAsk ? { selected: picked, onChange: setPicked } : undefined} />}
    {reviewing ? <SwapReviewDialog swaps={chosen} outcomes={outcomes} onSend={send} onClose={() => setReviewing(false)} /> : null}
  </section>;
}
