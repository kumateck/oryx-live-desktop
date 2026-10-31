import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router";
import { procurementApi } from "@/shared/api/generated/procurement";
import { SettingsFormDialog } from "@/modules/settings-support/ui";
import { useVerifiedMutation } from "@/shared/workflows/use-verified-mutation";
import { InputTypes } from "@/shared/forms/input-types";
import type { WizardField } from "@/shared/forms/form-wizard";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatQuantityNumber } from "@/shared/units/quantity";
import { shortageSchema, shipmentDiscrepancySchema, shipmentDiscrepancyAudit as audit, type ShipmentDiscrepancy, type ShortageBalance } from "../schemas/discrepancy";
import { randomId } from "@/shared/ids/random-id";
const schema = z.object({ code: z.string().trim().min(1).max(100), quantity: z.number().finite().positive() });
type Values = z.infer<typeof schema>;
const fields: WizardField<Values>[] = [
  { type: InputTypes.TEXT, name: "code", label: "Make-up invoice reference", required: true },
  { type: InputTypes.NUMBER, name: "quantity", label: "Make-up quantity (invoice unit)", min: 0, step: 0.000001, required: true },
];
export function MakeUpDialog({ record, balance, onClose }: { record: ShipmentDiscrepancy; balance: ShortageBalance; onClose: () => void }) {
  const navigate = useNavigate();
  const [requestKey] = useState(() => randomId());
  const command = useVerifiedMutation<{ record: ShipmentDiscrepancy; balance: ShortageBalance }>("CanCreateShortageMakeUpInvoice", { record, balance });
  const [read] = procurementApi.useLazyGetApiV1ProcurementShipmentDiscrepancyByShipmentDiscrepancyIdQuery();
  const [readBalance] = procurementApi.useLazyGetApiV1ProcurementShipmentDiscrepancyLineByDiscrepancyItemIdBalanceQuery();
  const [create] = procurementApi.usePostApiV1ProcurementShipmentInvoiceShortageMakeUpMutation();
  const [message, setMessage] = useState("");
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { code: "", quantity: Number.NaN } });
  const save = async (values: Values) => {
    if (values.quantity > balance.availableToShipQuantity) { form.setError("quantity", { message: "This exceeds the unallocated shortage" }); return; }
    const failure = await command.run({ record, balance }, async () => {
      const [fresh, current] = await Promise.all([read({ ...audit, shipmentDiscrepancyId: record.id }, false).unwrap(), readBalance({ ...audit, discrepancyItemId: balance.shipmentDiscrepancyItemId }, false).unwrap()]);
      return { record: shipmentDiscrepancySchema.parse(fresh), balance: shortageSchema.parse(current) };
    }, async (fresh) => {
      if (!fresh.record.approved || fresh.record.rejected || fresh.balance.shipmentDiscrepancyId !== record.id || values.quantity > fresh.balance.availableToShipQuantity) throw new Error("This approved shortage is no longer available for this quantity.");
      const result = await create({ ...audit, domainEntitiesShipmentsRequestCreateShortageMakeUpInvoice: { code: values.code, shipmentDiscrepancyItemId: balance.shipmentDiscrepancyItemId, quantity: values.quantity, requestKey } });
      if ("error" in result) throw new Error(apiErrorMessage(result.error));
      onClose();
      void navigate(`/logistics/shipment-invoices/${encodeURIComponent(result.data)}`);
    });
    if (failure) setMessage(failure);
  };
  return <SettingsFormDialog title="Create shortage make-up invoice" description={`Available to ship: ${formatQuantityNumber(balance.availableToShipQuantity, "entered")} in the original invoice unit. This creates a supplier make-up invoice; stock acceptance still follows warehouse and QC controls.`}
    form={form} fields={fields} saving={command.busy} submitDisabled={command.attempted || !command.allowed} message={message} submitLabel="Create make-up invoice" onClose={onClose} onSubmit={save} />;
}
