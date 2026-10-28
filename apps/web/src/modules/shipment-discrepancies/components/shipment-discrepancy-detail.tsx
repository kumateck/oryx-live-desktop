import { useState } from "react";
import { Link } from "react-router";
import { procurementApi } from "@/shared/api/generated/procurement";
import { Button } from "@/components/ui/button";
import { useAccess } from "@/shared/auth/use-access";
import { PermissionGuard } from "@/shared/auth/permission-guard";
import { DetailGroup, DetailItem } from "@/shared/detail/detail-list";
import { formatDateTime } from "@/shared/format/dates";
import { formatQuantityNumber } from "@/shared/units/quantity";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { RecordState } from "@/shared/workflows/record-state";
import { shipmentDiscrepancySchema, shortageSchema, shipmentDiscrepancyStatus, shipmentDiscrepancyAudit as audit, type ShipmentDiscrepancy } from "../schemas/discrepancy";
import { MakeUpDialog } from "./make-up-dialog";
function Shortage({ record, lineId }: { record: ShipmentDiscrepancy; lineId: string }) {
  const query = procurementApi.useGetApiV1ProcurementShipmentDiscrepancyLineByDiscrepancyItemIdBalanceQuery({ ...audit, discrepancyItemId: lineId });
  const parsed = shortageSchema.safeParse(query.data);
  const [open, setOpen] = useState(false);
  return <RecordState loading={query.isLoading} data={parsed.success ? parsed.data : null} error={query.error ? apiErrorMessage(query.error) : null} retry={() => void query.refetch()}>{(balance) => <div className="space-y-2">
    <dl className="grid gap-2 text-sm sm:grid-cols-2"><div><dt>Confirmed make-up</dt><dd>{formatQuantityNumber(balance.confirmedMakeUpQuantity, "calculated")}</dd></div><div><dt>Make-up in flight</dt><dd>{formatQuantityNumber(balance.inFlightMakeUpQuantity, "calculated")}</dd></div><div><dt>Outstanding shortage</dt><dd>{formatQuantityNumber(balance.outstandingQuantity, "calculated")}</dd></div><div><dt>Available to ship</dt><dd>{formatQuantityNumber(balance.availableToShipQuantity, "calculated")}</dd></div></dl>
    {balance.availableToShipQuantity > 0 ? <PermissionGuard require="CanCreateShortageMakeUpInvoice"><Button size="sm" variant="outline" onClick={() => setOpen(true)}>Create supplier make-up invoice</Button></PermissionGuard> : null}
    {open ? <MakeUpDialog record={record} balance={balance} onClose={() => { setOpen(false); void query.refetch(); }} /> : null}
  </div>}</RecordState>;
}
export function ShipmentDiscrepancyEvidence({ id, embedded = false }: { id: string; embedded?: boolean }) {
  const query = procurementApi.useGetApiV1ProcurementShipmentDiscrepancyByShipmentDiscrepancyIdQuery({ ...audit, shipmentDiscrepancyId: id });
  const parsed = shipmentDiscrepancySchema.safeParse(query.data);
  const { has } = useAccess();
  return <RecordState loading={query.isLoading} data={parsed.success ? parsed.data : null} error={query.error ? apiErrorMessage(query.error) : null} retry={() => void query.refetch()}>{(record) => <div className="space-y-4">
    <DetailGroup title="Reported shipment"><DetailItem label="Shipment document" value={record.shipmentDocument.code ?? record.shipmentDocument.id} /><DetailItem label="State" value={shipmentDiscrepancyStatus(record)} /><DetailItem label="Reported" value={formatDateTime(record.createdAt)} /></DetailGroup>
    <div className="flex flex-wrap gap-2"><PermissionGuard require="CanViewShipmentDocument"><Button asChild variant="outline"><Link to={`/logistics/shipment-documents/${encodeURIComponent(record.shipmentDocument.id)}/details`}>Open source shipment</Link></Button></PermissionGuard>
      {!embedded && !record.approved && !record.rejected && (has("CanApproveShipmentDiscrepancy") || has("CanRejectShipmentDiscrepancy")) ? <Button asChild><Link to={`/qa/pending-approvals/ShipmentDiscrepancy/${encodeURIComponent(id)}`}>Review assigned approval</Link></Button> : null}</div>
    {record.items.map((line) => <section key={line.id} className="min-w-0 space-y-3 border-t pt-3"><h2 className="break-words font-semibold">{line.material.name ?? "Material"}</h2>
      <DetailGroup title="Count evidence"><DetailItem label="Declared" value={`${formatQuantityNumber(line.declaredQuantitySnapshot, "entered")} ${line.uoM.symbol ?? ""}`} /><DetailItem label="Physical count" value={`${formatQuantityNumber(line.receivedQuantity, "entered")} ${line.uoM.symbol ?? ""}`} />
        <DetailItem label="Variance" value={`${formatQuantityNumber(line.receivedQuantity - line.declaredQuantitySnapshot, "calculated")} ${line.uoM.symbol ?? ""}`} /><DetailItem label="Reason" value={line.reason} /></DetailGroup>
      {!embedded && record.approved && !record.rejected && line.receivedQuantity < line.declaredQuantitySnapshot ? <Shortage record={record} lineId={line.id} /> : null}
    </section>)}
    <p className="text-sm text-muted-foreground">Reporting records the observation. Warehouse checklist, distribution and QC control stock acceptance.</p>
  </div>}</RecordState>;
}
export function ShipmentDiscrepancyApprovalEvidence({ id }: { id: string }) {
  return <PermissionGuard require="CanViewShipmentDiscrepancy"><ShipmentDiscrepancyEvidence id={id} embedded /></PermissionGuard>;
}
