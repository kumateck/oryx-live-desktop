import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formDate } from "@/shared/format/date-boundary";
import { PageHeader } from "@/shared/navigation/page-header";
import { UnsavedChangesGuard } from "@/shared/navigation/unsaved-changes";
import { usePutApiV1ProcurementBillingSheetByBillingSheetIdMutation } from "../api/billing-api";
import { useBillingCollections } from "../hooks/use-billing-collections";
import { audit, billingSheetPath, billingSheetsPath } from "../lib/billing-access";
import { changeBlock, daysBetween, detailsRequest, freeDays } from "../lib/billing-rules";
import { editSheetSchema, type BillingSheet, type EditSheetValues } from "../schemas/billing-schema";
import { SheetDetailsFields } from "./sheet-details-fields";

const wholeNumber = (value: string | null) => { const number = Number(value); return value && Number.isInteger(number) && number > 0 ? number : Number.NaN; };

/** Corrects an approved sheet's details. Its invoice, supplier and charges stay as they are. */
export function EditBillingSheetForm({ sheet }: { sheet: BillingSheet }) {
  const navigate = useNavigate();
  const collections = useBillingCollections("styles");
  const [save, saving] = usePutApiV1ProcurementBillingSheetByBillingSheetIdMutation();
  const [message, setMessage] = useState("");
  const [saved, setSaved] = useState(false);
  const form = useForm<EditSheetValues>({ resolver: zodResolver(editSheetSchema), defaultValues: { code: sheet.code, billOfLading: sheet.billOfLading ?? "", arrival: formDate(sheet.arrival),
    // Older sheets carry the free time as free text; the days are then read from the two dates.
    freeDays: freeDays(sheet.freeTimeDuration) ?? daysBetween(sheet.arrival, sheet.freeTimeExpiry) ?? Number.NaN, containerNumber: sheet.containerNumber ?? "", packages: wholeNumber(sheet.packages),
    packageStyle: sheet.packageStyle ? { value: sheet.packageStyle.id, label: sheet.packageStyle.name } : null, packageDescription: sheet.packageDescription ?? "" } });
  // Read here so the form re-renders, and its fields show their messages, when validation fails.
  void form.formState.errors;
  const block = changeBlock(sheet);
  const back = billingSheetPath(sheet.id);

  const submit = form.handleSubmit(async (values) => {
    setMessage("");
    if (!values.arrival || !sheet.invoiceId) { setMessage("This sheet's invoice could not be read, so it cannot be saved."); return; }
    const result = await save({ ...audit, billingSheetId: sheet.id, domainEntitiesPurchaseOrdersRequestUpdateBillingSheetRequest:
      detailsRequest({ ...values, arrival: values.arrival, packageStyleId: values.packageStyle?.value ?? null }, sheet.invoiceId, sheet.supplier?.id ?? null) });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    toast.success("Billing sheet updated");
    setSaved(true);
    void navigate(back);
  });

  return <form noValidate onSubmit={(event) => void submit(event)} className="min-w-0 space-y-4">
    <UnsavedChangesGuard when={form.formState.isDirty && !saving.isLoading && !saved} />
    <PageHeader title={`Edit ${sheet.code}`} crumbs={[{ label: "Billing sheets", to: billingSheetsPath }, { label: sheet.code, to: back }, { label: "Edit" }]}
      actions={<><Button type="button" variant="outline" disabled={saving.isLoading} onClick={() => void navigate(back)}>Cancel</Button>
        <Button type="submit" disabled={saving.isLoading || block !== null}>{saving.isLoading ? <><Spinner />Saving…</> : "Save changes"}</Button></>} />
    {block ? <p role="alert" className="rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-sm">{block}</p> : null}
    {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
    <fieldset disabled={block !== null} className="min-w-0"><SheetDetailsFields form={form} styles={collections.packageStyles} loading={collections.loading} /></fieldset>
  </form>;
}
