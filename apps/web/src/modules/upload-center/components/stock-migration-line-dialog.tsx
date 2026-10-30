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
import { lineFormValues, lineRequest, migrationPermission } from "../lib/stock-migration";
import { lineFormSchema, type LineFormValues } from "../schemas/stock-migration-schema";

function SheetValue({ label, value }: { label: string; value: string | null | undefined }) {
  return <div className="min-w-0"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="break-words">{value || "–"}</dd></div>;
}

/** Corrects one sheet row. Every row is checked again when it is saved. */
export function StockMigrationLineDialog({ migrationId, line, shelves, onClose }: {
  migrationId: string; line: LineDto; shelves: readonly SelectOption[]; onClose: () => void;
}) {
  const [save, { isLoading }] = stockMigrationApi.useUpdateLineMutation();
  const permission = usePermissionAction(migrationPermission);
  const [message, setMessage] = useState("");
  const form = useForm<LineFormValues>({ resolver: zodResolver(lineFormSchema), defaultValues: lineFormValues(line, shelves) });
  const choices = useMemo(() => (line.materialChoices ?? []).flatMap((item) => item.id ? [{ value: item.id, label: `${item.code ?? ""} · ${item.name ?? ""}` }] : []), [line.materialChoices]);
  const picksMaterial = choices.length > 0 || Boolean(line.materialId);

  const fields = useMemo((): WizardField<LineFormValues>[] => [
    picksMaterial
      ? { type: InputTypes.SELECT, name: "material", label: "Material", mode: "single", source: "sync", required: true, className: "md:col-span-2",
        options: choices.length ? choices : [{ value: line.materialId ?? "", label: `${line.resolvedMaterialCode ?? ""} · ${line.resolvedMaterialName ?? ""}` }], placeholder: "Choose the material" }
      : { type: InputTypes.TEXT, name: "materialCode", label: "Material code", required: true },
    { type: InputTypes.SELECT, name: "shelf", label: "Shelf", mode: "single", source: "sync", options: shelves, placeholder: line.shelfName ? `Sheet says ${line.shelfName}` : "Choose a shelf",
      searchPlaceholder: "Search shelves", className: picksMaterial ? "md:col-span-2" : "md:col-span-2" },
    { type: InputTypes.TEXT, name: "batchNumber", label: "Batch number", required: true },
    { type: InputTypes.TEXT, name: "unitSymbol", label: "Unit in the sheet" },
    { type: InputTypes.NUMBER, name: "quantityInSheet", label: "Quantity in the sheet", min: 0, description: "In the sheet's unit; leave empty for no stock." },
    { type: InputTypes.MONTH, name: "manufactured", label: "Manufactured" },
    { type: InputTypes.MONTH, name: "expiry", label: "Expiry" },
    { type: InputTypes.CHECKBOX, name: "excluded", label: "Leave this row out", className: "md:col-span-3" },
  ], [choices, line, picksMaterial, shelves]);

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
