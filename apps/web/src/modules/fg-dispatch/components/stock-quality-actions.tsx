import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { useAccess } from "@/shared/auth/use-access";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { FormDialog } from "@/shared/forms/form-dialog";
import type { WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { usePostApiV1FinishedGoodsTransfersByIdHoldMutation, usePostApiV1FinishedGoodsTransfersByIdReleaseHoldMutation,
  usePostApiV1FinishedGoodsTransfersByIdReconcileMutation, useGetApiV1FinishedGoodsTransfersByIdReconciliationQuery } from "../api/goods-api";

interface StockControlProps { id: string; received: boolean; needsReconciliation: boolean; held: boolean; unitsPerPack: number; packsPerShipper: number; packingName: string }
type Action = "hold" | "release" | "reconcile";
const keys = { hold: "CanHoldFinishedGoods", release: "CanReleaseFinishedGoodsHold", reconcile: "CanReconcileFinishedGoodsStock" } as const;
const titles = { hold: "Place batch on hold", release: "Release QA hold", reconcile: "Reconcile historical stock" };
const audit = { module: "Finished Goods Warehouse", subModule: "Products" };
const schema = z.object({ evidence: z.string().trim().min(1).max(500), packingName: z.string().trim().max(1000), packsPerShipper: z.number().min(0).max(1000000), unitsPerPack: z.number().positive(), shippers: z.number().int().min(0), packs: z.number().int().min(0), units: z.number().min(0), checked: z.boolean(),
  departures: z.array(z.object({ id: z.string(), name: z.string(), leftSite: z.boolean(), date: z.date(), evidence: z.string() })) });
type Values = z.infer<typeof schema>;
function StockDialog({ note, action, onClose }: { note: StockControlProps; action: Action; onClose: () => void }) {
  const permission = usePermissionAction(keys[action]);
  const [message, setMessage] = useState("");
  const [hold, holding] = usePostApiV1FinishedGoodsTransfersByIdHoldMutation();
  const [release, releasing] = usePostApiV1FinishedGoodsTransfersByIdReleaseHoldMutation();
  const [reconcile, reconciling] = usePostApiV1FinishedGoodsTransfersByIdReconcileMutation();
  const options = useGetApiV1FinishedGoodsTransfersByIdReconciliationQuery({ ...audit, id: note.id }, { skip: action !== "reconcile" });
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { evidence: "", packingName: note.packingName, packsPerShipper: note.packsPerShipper, unitsPerPack: note.unitsPerPack || 1, shippers: 0, packs: 0, units: 0, checked: false, departures: [] } });
  useEffect(() => {
    if (!options.data || form.getValues("departures").length > 0) return;
    form.setValue("departures", options.data.filter((a) => a.id && !a.cancelled).map((a) => ({ id: a.id ?? "", name: `${a.orderCode ?? "Order"} · ${a.customer ?? "Customer"} (${a.packs ?? 0} packs)`, leftSite: false, date: a.dispatchedAt ? new Date(a.dispatchedAt) : new Date(), evidence: a.departureEvidence ?? "" })));
  }, [options.data, form]);
  const departures = useWatch({ control: form.control, name: "departures" });
  const fields: WizardField<Values>[] = [{ type: InputTypes.TEXTAREA, name: "evidence", label: "QA decision / signed reconciliation evidence", required: true }];
  if (action === "reconcile") {
    fields.push({ type: InputTypes.TEXT, name: "packingName", label: "Verified packing style name", required: true },
      { type: InputTypes.NUMBER, name: "packsPerShipper", label: "Verified complete packs per shipper (zero when not used)", required: true },
      { type: InputTypes.NUMBER, name: "unitsPerPack", label: "Verified base units in one complete pack", required: true },
      { type: InputTypes.NUMBER, name: "shippers", label: `Full shippers counted (${note.packsPerShipper} packs each)`, required: true },
      { type: InputTypes.NUMBER, name: "packs", label: "Loose complete packs counted", required: true },
      { type: InputTypes.NUMBER, name: "units", label: "Loose base units counted", required: true });
    departures.forEach((a, index) => fields.push(
      { type: InputTypes.CHECKBOX, name: `departures.${index}.leftSite`, label: `${a.name}: confirmed historical departure` },
      { type: InputTypes.DATE, name: `departures.${index}.date`, label: `${a.name}: actual departure date` },
      { type: InputTypes.TEXT, name: `departures.${index}.evidence`, label: `${a.name}: departure evidence` }));
    fields.push({ type: InputTypes.CHECKBOX, name: "checked", label: "I verified the physical count, conversion and departure evidence. Old status labels were not used as proof." });
  }
  const submit = form.handleSubmit(async (values) => {
    const denied = permission.check(); if (denied) { setMessage(denied); return; }
    if (action === "reconcile" && (!values.checked || options.isFetching || options.error)) { setMessage("Load the linked allocations and confirm the signed physical reconciliation first."); return; }
    if (action === "reconcile" && values.shippers > 0 && values.packsPerShipper <= 0) { setMessage("This historical style has no shipper conversion. Count complete packs and loose base units instead."); return; }
    setMessage("");
    const base = { ...audit, id: note.id };
    const result = action === "hold" ? await hold({ ...base, domainEntitiesFinishedGoodsRecallEvidenceRequest: { evidence: values.evidence } })
      : action === "release" ? await release({ ...base, domainEntitiesFinishedGoodsRecallEvidenceRequest: { evidence: values.evidence } })
      : await reconcile({ ...base, domainEntitiesFinishedGoodsReconcileFinishedGoodsStockRequest: {
        countedPhysicalYield: ((values.shippers * values.packsPerShipper) + values.packs) * values.unitsPerPack + values.units,
        verifiedUnitsPerPack: values.unitsPerPack, verifiedPacksPerShipper: values.packsPerShipper, verifiedPackingStyleName: values.packingName, evidence: values.evidence,
        departures: values.departures.filter((a) => a.leftSite).map((a) => ({ allocationId: a.id, departedAt: a.date.toISOString(), evidence: a.evidence })) } });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; } onClose();
  });
  return <FormDialog allowed={permission.allowed} title={titles[action]} description="This decision is recorded against the batch. Recalled stock cannot be released for resale. Resolve cancelled/unloaded packing lists before counting available stock."
    form={form} fields={fields} message={message} busy={holding.isLoading || releasing.isLoading || reconciling.isLoading} submitLabel={titles[action]} onSubmit={(event) => void submit(event)} onClose={onClose} />;
}
export function StockQualityActions(note: StockControlProps) {
  const { has } = useAccess(); const [action, setAction] = useState<Action | null>(null);
  return <div className="space-y-2">
    {note.needsReconciliation ? <p role="status" className="text-sm text-amber-700 dark:text-amber-400">Historical stock is blocked from allocation until its physical count and departures are reconciled.</p> : null}
    <div className="flex flex-wrap gap-2">
      {note.received && note.needsReconciliation && has(keys.reconcile) ? <Button size="sm" variant="outline" onClick={() => setAction("reconcile")}>Reconcile stock</Button> : null}
      {!note.held && has(keys.hold) ? <Button size="sm" variant="outline" onClick={() => setAction("hold")}>Place batch on hold</Button> : null}
      {note.held && has(keys.release) ? <Button size="sm" variant="outline" onClick={() => setAction("release")}>Release QA hold</Button> : null}
    </div>
    {action ? <StockDialog note={note} action={action} onClose={() => setAction(null)} /> : null}
  </div>;
}
