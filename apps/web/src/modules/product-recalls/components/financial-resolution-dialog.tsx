import { useCallback, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormDialog } from "@/shared/forms/form-dialog";
import type { WizardField } from "@/shared/forms/form-wizard";
import type { SelectLoader } from "@/shared/forms/form-wizard-types";
import { InputTypes } from "@/shared/forms/input-types";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { useGetApiV1FinishedGoodsRecallsByIdSettlementOptionsQuery, useLazyGetApiV1FinishedGoodsRecallsByIdReplacementOrdersQuery,
  usePostApiV1FinishedGoodsRecallsByIdSettlementsMutation } from "@/modules/fg-dispatch/public";
import { recallAudit } from "../lib";
const choice = z.object({ value: z.string(), label: z.string() }).nullable();
const schema = z.object({ invoice: choice, kind: choice, currency: choice, amount: z.number().min(0), reference: z.string().trim().min(1).max(100), evidence: z.string().trim().min(1).max(2000), replacement: choice });
type Values = z.infer<typeof schema>;
export function FinancialResolutionDialog({ id, onClose, onSaved }: { id: string; onClose: () => void; onSaved: () => void }) {
  const permission = usePermissionAction("CanRecordProductRecallSettlement"); const [message, setMessage] = useState("");
  const options = useGetApiV1FinishedGoodsRecallsByIdSettlementOptionsQuery({ ...recallAudit, id });
  const [loadOrders] = useLazyGetApiV1FinishedGoodsRecallsByIdReplacementOrdersQuery();
  const [save, saving] = usePostApiV1FinishedGoodsRecallsByIdSettlementsMutation();
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { invoice: null, kind: null, currency: null, amount: 0, reference: "", evidence: "", replacement: null } });
  const selected = useWatch({ control: form.control, name: "invoice" }); const kind = useWatch({ control: form.control, name: "kind" });
  const invoice = options.data?.find((row) => row.invoiceId === selected?.value);
  const loader = useCallback<SelectLoader>(async (search, _page, signal) => {
    if (!selected?.value) return { options: [], hasNext: false, hasPrevious: false };
    const request = loadOrders({ ...recallAudit, id, invoiceId: selected.value, searchQuery: search }); signal.addEventListener("abort", () => request.abort(), { once: true });
    const rows = await request.unwrap(); return { options: rows.flatMap((row) => row.id ? [{ value: row.id, label: `${row.batchNumber ?? "Order"} · ${row.productName ?? "Customer"}` }] : []), hasNext: false, hasPrevious: false };
  }, [id, selected?.value, loadOrders]);
  const fields = useMemo<WizardField<Values>[]>(() => [
    { type: InputTypes.SELECT, name: "invoice", label: "Affected customer invoice", source: "sync", mode: "single", required: true, options: (options.data ?? []).flatMap((row) => row.invoiceId ? [{ value: row.invoiceId, label: `${row.code ?? "Invoice"} · ${row.customer ?? "Customer"}` }] : []) },
    { type: InputTypes.SELECT, name: "kind", label: "Approved resolution", source: "sync", mode: "single", required: true, options: ["Credit", "Refund", "Replacement"].map((value) => ({ value, label: value })) },
    { type: InputTypes.SELECT, name: "currency", label: "Invoice currency", source: "sync", mode: "single", required: true, options: (invoice?.currencies ?? []).flatMap((row) => row.id ? [{ value: row.id, label: row.label ?? "Currency" }] : []) },
    { type: InputTypes.NUMBER, name: "amount", label: "Amount on the approved Finance document (zero for replacement only)", required: true },
    { type: InputTypes.TEXT, name: "reference", label: "Credit note / refund / replacement document reference", required: true },
    { type: InputTypes.TEXTAREA, name: "evidence", label: "Finance approval and settlement evidence", required: true },
    ...(kind?.value === "Replacement" ? [{ type: InputTypes.SELECT, name: "replacement", label: "Approved replacement customer order", mode: "single", source: "async", loadOptions: loader, required: true } satisfies WizardField<Values>] : []),
  ], [options.data, invoice?.currencies, kind?.value, loader]);
  const submit = form.handleSubmit(async (values) => {
    const denied = permission.check(); if (denied) { setMessage(denied); return; }
    if (!values.invoice || !values.kind || !values.currency) { setMessage("Choose the affected invoice, resolution and its invoice currency."); return; }
    const result = await save({ ...recallAudit, id, domainEntitiesFinishedGoodsRecordProductRecallSettlementRequest: {
      invoiceId: values.invoice.value, kind: values.kind.value, currencyId: values.currency.value, amount: values.amount,
      reference: values.reference, evidence: values.evidence, replacementProductionOrderId: values.replacement?.value ?? null } });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; } onSaved(); onClose();
  });
  return <FormDialog allowed={permission.allowed} title="Record Finance resolution" description="Link the approved Finance document to the recall. This records its evidence; it does not post a duplicate credit/refund, move stock or automatically ship a replacement."
    form={form} fields={fields} message={options.error ? apiErrorMessage(options.error) : message} busy={saving.isLoading || options.isLoading} submitLabel="Record resolution" onSubmit={(event) => void submit(event)} onClose={onClose} />;
}
