import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { permissionDeniedMessage, usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import type { SelectOption } from "@/shared/forms/form-wizard-types";
import { InputTypes } from "@/shared/forms/input-types";
import { migrationAudit, stockMigrationApi, type LineDto } from "../api/stock-migration-api";
import { lineFormValues, lineRequest, openingBalancePermissions } from "../lib/stock-migration";
import { lineFormSchema, type LineFormValues } from "../schemas/stock-migration-schema";

function SheetValue({ label, value }: { label: string; value: string | null | undefined }) {
  return <div className="min-w-0"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="break-words">{value || "–"}</dd></div>;
}

/** Corrects one sheet row. Every row is checked again when it is saved. */
export function StockMigrationLineDialog({ migrationId, line, quantityUnit, shelves, onClose }: {
  migrationId: string; line: LineDto; quantityUnit: string; shelves: readonly SelectOption[]; onClose: () => void;
}) {
  const [save, { isLoading }] = stockMigrationApi.useUpdateLineMutation();
  const permission = usePermissionAction(openingBalancePermissions.correct);
  const [message, setMessage] = useState("");
  const form = useForm<LineFormValues>({ resolver: zodResolver(lineFormSchema), defaultValues: lineFormValues(line, shelves) });
  const choices = useMemo(() => (line.materialChoices ?? []).flatMap((item) => item.id ? [{ value: item.id, label: `${item.code ?? ""} · ${item.name ?? ""}` }] : []), [line.materialChoices]);
  const picksMaterial = choices.length > 1 || Boolean(line.materialId);

  const fields = useMemo((): WizardField<LineFormValues>[] => [
    { type: InputTypes.TEXT, name: "materialCode", label: "Material code", required: true, description: "Changing the code clears the previous material choice when saved." },
    ...(picksMaterial
      ? [{ type: InputTypes.SELECT, name: "material", label: "Material", mode: "single", source: "sync", className: "md:col-span-2",
        options: choices.length ? choices : [{ value: line.materialId ?? "", label: `${line.resolvedMaterialCode ?? ""} · ${line.resolvedMaterialName ?? ""}` }], placeholder: "Choose the material" } satisfies WizardField<LineFormValues>]
      : []),
    { type: InputTypes.SELECT, name: "shelf", label: "Shelf", mode: "single", source: "sync", options: shelves, placeholder: line.shelfName ? `Sheet says ${line.shelfName}` : "Choose a shelf",
      searchPlaceholder: "Search shelves", className: picksMaterial ? "md:col-span-2" : "md:col-span-2" },
    { type: InputTypes.TEXT, name: "batchNumber", label: "Batch number (optional)", description: "A blank batch number keeps this row as a separate lot." },
    { type: InputTypes.TEXT, name: "unitSymbol", label: "Base UOM in the sheet", description: "Quantity conversion follows the file's weight and liquid settings." },
    { type: InputTypes.NUMBER, name: "quantityInSheet", label: `Quantity (${quantityUnit})`, min: 0, description: `Enter the amount in ${quantityUnit}; leave empty for no stock.` },
    ...(line.exactDates
      ? [{ type: InputTypes.DATE, name: "manufacturedDay", label: "Manufacturing date", maxDate: new Date() },
        { type: InputTypes.DATE, name: "expiryDay", label: "Expiry date" }] satisfies WizardField<LineFormValues>[]
      : [{ type: InputTypes.MONTH, name: "manufactured", label: "Manufactured" },
        { type: InputTypes.MONTH, name: "expiry", label: "Expiry" }] satisfies WizardField<LineFormValues>[]),
    { type: InputTypes.DATE, name: "retest", label: "Retest date", description: "Leave empty when the lot has none." },
    { type: InputTypes.TEXT, name: "grn", label: "GRN reference" },
    { type: InputTypes.TEXT, name: "arNumber", label: "AR number" },
    { type: InputTypes.CHECKBOX, name: "excluded", label: "Leave this row out", className: "md:col-span-3" },
  ], [choices, line, picksMaterial, quantityUnit, shelves]);

  const submit = form.handleSubmit(async (values) => {
    const denied = permission.check();
    if (denied) { setMessage(denied); return; }
    setMessage("");
    const result = await save({ ...migrationAudit, id: migrationId, lineId: line.id ?? "", domainEntitiesMaterialsStockMigrationsUpdateStockMigrationLineRequest: lineRequest(line, values) });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    onClose();
  });

  return <Dialog open onOpenChange={(open) => { if (!open && !isLoading) onClose(); }}>
    <DialogContent className="sm:max-w-3xl">
      <DialogHeader><DialogTitle>Correct row {line.rowNumber} of {line.sheet}</DialogTitle>
        <DialogDescription>Change what the row should be read as. The sheet itself is not changed.</DialogDescription></DialogHeader>
      <form noValidate onSubmit={(event) => { event.stopPropagation(); void submit(event); }} className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
        <DialogBody className="space-y-4">
          <dl className="grid gap-x-6 gap-y-2 rounded-md bg-muted/50 p-3 text-sm sm:grid-cols-4">
            <SheetValue label="Code and name" value={[line.sheetMaterialCode, line.sheetMaterialName].filter(Boolean).join(" · ")} />
            <SheetValue label="Store and shelf" value={[line.sheetWarehouse, line.sheetShelf].filter(Boolean).join(" · ")} />
            <SheetValue label="Batch" value={line.sheetBatchNumber} />
            <SheetValue label="Quantity" value={[line.sheetQuantity, line.sheetUnit].filter(Boolean).join(" ")} />
            <SheetValue label="AR number" value={line.arNumber} />
            <SheetValue label="GRN" value={line.grn} />
          </dl>
          {(line.blockers ?? []).map((text) => <p key={text} className="break-words text-sm text-destructive">{text}</p>)}
          <FormWizard form={form} fields={fields} className="md:grid-cols-3" />
          {message || !permission.allowed ? <p role="alert" className="break-words text-sm text-destructive">{message || permissionDeniedMessage}</p> : null}
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={isLoading} onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={isLoading || !permission.allowed}>{isLoading ? <><Spinner />Saving…</> : "Save and check"}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
