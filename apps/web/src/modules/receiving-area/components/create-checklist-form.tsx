import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useBillingCollections } from "@/modules/billing-sheets/hooks/use-billing-collections";
import { KeyFact, KeyFacts } from "@/shared/detail/key-facts";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { PageHeader } from "@/shared/navigation/page-header";
import { UnsavedChangesGuard } from "@/shared/navigation/unsaved-changes";
import { formatQuantityNumber, toLargestUnit } from "@/shared/units/quantity";
import { useCreateChecklistMutation } from "../api/receiving-api";
import { checklistRequest } from "../lib/checklist-request";
import { accountsFor, audit, batchesTotal, carrierOptions, enteredUnit, intactnessOptions, receivingListPath, receivingStatus, toEntered, viewChecklistPath } from "../lib/receiving";
import { checklistFormSchema, type ChecklistFormValues, type DeliveredMaterial } from "../schemas/receiving-schema";
import { BatchLinesEditor, emptyBatch } from "./batch-lines-editor";

const yesNo = [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }];
const fields: WizardField<ChecklistFormValues>[] = [
  { type: InputTypes.DATE, name: "checkedAt", label: "Date checked", required: true, maxDate: new Date() },
  { type: InputTypes.SELECT, name: "carrier", label: "Condition of the consignment carrier", mode: "single", source: "sync", options: carrierOptions, required: true },
  { type: InputTypes.RADIO, name: "certificate", label: "Certificate of analysis delivered?", options: yesNo, required: true },
  { type: InputTypes.RADIO, name: "labelled", label: "Containers properly labelled?", options: yesNo, required: true },
  { type: InputTypes.SELECT, name: "intactness", label: "Intactness of the containers", mode: "single", source: "sync", options: intactnessOptions, required: true },
];

/** Records how a delivered material looked on arrival and the batches it came in. Written once; the batches must account for all of it. */
export function CreateChecklistForm({ material }: { material: DeliveredMaterial & { materialId: string } }) {
  const navigate = useNavigate();
  const collections = useBillingCollections("styles");
  const [create, creating] = useCreateChecklistMutation();
  const [message, setMessage] = useState("");
  const [saved, setSaved] = useState(false);
  const [schema] = useState(() => checklistFormSchema(material.kind));
  const form = useForm<ChecklistFormValues>({ resolver: zodResolver(schema), defaultValues: { checkedAt: new Date(), certificate: "", labelled: "", intactness: null, carrier: null, batches: [emptyBatch()] } });
  // Read here so the form re-renders, and its fields show their messages, when validation fails.
  void form.formState.errors;
  const unit = enteredUnit(material.unit);
  const batches = useWatch({ control: form.control, name: "batches" });
  const typed = useMemo(() => batchesTotal(batches ?? []), [batches]);
  const expected = toEntered(material.quantity, material.unit);
  const complete = accountsFor(batches ?? [], material.quantity, material.unit);
  const back = receivingListPath(receivingStatus.pending, material.kind);

  const submit = form.handleSubmit(async (values) => {
    setMessage("");
    if (!accountsFor(values.batches, material.quantity, material.unit)) { setMessage(`The batches add up to ${formatQuantityNumber(batchesTotal(values.batches), "calculated")} ${unit}; they have to account for the ${formatQuantityNumber(expected, "calculated")} ${unit} delivered.`); return; }
    const body = checklistRequest(material, values);
    if (!body) { setMessage("The checklist is incomplete. Check the fields above."); return; }
    const result = await create({ ...audit, body });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    toast.success("Checklist saved", { description: `${material.materialName} is checked and can go on a goods received note.` });
    setSaved(true);
    void navigate(viewChecklistPath(material.id));
  });
  const busy = creating.isLoading;

  return <form noValidate onSubmit={(event) => void submit(event)} className="min-w-0 space-y-4">
    <UnsavedChangesGuard when={form.formState.isDirty && !busy && !saved} />
    <PageHeader title={`Checklist · ${material.materialName}`} crumbs={[{ label: "Pending receiving", to: back }, { label: "Checklist" }]}
      actions={<><Button type="button" variant="outline" disabled={busy} onClick={() => void navigate(back)}>Cancel</Button><Button type="submit" disabled={busy}>{busy ? <><Spinner />Saving…</> : "Save checklist"}</Button></>} />
    <KeyFacts>
      <KeyFact label="Material" value={material.materialName} note={material.materialCode ?? "No code"} />
      <KeyFact label="Delivered" value={toLargestUnit(material.quantity, material.unit, "calculated")?.text ?? String(material.quantity)} />
      <KeyFact label="Supplier" value={material.supplierName ?? "–"} />
      <KeyFact label="Manufacturer" value={material.manufacturer ?? "Not recorded"} />
      <KeyFact label="Invoice" value={material.invoiceCode ?? "–"} />
    </KeyFacts>
    <section className="rounded-lg border bg-card p-4"><FormWizard form={form} fields={fields} className="md:grid-cols-2" /></section>
    {collections.error ? <p role="alert" className="text-sm text-destructive">{collections.error} <Button type="button" size="sm" variant="link" onClick={collections.retry}>Retry</Button></p> : null}
    <BatchLinesEditor form={form} kind={material.kind} unit={unit} styles={collections.packageStyles} loading={collections.loading} />
    <p role="status" className={`rounded-md border p-3 text-sm ${complete ? "bg-muted/50" : "border-amber-500/50 bg-amber-500/10"}`}>
      {formatQuantityNumber(typed, "calculated")} {unit} of the {formatQuantityNumber(expected, "calculated")} {unit} delivered is in the batches above.{complete ? "" : " The batches have to account for all of it."}</p>
    {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
  </form>;
}
