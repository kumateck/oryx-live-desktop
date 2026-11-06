import { useMemo, useState } from "react";
import { useDesktopTabVisible } from "@/shared/workspace-tabs/context";
import { Link, useParams } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmActionDialog } from "@/shared/actions";
import { PermissionGuard } from "@/shared/auth/permission-guard";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { DetailGroup, DetailItem } from "@/shared/detail/detail-list";
import { formatQuantityNumber } from "@/shared/units/quantity";
import { PageHeader } from "@/shared/navigation/page-header";
import { useGetWhitePlaceboPreparationQuery, useIssueWhitePlaceboIngredientsMutation } from "../api/white-placebo-api";
import { audit, path, permissions, preparationStatus, quantity, yieldPercent } from "../lib/white-placebo";
import { preparationSchema, type Preparation } from "../schemas/white-placebo";
import { apiErrorMessage, LoadState } from "./load-state";
import { OutputDialog } from "./output-dialog";

const timestamp = (value: string | null) => value ? new Date(value).toLocaleString() : "–";
function Facts({ item }: { item: Preparation }) {
  const percent = item.actualQuantity === null ? null : yieldPercent(item.actualQuantity, item.expectedQuantity);
  return <div className="grid min-w-0 gap-4 lg:grid-cols-2">
    <DetailGroup title="Preparation"><DetailItem label="Recipe" value={`${item.recipeReference} · revision ${item.recipeRevision}`} />
      <DetailItem label="Expected output" value={quantity(item.expectedQuantity, item.unitSymbol)} />
      <DetailItem label="Actual net weight" value={item.actualQuantity === null ? "Not recorded" : quantity(item.actualQuantity, item.unitSymbol)} />
      <DetailItem label="Yield" value={percent === null ? "–" : `${formatQuantityNumber(percent, "calculated")}%`} />
      <DetailItem label="Ingredient request notes" value={item.notes} /><DetailItem label="Weighing notes" value={item.outputNotes} />
    </DetailGroup>
    <DetailGroup title="Storage and record history"><DetailItem label="Storage" value={item.storageConditions} />
      <DetailItem label="Holding period" value={`${item.holdHours} hours from preparation`} /><DetailItem label="Use by" value={timestamp(item.useBy)} />
      <DetailItem label="Requested" value={timestamp(item.createdAt)} /><DetailItem label="Ingredients issued" value={timestamp(item.issuedAt)} />
      <DetailItem label="Issuer ID" value={item.issuedById} /><DetailItem label="Prepared" value={timestamp(item.preparedAt)} />
      <DetailItem label="Output recorded" value={timestamp(item.recordedAt)} /><DetailItem label="Recorder ID" value={item.recordedById} />
    </DetailGroup>
  </div>;
}

function Detail({ id }: { id: string }) {
  const visible = useDesktopTabVisible();
  const query = useGetWhitePlaceboPreparationQuery({ ...audit, id }, { pollingInterval: visible ? 30_000 : 0, skipPollingIfUnfocused: true, refetchOnFocus: visible });
  const parsed = useMemo(() => query.currentData ? preparationSchema.safeParse(query.currentData) : null, [query.currentData]);
  const item = parsed?.success ? parsed.data : null;
  const [issuing, setIssuing] = useState(false);
  const [output, setOutput] = useState(false);
  const [issue] = useIssueWhitePlaceboIngredientsMutation();
  const permission = usePermissionAction(permissions.issue);
  if (!item || query.error) return <LoadState loading={query.isLoading} message={query.error ? apiErrorMessage(query.error) : "The preparation could not be read."} retry={() => { void query.refetch(); }} />;
  return <article className="min-w-0 space-y-4"><PageHeader title={`White Placebo · ${item.batchNumber}`} crumbs={[{ label: "White Placebo", to: path }, { label: item.batchNumber }]} actions={<>
    {!item.issuedAt && item.approved && !item.rejected ? <PermissionGuard require={permissions.issue}><Button onClick={() => setIssuing(true)}>Issue ingredients</Button></PermissionGuard> : null}
    {item.issuedAt && !item.outputBatchId && !item.rejected ? <PermissionGuard require={permissions.output}><Button onClick={() => setOutput(true)}>Record weighed output</Button></PermissionGuard> : null}
  </>} />
    <Badge variant="outline">{preparationStatus(item)}</Badge>
    {!item.issuedAt ? <p className="text-sm text-muted-foreground">The ingredient request follows the existing raw-stock approval process. Ingredients are checked again and consumed once when issued to this preparation.</p> : null}
    {item.outputBatchId ? <p className="text-sm text-muted-foreground">Output has been recorded. Quality approval and shelf allocation control when it can be used in another product's BOM.</p> : null}
    <Facts item={item} />
    <section className="space-y-2"><h2 className="font-semibold">Ingredient batches</h2>
      <div className="divide-y rounded-lg border">{item.inputs.map((input) => <div key={input.id} className="flex min-w-0 flex-wrap items-center justify-between gap-2 p-3">
        <div className="min-w-0 break-words"><p className="font-medium">{input.materialName}</p><p className="text-sm text-muted-foreground">{input.materialCode} · Batch {input.batchNumber}</p></div>
        <span>{quantity(input.quantity, input.unitSymbol)}</span>
      </div>)}</div>
    </section>
    <section className="space-y-2"><h2 className="font-semibold">Preparation instructions</h2><p className="whitespace-pre-wrap break-words text-sm">{item.instructions}</p></section>
    <div className="flex flex-wrap gap-2"><Button variant="outline" asChild><Link to={`/production/requisition/${item.requisitionId}/details`}>Ingredient stock request</Link></Button>
      {item.grnId ? <PermissionGuard require="CanViewQuarantineRawMaterials"><Button variant="outline" asChild><Link to={`/warehouse/quarantine-area/${item.grnId}/details?type=0`}>Internal receipt and quality status</Link></Button></PermissionGuard> : null}
    </div>
    {issuing ? <ConfirmActionDialog require={permissions.issue} destructive={false} title="Issue ingredients to this preparation?" description="The approved ingredient quantities will be consumed from their selected batches. The weighed White Placebo output is recorded afterward."
      confirmLabel="Issue ingredients" busyLabel="Issuing…" onClose={() => setIssuing(false)} onConfirm={async () => {
        const fresh = await query.refetch();
        if (fresh.error) return apiErrorMessage(fresh.error);
        const checked = preparationSchema.safeParse(fresh.data);
        if (!checked.success || !checked.data.approved || checked.data.rejected || checked.data.issuedAt) return "The request changed. Review the current preparation before issuing.";
        const denied = permission.check();
        if (denied) return denied;
        const result = await issue({ ...audit, id });
        return "error" in result ? apiErrorMessage(result.error) : null;
      }} /> : null}
    {output ? <OutputDialog preparation={item} close={() => setOutput(false)} /> : null}
  </article>;
}
export function WhitePlaceboDetailPage() {
  const { id } = useParams();
  return id ? <Detail key={id} id={id} /> : null;
}
