import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatMonthYear } from "@/shared/format/dates";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { usePostApiV1CollectionMutation, usePostApiV1QaAnalyticalTestsMutation } from "../../api/activity-api";
import { atrProblem, atrRequest, type TestStage } from "../../lib/atr";
import { testStageLabel } from "../../lib/step-status";
import type { BatchRecord } from "../../schemas/activity-schema";
import { atrFormSchema, type AtrFormValues } from "../../schemas/atr-schema";

const audit = { module: "Quality Assurance", subModule: "Analytical Test Request" } as const;
const none: { value: string; label: string }[] = [];

/** Asks Quality Control to test the batch at this step's stage. */
export function AtrDialog({ stage, record, batchId, stepId, productName, onRaised, onClose }: {
  stage: TestStage | null; record: BatchRecord | null; batchId: string; stepId: string; productName: string;
  /** Called once the request exists, so the step can be moved on. */
  onRaised: () => Promise<void>;
  onClose: () => void;
}) {
  const [create, mutation] = usePostApiV1QaAnalyticalTestsMutation();
  const [loadStates, states] = usePostApiV1CollectionMutation();
  const [message, setMessage] = useState("");
  const form = useForm<AtrFormValues>({ resolver: zodResolver(atrFormSchema), defaultValues: { filled: "" } });
  useEffect(() => { void loadStates({ module: "General", subModule: "Collection", body: ["ProductState"] }); }, [loadStates]);

  const stateRows = states.data?.ProductState;
  const stateOptions = useMemo(() => stateRows ? stateRows.flatMap((item) => item.id ? [{ value: item.id, label: item.name?.trim() || "Unnamed" }] : []) : none, [stateRows]);
  const fields = useMemo(() => [
    { type: InputTypes.SELECT, name: "state", label: "Product state", mode: "single", source: "sync", options: stateOptions, required: true,
      placeholder: states.isLoading ? "Loading…" : stateOptions.length ? "Select the state" : "No product states are set up" },
    { type: InputTypes.TEXT, name: "filled", label: "Filled volume", required: true, placeholder: "For example 100 ml" },
  ] as const satisfies readonly WizardField<AtrFormValues>[], [stateOptions, states.isLoading]);
  const problem = atrProblem(stage, record);
  const facts = [["Product", productName], ["Batch number", record?.batchNumber ?? "–"], ["Test stage", stage === null ? "Not set" : testStageLabel(stage)],
    ["Manufactured", formatMonthYear(record?.manufacturingDate) ?? "–"], ["Expires", formatMonthYear(record?.expiryDate) ?? "–"]];

  const submit = form.handleSubmit(async (values) => {
    setMessage("");
    if (stage === null || !record?.id) return;
    const result = await create({ ...audit, domainEntitiesAnalyticalTestRequestsCreateAnalyticalTestRequest:
      atrRequest({ stage, record: { ...record, id: record.id }, batchId, stepId, stateId: values.state.value, filled: values.filled }) });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    toast.success("Analytical test request sent to Quality Control");
    await onRaised();
    onClose();
  });

  return <Dialog open onOpenChange={(open) => { if (!open && !mutation.isLoading) onClose(); }}>
    <DialogContent className="sm:max-w-2xl">
      <DialogHeader><DialogTitle>Request an analytical test</DialogTitle>
        <DialogDescription>Quality Control samples and tests the batch. The step moves on when the result is released.</DialogDescription></DialogHeader>
      <form noValidate onSubmit={(event) => { event.stopPropagation(); void submit(event); }} className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
        <DialogBody className="space-y-4">
          <dl className="grid gap-x-8 gap-y-2 rounded-md bg-muted/50 p-3 sm:grid-cols-2">{facts.map(([label, value]) =>
            <div key={label} className="min-w-0"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="break-words text-sm font-medium">{value}</dd></div>)}</dl>
          {problem ? <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">{problem}</p> : <FormWizard form={form} fields={fields} className="md:grid-cols-2" />}
          {states.error ? <p role="alert" className="text-sm text-destructive">Product states could not be loaded. {apiErrorMessage(states.error)}</p> : null}
          {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={mutation.isLoading} onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={Boolean(problem) || mutation.isLoading}>{mutation.isLoading ? <><Spinner />Sending…</> : "Send request"}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
