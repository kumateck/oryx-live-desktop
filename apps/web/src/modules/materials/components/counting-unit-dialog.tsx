import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type {
  DomainEntitiesMaterialsCountingUnitValue as CountingUnitValue,
  DomainEntitiesMaterialsMaterialCountingUnitPreview as CountingUnitPreview,
} from "@/shared/api/generated/materials";
import { settingsApi } from "@/shared/api/generated/settings";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { formatQuantityNumber } from "@/shared/units/quantity";
import { materialApi } from "../api/material-api";
import { audit, materialPermissions } from "../lib/materials";
import type { MaterialLink } from "../schemas/material-schema";

const previewSchema = z.object({
  unit: z.object({ value: z.string().min(1), label: z.string() }).nullable()
    .refine((value) => Boolean(value), "Choose a counting unit."),
  reason: z.string(),
});

const reasonSchema = z.string().trim().min(5, "Enter a reason of at least five characters.")
  .max(2000, "Keep the reason under 2,000 characters.");
type Values = z.infer<typeof previewSchema>;

const reasonFields: WizardField<Values>[] = [
  { type: InputTypes.TEXTAREA, name: "reason", label: "Reason for change", required: true },
];

function amount(quantity: number | undefined, unit: string | null | undefined) {
  return quantity === undefined ? "Unavailable" : `${formatQuantityNumber(quantity, "calculated")} ${unit ?? ""}`.trim();
}

function Comparison({ label, values }: { label: string; values: CountingUnitValue[] }) {
  return <Table aria-label={label} className="table-fixed">
    <TableHeader><TableRow>
      <TableHead scope="col">Quantity</TableHead>
      <TableHead scope="col" className="text-right">Before</TableHead>
      <TableHead scope="col" className="text-right">After</TableHead>
    </TableRow></TableHeader>
    <TableBody>{values.map((value, index) => <TableRow key={`${value.label}-${index}`}>
      <TableCell className="whitespace-normal break-words">{value.label}</TableCell>
      <TableCell className="whitespace-normal break-words text-right tabular-nums">{amount(value.before, value.beforeUnit)}</TableCell>
      <TableCell className="whitespace-normal break-words text-right tabular-nums">{amount(value.after, value.afterUnit)}</TableCell>
    </TableRow>)}</TableBody>
  </Table>;
}

export function CountingUnitDialog({ link, onClose }: { link: MaterialLink; onClose: () => void }) {
  const { material } = link;
  const permission = usePermissionAction(materialPermissions.countingUnit[material.kind]);
  const [loadUnits, units] = settingsApi.usePostApiV1CollectionMutation();
  const [previewRaw, rawPreview] = materialApi.useLazyPreviewRawMaterialCountingUnitQuery();
  const [previewPackaging, packagingPreview] = materialApi.useLazyPreviewPackagingMaterialCountingUnitQuery();
  const [changeRaw, rawChange] = materialApi.useChangeRawMaterialCountingUnitMutation();
  const [changePackaging, packagingChange] = materialApi.useChangePackagingMaterialCountingUnitMutation();
  const [preview, setPreview] = useState<CountingUnitPreview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (permission.allowed) void loadUnits({ ...audit, body: ["UnitOfMeasure"] });
  }, [loadUnits, permission.allowed]);

  const form = useForm<Values>({
    resolver: zodResolver(previewSchema),
    defaultValues: { unit: link.unitId && link.unit ? { value: link.unitId, label: link.unit } : null, reason: "" },
  });
  void form.formState.errors;
  const selected = useWatch({ control: form.control, name: "unit" });
  const current = preview?.toUnitId === selected?.value ? preview : null;
  const reviewing = rawPreview.isFetching || packagingPreview.isFetching;
  const saving = rawChange.isLoading || packagingChange.isLoading;
  const busy = reviewing || saving;
  const blockers = current?.blockers ?? [];
  const canApply = current?.hasChanges === true && Boolean(current.previewHash) && blockers.length === 0;
  const unitFields = useMemo((): WizardField<Values>[] => [{
    type: InputTypes.SELECT, name: "unit", label: "New counting unit", mode: "single", source: "sync", required: true,
    options: (units.data?.UnitOfMeasure ?? []).flatMap(({ id, symbol }) => id && symbol?.trim() && symbol.trim().toLowerCase() !== "g/ml"
      ? [{ value: id, label: symbol.trim() }] : []),
    placeholder: units.isLoading ? "Loading units…" : "Select a unit",
  }], [units.data, units.isLoading]);

  const showPreview = form.handleSubmit(async ({ unit }) => {
    const denied = permission.check();
    if (denied) { setError(denied); return; }
    if (!unit) return;
    setError(null);
    setPreview(null);
    const result = await (material.kind === 0 ? previewRaw : previewPackaging)({ ...audit, materialId: material.id, unitId: unit.value });
    if ("error" in result) { setError(apiErrorMessage(result.error)); return; }
    setPreview(result.data ?? null);
  });

  const confirm = form.handleSubmit(async ({ reason, unit }) => {
    if (!canApply || !current?.previewHash || !unit) return;
    const parsed = reasonSchema.safeParse(reason);
    if (!parsed.success) { form.setError("reason", { message: parsed.error.issues[0]?.message ?? "Enter a reason for the change." }); return; }
    const denied = permission.check();
    if (denied) { setError(denied); return; }
    setError(null);
    const result = await (material.kind === 0 ? changeRaw : changePackaging)({
      ...audit,
      materialId: material.id,
      domainEntitiesMaterialsChangeMaterialCountingUnit: { unitId: unit.value, previewHash: current.previewHash, reason: parsed.data },
    });
    if ("error" in result) {
      setError(apiErrorMessage(result.error));
      if (result.error && "status" in result.error && result.error.status === 409) setPreview(null);
      return;
    }
    toast.success(result.data?.changed ? "Counting unit change applied" : "Counting unit is up to date", { description: material.name });
    onClose();
  });

  if (!permission.allowed) return null;
  return <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
    <DialogContent className="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>Change counting unit · {material.name}</DialogTitle>
        <DialogDescription>Currently counted in {link.unit ?? "an unknown unit"}. Review the converted quantities before confirming. Choose the current unit to check for records still using an earlier unit.</DialogDescription>
      </DialogHeader>
      <form noValidate onSubmit={(event) => { event.preventDefault(); event.stopPropagation(); }} className="flex min-h-0 flex-1 flex-col gap-4">
        <DialogBody className="space-y-4">
          <fieldset disabled={busy} className="space-y-3">
            <FormWizard form={form} fields={unitFields} />
            <Button type="button" variant="outline" disabled={busy || !selected || units.isLoading} onClick={() => void showPreview()}>
              {reviewing ? "Loading preview…" : current ? "Refresh preview" : "Preview change"}
            </Button>
          </fieldset>
          {units.error ? <div className="flex flex-wrap items-center gap-2">
            <p role="alert" className="text-sm text-destructive">{apiErrorMessage(units.error)}</p>
            <Button type="button" size="sm" variant="outline" disabled={busy}
              onClick={() => void loadUnits({ ...audit, body: ["UnitOfMeasure"] })}>Retry units</Button>
          </div> : null}
          {blockers.length > 0 ? <ul role="alert" className="list-disc space-y-1 pl-5 text-sm text-destructive">
            {blockers.map((blocker) => <li key={blocker}>{blocker}</li>)}
          </ul> : null}
          {current && blockers.length === 0 ? <div aria-live="polite" className="space-y-4">
            {current.densityGramsPerMilliliter != null ? <p className="text-sm">Verified density {current.densityGramsPerMilliliter} g/mL</p> : null}
            {!current.hasChanges ? <p className="text-sm text-muted-foreground">The counting unit and saved quantities are up to date.</p> : null}
            <Comparison label="Stock and stock levels" values={[...(current.stock ? [current.stock] : []), ...(current.reserved ? [current.reserved] : []), ...(current.levels ?? [])]} />
            {[{ label: "Batch requirements", records: current.batches }, { label: "Requisition items", records: current.requisitions },
              { label: "Extra material requests", records: current.extraRequests }, { label: "Packaging definitions", records: current.packaging }]
              .filter(({ records }) => records?.length).map(({ label, records }) => <details key={label} className="border-t pt-3">
                <summary className="cursor-pointer text-sm font-medium">{label} ({records?.length})</summary>
                <div className="mt-2 space-y-3">{records?.map((record) => <section key={record.id}>
                  <h3 className="mb-1 text-sm font-medium">{record.reference}</h3>
                  <Comparison label={record.reference ?? label} values={record.values ?? []} />
                </section>)}</div>
              </details>)}
            {canApply ? <fieldset disabled={busy}><FormWizard form={form} fields={reasonFields} /></fieldset> : null}
          </div> : null}
          {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={busy} onClick={onClose}>Cancel</Button>
          <Button type="button" disabled={busy || !canApply} onClick={() => void confirm()}>
            {saving ? "Applying…" : "Confirm counting unit change"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
