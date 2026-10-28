import { useCallback, useState } from "react";
import { skipToken } from "@reduxjs/toolkit/query";
import { useNavigate, useSearchParams } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { procurementApi } from "@/shared/api/generated/procurement";
import { Button } from "@/components/ui/button";
import { ConfirmActionDialog } from "@/shared/actions";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import type { SelectLoader } from "@/shared/forms/form-wizard-types";
import { RecordState } from "@/shared/workflows/record-state";
import { useVerifiedMutation } from "@/shared/workflows/use-verified-mutation";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { PageHeader } from "@/shared/navigation/page-header";
import { UnsavedChangesGuard } from "@/shared/navigation/unsaved-changes";
import { discrepancyDocumentSchema, shipmentDiscrepancyAudit as audit, shipmentDiscrepancyPath, type DiscrepancyDocument } from "../schemas/discrepancy";
import { DiscrepancyLines, shipmentCountSchema, type ShipmentCountValues } from "./discrepancy-lines";
interface PickerValues { document: { value: string; label: string } | null }
function ChooseDocument({ onChoose }: { onChoose: (id: string) => void }) {
  const [read] = procurementApi.useLazyGetApiV1ProcurementShipmentDocumentQuery();
  const load = useCallback<SelectLoader>(async (search, page, signal) => {
    const request = read({ ...audit, searchQuery: search, page, pageSize: 30 }, false);
    signal.addEventListener("abort", () => request.abort(), { once: true });
    const result = await request.unwrap();
    return { options: (result.data ?? []).flatMap((row) => row.id ? [{ value: row.id, label: row.code ?? row.id }] : []), hasNext: page < (result.pageCount ?? page), hasPrevious: page > 1 };
  }, [read]);
  const form = useForm<PickerValues>({ defaultValues: { document: null } });
  const fields: WizardField<PickerValues>[] = [{ type: InputTypes.SELECT, name: "document", label: "Source shipment document", mode: "single", source: "async", loadOptions: load, required: true }];
  return <form noValidate className="max-w-2xl space-y-3" onSubmit={(event) => { event.preventDefault(); const selected = form.getValues("document"); if (selected) onChoose(selected.value); else form.setError("document", { message: "Choose the shipment document" }); }}><FormWizard form={form} fields={fields} /><Button type="submit">Open shipment</Button></form>;
}
function CountShipment({ document, initialLine }: { document: DiscrepancyDocument; initialLine: string | null }) {
  const navigate = useNavigate();
  const selected = document.shipmentInvoice.items.find((row) => row.id === initialLine);
  const form = useForm<ShipmentCountValues>({ resolver: zodResolver(shipmentCountSchema), defaultValues: { lines: [{ line: selected ? { value: selected.id, label: selected.material.name ?? "Invoice line" } : null, count: Number.NaN, reason: "" }] } });
  const [review, setReview] = useState<ShipmentCountValues | null>(null);
  const command = useVerifiedMutation<DiscrepancyDocument>({ kind: "all", permissions: ["CanRecordShipmentDiscrepancy", "CanViewShipmentDocument"] });
  const [read] = procurementApi.useLazyGetApiV1ProcurementShipmentDocumentByShipmentDocumentIdQuery();
  const [create] = procurementApi.usePostApiV1ProcurementShipmentDiscrepancyMutation();
  const submit = form.handleSubmit((values) => {
    const changed = values.lines.every((line) => document.shipmentInvoice.items.some((item) => item.id === line.line?.value && item.expectedQuantity !== line.count));
    if (!changed) { form.setError("lines", { message: "Each reported line must differ from its declared count" }); return; }
    setReview(structuredClone(values));
  });
  return <form noValidate className="space-y-4" onSubmit={(event) => void submit(event)}>
    <UnsavedChangesGuard when={form.formState.isDirty && !command.attempted} />
    <p className="text-sm text-muted-foreground">Shipment {document.code}. Count in each invoice line's stated unit. Reporting does not change stock.</p>
    <DiscrepancyLines form={form} document={document} /><Button type="submit">Review report</Button>
    {review ? <ConfirmActionDialog title="Submit shipment discrepancy?" description={`Record ${review.lines.length} physical count observations against shipment ${document.code} for approval. Invoice and stock quantities remain governed by their own workflows.`}
      destructive={false} require="CanRecordShipmentDiscrepancy" confirmLabel="Send for approval" busyLabel="Verifying…" onClose={() => setReview(null)} onConfirm={async () => command.run(document,
        async () => discrepancyDocumentSchema.parse(await read({ ...audit, shipmentDocumentId: document.id }, false).unwrap()), async (fresh) => {
          const items = review.lines.map((row) => {
            const line = fresh.shipmentInvoice.items.find((item) => item.id === row.line?.value);
            if (!line) throw new Error("An invoice line is no longer available.");
            return { shipmentInvoiceItemId: line.id, materialId: line.material.id, uoMId: line.uoM.id, receivedQuantity: row.count, reason: row.reason };
          });
          const result = await create({ ...audit, domainEntitiesShipmentsRequestCreateShipmentDiscrepancy: { shipmentDocumentId: fresh.id, items } });
          if ("error" in result) throw new Error(apiErrorMessage(result.error));
          void navigate(shipmentDiscrepancyPath(result.data));
        })} /> : null}
  </form>;
}
export function CreateShipmentDiscrepancyPage() {
  const [params, setParams] = useSearchParams();
  const documentId = params.get("shipmentDocumentId");
  const valid = documentId && z.uuid().safeParse(documentId).success;
  const query = procurementApi.useGetApiV1ProcurementShipmentDocumentByShipmentDocumentIdQuery(valid ? { ...audit, shipmentDocumentId: documentId } : skipToken);
  const parsed = discrepancyDocumentSchema.safeParse(query.data);
  return <article className="min-w-0 space-y-4"><PageHeader title="Record shipment discrepancy" crumbs={[{ label: "Shipment discrepancies", to: "/logistics/shipment-discrepancies" }, { label: "New report" }]} />
    {!valid ? <ChooseDocument onChoose={(id) => setParams({ shipmentDocumentId: id })} /> : <RecordState loading={query.isLoading} data={parsed.success ? parsed.data : null}
      error={query.error ? apiErrorMessage(query.error) : null} retry={() => void query.refetch()}>{(document) => <CountShipment key={document.id} document={document} initialLine={params.get("lineId")} />}</RecordState>}
  </article>;
}
