import { useEffect, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useGeneratedCode } from "@/shared/codes/use-generated-code";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { UnsavedChangesGuard } from "@/shared/navigation/unsaved-changes";
import { usePostApiV1ProductionScheduleMutation } from "../api/schedule-api";
import { useScheduleOptions } from "../hooks/use-schedule-options";
import { audit, scheduleCodeModel, schedulesPath } from "../lib/schedule-access";
import { today } from "../lib/schedule-dates";
import { scheduleHeaderFields } from "../lib/schedule-header-fields";
import { batchQuantity, batchSizes, toScheduleProducts, type ScheduleLine as Line } from "../lib/schedule-products";
import { scheduleFormSchema, type ScheduleFormValues, type ScheduleLineValues } from "../schemas/schedule-schema";
import { ScheduleLine } from "./schedule-line";

const emptyLine = (): ScheduleLineValues => ({ product: null, packing: null, sizeType: batchSizes[0], market: null, count: 1 });
const codeField = [{ type: InputTypes.TEXT, name: "code", label: "Schedule code", required: true }] as const satisfies readonly WizardField<ScheduleFormValues>[];

export function CreateScheduleForm() {
  const navigate = useNavigate();
  const options = useScheduleOptions();
  const code = useGeneratedCode(scheduleCodeModel);
  const [create, mutation] = usePostApiV1ProductionScheduleMutation();
  const [message, setMessage] = useState("");
  const [headerFields] = useState(() => scheduleHeaderFields(today()) satisfies readonly WizardField<ScheduleFormValues>[]);
  const form = useForm<ScheduleFormValues>({ resolver: zodResolver(scheduleFormSchema), defaultValues: { code: "", remarks: "", products: [emptyLine()] } });
  const lines = useFieldArray({ control: form.control, name: "products" });
  const [saved, setSaved] = useState(false);

  const suggestCode = async (replace: boolean) => {
    const next = await code.suggest();
    if (next && (replace || !form.getValues("code"))) form.setValue("code", next, { shouldValidate: true, shouldDirty: replace });
  };
  // Offer a code once, when the rule has loaded, without overwriting what the user typed meanwhile.
  const suggested = useRef(false);
  useEffect(() => {
    if (!code.ready || suggested.current) return;
    suggested.current = true;
    void suggestCode(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code.ready]);

  const submit = form.handleSubmit(async (values) => {
    setMessage("");
    const request: Line[] = [];
    for (const [index, item] of values.products.entries()) {
      const quantity = batchQuantity(options.facts(item.product?.value), item.sizeType.value);
      if (!item.product || !item.packing) return;
      if (quantity === null) { form.setError(`products.${index}.product`, { message: "This product has no full batch size" }); return; }
      request.push({ productId: item.product.value, packingId: item.packing.value, sizeType: item.sizeType.value, marketTypeId: item.market?.value ?? null, count: item.count, quantity });
    }
    const result = await create({ ...audit, domainEntitiesProductionSchedulesCreateProductionScheduleRequest: {
      code: values.code, remarks: values.remarks ?? "", products: toScheduleProducts(request),
      scheduledStartTime: values.scheduledStartTime.toISOString(), scheduledEndTime: values.scheduledEndTime.toISOString(),
    } });
    if ("error" in result) {
      const reason = apiErrorMessage(result.error);
      if (/code is already in use/i.test(reason)) form.setError("code", { message: "This code is already used by another schedule. Use \"Suggest again\" or enter a different one." });
      else setMessage(reason);
      return;
    }
    toast.success("Production schedule created");
    setSaved(true);
    void navigate(schedulesPath);
  });
  const saving = mutation.isLoading;
  const listError = form.formState.errors.products?.root?.message ?? form.formState.errors.products?.message;

  return <form noValidate onSubmit={(event) => void submit(event)} className="min-w-0 space-y-4">
    <UnsavedChangesGuard when={form.formState.isDirty && !saving && !saved} />
    <section className="space-y-3 rounded-lg border bg-card p-4">
      <h2 className="text-sm font-semibold">Schedule</h2>
      <FormWizard form={form} fields={codeField} className="md:grid-cols-2" />
      <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        {code.unavailable ? "No code rule is set up for schedules; enter the code yourself." : "The code is suggested from the next number in the series. You can change it."}
        {code.ready ? <Button type="button" size="xs" variant="ghost" disabled={code.busy} onClick={() => void suggestCode(true)}>Suggest again</Button> : null}
      </p>
      <FormWizard form={form} fields={headerFields} className="md:grid-cols-2" />
    </section>
    <section className="space-y-3 rounded-lg border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div><h2 className="text-sm font-semibold">Products</h2><p className="text-xs text-muted-foreground">Each batch becomes its own entry on the schedule.</p></div>
        <Button type="button" size="sm" variant="outline" onClick={() => lines.append(emptyLine())}><Plus />Add product</Button>
      </div>
      {options.marketsUnavailable ? <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">Market types could not be loaded; your account may not be allowed to view customers. The field is optional.
        <Button type="button" size="xs" variant="ghost" onClick={options.retryMarkets}>Retry</Button></p> : null}
      <ul className="space-y-2">{lines.fields.map((field, index) => <ScheduleLine key={field.id} form={form} index={index} options={options}
        onRemove={lines.fields.length > 1 ? () => lines.remove(index) : null} />)}</ul>
      {listError ? <p role="alert" className="text-sm text-destructive">{listError}</p> : null}
    </section>
    {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
    <div className="flex justify-end gap-2">
      <Button type="button" variant="outline" disabled={saving} onClick={() => void navigate(schedulesPath)}>Cancel</Button>
      <Button type="submit" disabled={saving}>{saving ? <><Spinner />Creating…</> : "Create schedule"}</Button>
    </div>
  </form>;
}
