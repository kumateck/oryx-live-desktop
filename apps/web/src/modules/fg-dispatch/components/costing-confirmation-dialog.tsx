import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { FormDialog } from "@/shared/forms/form-dialog";
import type { WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { useCurrencyOptions } from "@/modules/costing/public";
import type { Allocation } from "../schemas/dispatch-schema";
import { audit } from "../lib/dispatch";
import { usePostApiV1FinishedGoodsAllocationsByIdCostingMutation } from "../api/goods-api";
const line = z.object({ cost: z.number().positive("Enter the approved manufacturing cost per pack"), currency: z.object({ value: z.string(), label: z.string() }).nullable(), reference: z.string().trim().min(1).max(700) })
  .superRefine((value, ctx) => { if (!value.currency) ctx.addIssue({ code: "custom", path: ["currency"], message: "Choose the cost currency" }); });
const schema = z.object({ confirmed: z.boolean().refine((v) => v, "Confirm the approved source"), lines: z.array(line).min(1) });
type Values = z.infer<typeof schema>;
export function CostingConfirmationDialog({ allocation, onClose }: { allocation: Allocation; onClose: () => void }) {
  const permission = usePermissionAction("CanConfirmFinishedGoodsCosting"); const currencies = useCurrencyOptions();
  const [save, saving] = usePostApiV1FinishedGoodsAllocationsByIdCostingMutation(); const [message, setMessage] = useState("");
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { confirmed: false, lines: allocation.products.map(() => ({ cost: 0, currency: null, reference: "" })) } });
  const fields: WizardField<Values>[] = [];
  allocation.products.forEach((product, index) => {
    const name = `${product.name} · ${product.sources[0]?.packing ?? "packing style"}`;
    fields.push({ type: InputTypes.NUMBER, name: `lines.${index}.cost`, label: `${name}: manufacturing cost per complete pack`, required: true },
      { type: InputTypes.SELECT, name: `lines.${index}.currency`, label: `${name}: cost currency`, mode: "single", source: "sync", options: currencies.options, required: true },
      { type: InputTypes.TEXT, name: `lines.${index}.reference`, label: `${name}: approved batch cost / valuation reference`, required: true });
  });
  fields.push({ type: InputTypes.CHECKBOX, name: "confirmed", label: "These manufacturing costs come from the approved costing basis; selling prices and exchange rates have not been substituted" });
  const submit = form.handleSubmit(async (values) => {
    const denied = permission.check(); if (denied) { setMessage(denied); return; }
    if (allocation.products.some((p) => !p.productId || !p.packingId)) { setMessage("Reconcile the allocated product packing styles first."); return; }
    const result = await save({ ...audit, id: allocation.id, domainEntitiesProductionOrdersConfirmFinishedGoodsCostingRequest: { approvedBasisConfirmed: values.confirmed,
      lines: values.lines.map((value, index) => ({ productId: allocation.products[index]?.productId ?? "", productPackingId: allocation.products[index]?.packingId ?? "",
        manufacturingCostPerPack: value.cost, currencyId: value.currency?.value ?? "", approvedCostBasisReference: value.reference })) } });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; } onClose();
  });
  return <FormDialog allowed={permission.allowed} title="Confirm finished goods costing" description="Record the approved manufacturing cost per pack and its currency. The saved basis remains fixed for this consignment; this does not change its selling price or post a second accounting entry."
    form={form} fields={fields} submitLabel="Confirm costing basis" busy={saving.isLoading} message={message} onSubmit={(event) => void submit(event)} onClose={onClose} />;
}
