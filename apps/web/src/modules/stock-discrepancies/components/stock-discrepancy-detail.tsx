import { useState } from "react";
import { Link } from "react-router";
import { warehouseApi } from "@/shared/api/generated/warehouse";
import { materialsApi } from "@/shared/api/generated/materials";
import { Button } from "@/components/ui/button";
import { ConfirmActionDialog } from "@/shared/actions";
import { useAccess } from "@/shared/auth/use-access";
import { PermissionGuard } from "@/shared/auth/permission-guard";
import { DetailGroup, DetailItem } from "@/shared/detail/detail-list";
import { formatDateTime } from "@/shared/format/dates";
import { formatQuantityNumber } from "@/shared/units/quantity";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { RecordState } from "@/shared/workflows/record-state";
import { useVerifiedMutation } from "@/shared/workflows/use-verified-mutation";
import { stockDiscrepancySchema, stockDiscrepancyStatus, stockDiscrepancyAudit as audit, shelfSchema, discrepancyReasons, type StockDiscrepancy } from "../schemas/discrepancy";
function Reconcile({ record, onClose, onDone }: { record: StockDiscrepancy; onClose: () => void; onDone: () => void }) {
  const command = useVerifiedMutation<StockDiscrepancy>("CanReconcileStockDiscrepancy", record);
  const [read] = warehouseApi.useLazyGetApiV1StockDiscrepancyByIdQuery();
  const [readShelves] = materialsApi.useLazyGetApiV1MaterialShelfQuery();
  const [reconcile] = warehouseApi.usePostApiV1StockDiscrepancyByIdReconcileMutation();
  return <ConfirmActionDialog title="Reconcile this approved count?" description="This posts the variance to stock, the bin card and inventory ledger. The current shelf balance must still equal the reported snapshot."
    confirmLabel="Reconcile stock" busyLabel="Verifying…" require="CanReconcileStockDiscrepancy" onClose={onClose} onConfirm={async () => {
      const failure = await command.run(record, async () => {
        const [fresh, rows] = await Promise.all([read({ ...audit, id: record.id }, false).unwrap(), readShelves(audit, false).unwrap()]);
        const shelf = shelfSchema.array().parse(rows).find((row) => row.id === record.shelfMaterialBatchId);
        if (!shelf || shelf.quantity !== record.systemQuantitySnapshot) throw new Error("Stock changed since the count. Report a new count before reconciliation.");
        return stockDiscrepancySchema.parse(fresh);
      }, async (fresh) => {
        if (!fresh.approved || fresh.rejected || fresh.reconciledAt) throw new Error("This report is not awaiting reconciliation.");
        const result = await reconcile({ ...audit, id: fresh.id });
        if ("error" in result) throw new Error(apiErrorMessage(result.error));
      });
      if (!failure) onDone();
      return failure;
    }} />;
}
export function StockDiscrepancyEvidence({ id, embedded = false }: { id: string; embedded?: boolean }) {
  const query = warehouseApi.useGetApiV1StockDiscrepancyByIdQuery({ ...audit, id });
  const parsed = stockDiscrepancySchema.safeParse(query.data);
  const [confirm, setConfirm] = useState(false);
  const { has } = useAccess();
  return <RecordState loading={query.isLoading} data={parsed.success ? parsed.data : null} error={query.error ? apiErrorMessage(query.error) : null} retry={() => void query.refetch()}>{(record) => <div className="space-y-4">
    <p className="text-sm font-medium">{stockDiscrepancyStatus(record)}</p>
    <DetailGroup title="Physical count evidence"><DetailItem label="Material" value={record.materialName} /><DetailItem label="Batch" value={record.batchNumber} />
      <DetailItem label="Recorded quantity" value={`${formatQuantityNumber(record.systemQuantitySnapshot, "entered")} ${record.unit}`} /><DetailItem label="Physical count" value={`${formatQuantityNumber(record.physicalQuantity, "entered")} ${record.unit}`} />
      <DetailItem label="Variance" value={`${formatQuantityNumber(record.variance, "calculated")} ${record.unit}`} /><DetailItem label="Reason" value={discrepancyReasons[record.reasonCode]} />
      <DetailItem label="Investigation notes" value={record.notes} /><DetailItem label="Reported" value={formatDateTime(record.createdAt)} /><DetailItem label="Reconciled" value={formatDateTime(record.reconciledAt)} /></DetailGroup>
    {!embedded ? <div className="flex flex-wrap gap-2">
      {!record.approved && !record.rejected && (has("CanApproveStockDiscrepancy") || has("CanRejectStockDiscrepancy")) ? <Button asChild variant="outline"><Link to={`/qa/pending-approvals/StockDiscrepancy/${encodeURIComponent(id)}`}>Review assigned approval</Link></Button> : null}
      {record.approved && !record.rejected && !record.reconciledAt && has("CanReconcileStockDiscrepancy") ? <Button onClick={() => setConfirm(true)}>Reconcile approved variance</Button> : null}
    </div> : null}
    {confirm ? <Reconcile record={record} onClose={() => setConfirm(false)} onDone={() => { setConfirm(false); void query.refetch(); }} /> : null}
  </div>}</RecordState>;
}
export function StockDiscrepancyApprovalEvidence({ id }: { id: string }) {
  return <PermissionGuard require="CanViewStockDiscrepancy"><StockDiscrepancyEvidence id={id} embedded /></PermissionGuard>;
}
