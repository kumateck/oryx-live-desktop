import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import {
  useGetApiV1ProductionScheduleMaterialStockByProductionScheduleProductIdQuery, useGetApiV1ProductionSchedulePackageMaterialStockByProductionScheduleProductIdQuery,
} from "@/modules/schedules/api/schedule-api";
import { freeStock } from "@/modules/schedules/lib/batch-materials";
import { batchMaterialsSchema, type BatchMaterial } from "@/modules/schedules/schemas/batch-schema";
import { useGeneratedCode } from "@/shared/codes/use-generated-code";
import { ListDataTable, dataTableColumns } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { toLargestUnit } from "@/shared/units/quantity";
import { usePostApiV1RequisitionMutation } from "../../api/activity-api";
import { requisitionProblem, stockRequisitionRequest } from "../../lib/stock-requisition";
import { stockRequisitionFormSchema, type StockRequisitionFormValues } from "../../schemas/stock-requisition-schema";

const column = dataTableColumns<BatchMaterial>();
const quantity = (value: number, unit: string | null) => toLargestUnit(value, unit, "calculated")?.text ?? String(value);
const audit = { module: "Production", subModule: "Stock Requisition" } as const;

/** Asks the warehouse to issue everything the batch needs, on one voucher. */
export function StockRequisitionDialog({ batchId, stepId, batchLabel, onClose }: { batchId: string; stepId: string; batchLabel: string; onClose: () => void }) {
  const arg = { ...audit, productionScheduleProductId: batchId };
  const raw = useGetApiV1ProductionScheduleMaterialStockByProductionScheduleProductIdQuery(arg);
  const packaging = useGetApiV1ProductionSchedulePackageMaterialStockByProductionScheduleProductIdQuery(arg);
  const [create, mutation] = usePostApiV1RequisitionMutation();
  const code = useGeneratedCode("Requisition");
  const [message, setMessage] = useState("");
  const [today] = useState(() => { const now = new Date(); return new Date(now.getFullYear(), now.getMonth(), now.getDate()); });
  const form = useForm<StockRequisitionFormValues>({ resolver: zodResolver(stockRequisitionFormSchema), defaultValues: { code: "", expectedDelivery: today, comments: "" } });

  const suggest = code.suggest;
  useEffect(() => {
    if (!code.ready) return;
    void suggest().then((next) => { if (next && !form.getFieldState("code").isDirty) form.setValue("code", next, { shouldValidate: true }); });
  }, [code.ready, suggest, form]);

  const materials = useMemo(() => {
    const read = (data: object | undefined) => { const parsed = batchMaterialsSchema.safeParse(data ?? null); return parsed.success ? parsed.data : []; };
    return [...read(raw.data), ...read(packaging.data)];
  }, [raw.data, packaging.data]);
  const loading = raw.isLoading || packaging.isLoading;
  const failure = raw.error ?? packaging.error;
  const problems = useMemo(() => materials.flatMap((material) => { const problem = requisitionProblem(material); return problem ? [`${material.name}: ${problem}`] : []; }), [materials]);

  const fields = useMemo(() => [
    { type: InputTypes.TEXT, name: "code", label: "Requisition code", required: true },
    { type: InputTypes.DATE, name: "expectedDelivery", label: "Needed by", required: true, minDate: today },
    { type: InputTypes.TEXTAREA, name: "comments", label: "Remarks", rows: 2, className: "md:col-span-2" },
  ] as const satisfies readonly WizardField<StockRequisitionFormValues>[], [today]);
  const columns = useMemo(() => column.columns([
    column.accessor("name", { header: "Material", cell: ({ row }) => <div className="min-w-0"><div className="break-words font-medium">{row.original.name}</div>
      <div className="text-xs text-muted-foreground">{row.original.code || "No code"}</div></div> }),
    column.accessor((item) => quantity(item.needed, item.unit), { id: "needed", header: "To request", size: 140 }),
    column.accessor((item) => quantity(freeStock(item) + item.reserved, item.unit), { id: "stock", header: "Available to issue", size: 170 }),
  ]), []);

  const submit = form.handleSubmit(async (values) => {
    setMessage("");
    const result = await create({ ...audit, domainEntitiesRequisitionsRequestCreateRequisitionRequest: stockRequisitionRequest(values, materials, batchId, stepId) });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    toast.success("Stock requisition sent to the warehouse");
    onClose();
  });
  const blocked = loading || Boolean(failure) || materials.length === 0 || problems.length > 0;

  return <Dialog open onOpenChange={(open) => { if (!open && !mutation.isLoading) onClose(); }}>
    <DialogContent className="sm:max-w-3xl">
      <DialogHeader><DialogTitle>Request stock for {batchLabel}</DialogTitle>
        <DialogDescription>One voucher asks the warehouse for every material the batch needs.</DialogDescription></DialogHeader>
      <form noValidate onSubmit={(event) => { event.stopPropagation(); void submit(event); }} className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
        <DialogBody className="space-y-4">
          <FormWizard form={form} fields={fields} className="md:grid-cols-2" />
          <ListDataTable label="Materials to request" columns={columns} rows={materials} getRowId={(item) => item.id} loading={loading}
            error={failure ? apiErrorMessage(failure) : null} onRetry={() => { void raw.refetch(); void packaging.refetch(); }} emptyTitle="This batch needs no materials" />
          {problems.length ? <div role="alert" className="space-y-1 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
            <p className="font-medium text-destructive">The voucher cannot be sent until these are fixed:</p>
            <ul className="space-y-0.5">{problems.map((problem) => <li key={problem} className="break-words">{problem}</li>)}</ul></div> : null}
          {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={mutation.isLoading} onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={blocked || mutation.isLoading}>{mutation.isLoading ? <><Spinner />Sending…</> : "Send requisition"}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
