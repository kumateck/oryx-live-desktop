import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormDialog } from "@/shared/forms/form-dialog";
import { InputTypes } from "@/shared/forms/input-types";
import type { WizardField } from "@/shared/forms/form-wizard";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { invoiceAudit } from "../lib/dispatch";
import type { ProformaInvoice } from "../schemas/dispatch-schema";
import { usePostApiV1FinishedGoodsProformasByIdVerifyPoMutation, usePostApiV1ProductionOrdersInvoiceMutation, usePostApiV1FinishedGoodsInvoicesByIdVoidMutation } from "../api/goods-api";

const schema = z.object({ number: z.string(), date: z.date(), attachment: z.object({ value: z.string(), label: z.string() }).nullable(), checked: z.boolean(), evidence: z.string() });
type Values = z.infer<typeof schema>;
type Action = "verify" | "issue" | "void";
const keys = { verify: "CanVerifyFinishedGoodsCustomerPo", issue: "CanCreateInvoice", void: "CanVoidFinishedGoodsInvoice" } as const;
const titles = { verify: "Verify customer PO", issue: "Issue invoice", void: "Void invoice" };
export function CustomerPoDialog({ invoice, action, onClose }: { invoice: ProformaInvoice; action: Action; onClose: () => void }) {
  const permission = usePermissionAction(keys[action]);
  const [verify, verifying] = usePostApiV1FinishedGoodsProformasByIdVerifyPoMutation();
  const [issue, issuing] = usePostApiV1ProductionOrdersInvoiceMutation();
  const [voidInvoice, voiding] = usePostApiV1FinishedGoodsInvoicesByIdVoidMutation();
  const [message, setMessage] = useState("");
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { number: "", date: new Date(), attachment: null, checked: false, evidence: "" } });
  const fields: WizardField<Values>[] = action === "verify" ? [
    { type: InputTypes.TEXT, name: "number", label: "Customer PO number", required: true },
    { type: InputTypes.DATE, name: "date", label: "Customer PO date", required: true },
    { type: InputTypes.SELECT, name: "attachment", label: "Attached purchase order", mode: "single", source: "sync", required: true, options: invoice.attachments.map((file) => ({ value: file.id, label: file.name })) },
    { type: InputTypes.CHECKBOX, name: "checked", label: "I checked every PO product, packing style, quantity, price and currency against this proforma" },
  ] : action === "issue" ? [{ type: InputTypes.TEXT, name: "number", label: "Invoice number", required: true }]
    : [{ type: InputTypes.TEXTAREA, name: "evidence", label: "Finance-authorised reason and evidence", required: true }];
  const submit = form.handleSubmit(async (values) => {
    const denied = permission.check(); if (denied) { setMessage(denied); return; }
    if (action === "verify" && (!values.checked || !values.attachment || !values.number.trim())) { setMessage("Choose the attached PO, enter its number and confirm the line-by-line check."); return; }
    if (action === "verify" && invoice.products.some((p) => !p.id || p.savedUnitPrice === null || !p.savedCurrencyId)) { setMessage("Every proforma line needs its saved pack price and currency before the customer PO can be verified."); return; }
    const customerId = invoice.allocation?.customer.id;
    if (action === "issue" && (!customerId || !invoice.customerPoVerifiedAt)) { setMessage("Verify the customer PO before issuing its invoice."); return; }
    if (action === "void" && !invoice.issuedInvoiceId) { setMessage("No separately issued invoice is linked to this record."); return; }
    setMessage("");
    const result = action === "verify" ? await verify({ ...invoiceAudit, id: invoice.id, domainEntitiesProformaInvoicesVerifyFinishedGoodsCustomerPoRequest: {
      customerPoNumber: values.number.trim(), customerPoDate: values.date.toISOString(), attachmentId: values.attachment?.value ?? "",
      lines: invoice.products.map((p) => ({ proformaInvoiceProductId: p.id ?? "", quantity: p.quantity, unitPrice: p.savedUnitPrice ?? 0, currencyId: p.savedCurrencyId ?? "" })) } })
      : action === "issue" ? await issue({ ...invoiceAudit, domainEntitiesInvoicesCreateInvoice: { code: values.number.trim(), proformaInvoiceId: invoice.id, customerId: customerId ?? "", amounts: [] } })
      : await voidInvoice({ ...invoiceAudit, id: invoice.issuedInvoiceId ?? "", domainEntitiesFinishedGoodsRecallEvidenceRequest: { evidence: values.evidence } });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    onClose();
  });
  return <FormDialog allowed={permission.allowed} title={`${titles[action]} · ${invoice.code}`} description={action === "verify" ? "The attached PO is evidence; verification freezes its number, date and agreement with the saved pack prices." : "Invoice issuance and voiding are explicit finance tasks, recorded separately from physical stock movements."}
    form={form} fields={fields} submitLabel={titles[action]} busy={verifying.isLoading || issuing.isLoading || voiding.isLoading} message={message} onSubmit={(event) => void submit(event)} onClose={onClose} />;
}
