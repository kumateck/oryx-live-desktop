import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmActionDialog } from "@/shared/actions";
import { useAccess } from "@/shared/auth/use-access";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import type { SupplierType } from "@/shared/procurement/supplier-type";
import { PageSkeleton } from "@/shared/skeleton/page-skeletons";
import { useGetApiV1RequisitionSourceMaterialPriceComparisonQuery, usePostApiV1RequisitionSourceQuotationProcessPurchaseOrderMutation } from "../api/comparison-api";
import { purchaseOrderDrafts, undecided, type Awards } from "../lib/comparison";
import { audit, awardPermissions } from "../lib/comparison-access";
import { comparisonSchema } from "../schemas/comparison-schema";
import { ComparisonGroupCard } from "./comparison-group";

/** The open quotes of one supplier type, material by material; choosing a supplier for each creates the purchase orders. */
export function PriceComparison({ type }: { type: SupplierType }) {
  const { has } = useAccess();
  const query = useGetApiV1RequisitionSourceMaterialPriceComparisonQuery({ ...audit, supplierType: type });
  const [apply, mutation] = usePostApiV1RequisitionSourceQuotationProcessPurchaseOrderMutation();
  const [awards, setAwards] = useState<Awards>({});
  const [confirming, setConfirming] = useState(false);
  const parsed = useMemo(() => query.data ? comparisonSchema.safeParse(query.data) : null, [query.data]);
  const groups = useMemo(() => parsed?.success ? parsed.data : [], [parsed]);
  const open = useMemo(() => undecided(groups, awards), [groups, awards]);
  const drafts = useMemo(() => purchaseOrderDrafts(groups, awards), [groups, awards]);
  const mayAward = has(awardPermissions[type]);

  if (query.isLoading) return <PageSkeleton label="Loading quotes" />;
  const failure = query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned quotes the app could not read." : null;
  if (failure) return <div role="alert" className="mx-auto max-w-md space-y-3 py-12 text-center"><h2 className="text-lg font-semibold">Quotes unavailable</h2>
    <p className="text-sm text-muted-foreground">{failure}</p><Button size="sm" variant="outline" onClick={() => void query.refetch()}>Retry</Button></div>;
  if (groups.length === 0) return <div className="mx-auto max-w-md space-y-1 py-12 text-center"><h2 className="text-lg font-semibold">Nothing to compare</h2>
    <p className="text-sm text-muted-foreground">Materials appear here once a supplier's quoted prices are recorded.</p></div>;

  const save = async (): Promise<string | null> => {
    const result = await apply({ ...audit, supplierType: type, body: drafts.map(({ supplierId, sourceRequisitionId, items }) => ({ supplierId, sourceRequisitionId, items })) });
    if ("error" in result) return apiErrorMessage(result.error);
    toast.success(drafts.length === 1 ? "Purchase order created" : `${drafts.length} purchase orders created`, { description: "They are waiting under Proforma request." });
    setAwards({});
    return null;
  };
  const decided = groups.length - open.length;

  return <div className="flex min-h-0 flex-1 flex-col gap-4">
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/50 px-4 py-3">
      <p role="status" className="text-sm"><span className="font-semibold">{decided} of {groups.length}</span> {groups.length === 1 ? "material" : "materials"} decided
        {mayAward && open.length > 0 ? <span className="text-muted-foreground"> · choose a supplier for every material; applying closes all other open quotes</span> : null}</p>
      {mayAward ? <Button type="button" disabled={open.length > 0 || mutation.isLoading} onClick={() => setConfirming(true)}>Create purchase orders</Button>
        : <span className="text-sm text-muted-foreground">Choosing suppliers needs its own permission.</span>}
    </div>
    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto">{groups.map((group) => <ComparisonGroupCard key={group.id} group={group} chosen={awards[group.id] ?? null} disabled={mutation.isLoading}
      onChoose={mayAward ? (key) => setAwards((current) => ({ ...current, [group.id]: key })) : null} />)}</div>
    {confirming ? <ConfirmActionDialog require={awardPermissions[type]} destructive={false} title={drafts.length === 1 ? "Create 1 purchase order?" : `Create ${drafts.length} purchase orders?`}
      description={`${drafts.map((draft) => `${draft.supplierName} (${draft.items.length} ${draft.items.length === 1 ? "material" : "materials"})`).join(", ")}. The quotes that were not chosen are closed. This cannot be undone here.`}
      confirmLabel="Create purchase orders" busyLabel="Creating…" onConfirm={save} onClose={() => setConfirming(false)} /> : null}
  </div>;
}
