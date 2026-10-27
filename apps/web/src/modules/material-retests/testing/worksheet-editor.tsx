import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { qcApi } from "@/shared/api/generated/qc";
import { settingsApi } from "@/shared/api/generated/settings";
import { Button } from "@/components/ui/button";
import { useAccess } from "@/shared/auth/use-access";
import { useCurrentUser } from "@/shared/auth/session-provider";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { UnsavedChangesGuard } from "@/shared/navigation/unsaved-changes";
import { RichTextView } from "@/shared/rich-text/rich-text-view";
import { DropdownButton } from "@/shared/actions";
import { buildWorksheetCells, definitionsFor, fillSchema, worksheetColumns, worksheetPermission, type Worksheet, type WorksheetValues } from "./worksheet-model";
import { WorksheetCellContext } from "./cell-context";
import { WorksheetActionDialog, type WorksheetAction } from "./worksheet-action";
import { WorksheetReadings } from "./worksheet-readings";
import { retestAudit as audit } from "../schemas/retest";
const loadCell = () => import("./cell-control");
export function WorksheetEditor({ record, onDone }: { record: Worksheet; onDone: () => void }) {
  try {
    for (const field of record.sections.flatMap((section) => section.fields)) {
      definitionsFor(field);
      if (field.type === 8) worksheetColumns(field);
    }
  } catch (failure) {
    return <p role="alert" className="text-sm text-destructive">{failure instanceof Error ? failure.message : "The worksheet definition could not be read."} Review the pinned template before entering results.</p>;
  }
  return <WorksheetForm record={record} onDone={onDone} />;
}
function WorksheetForm({ record, onDone }: { record: Worksheet; onDone: () => void }) {
  const user = useCurrentUser();
  const { has } = useAccess();
  const allFields = useMemo(() => record.sections.flatMap((section) => section.fields), [record]);
  const [extraRows, setExtraRows] = useState<ReadonlyMap<string, number>>(new Map());
  const definitions = useMemo(() => allFields.flatMap((field) => definitionsFor(field, extraRows.get(field.fieldKey) ?? 0)), [allFields, extraRows]);
  const initial = useMemo(() => buildWorksheetCells(record, definitions), [record, definitions]);
  const form = useForm<WorksheetValues>({ resolver: zodResolver(fillSchema), defaultValues: initial });
  const needsEquipment = definitions.some((cell) => cell.type === 14);
  const needsReagent = definitions.some((cell) => cell.type === 15 || cell.type === 16);
  const equipment = qcApi.useGetApiV1QcEquipmentAllQuery(audit, { skip: !needsEquipment || !has("CanViewQcEquipment") });
  const reagents = settingsApi.useGetApiV1CollectionByItemTypeQuery({ ...audit, itemType: "Reagent" }, { skip: !needsReagent });
  const enter = worksheetPermission(record.analysisType, "enter");
  const mine = record.assignedToId === user?.id;
  const editable = record.status === 1 && mine && has(enter);
  const [action, setAction] = useState<{ kind: WorksheetAction; values: WorksheetValues } | null>(null);
  const [error, setError] = useState("");
  const options = { equipment: (equipment.data ?? []).flatMap((row) => row.id ? [{ value: row.id, label: row.name ?? row.id }] : []), reagents: (reagents.data ?? []).flatMap((row) => row.id ? [{ value: row.id, label: row.name ?? row.id }] : []) };
  const submit = form.handleSubmit((values) => setAction({ kind: "save", values: structuredClone(values) }));
  const addRow = (key: string) => {
    const values = form.getValues();
    const rows = new Map(extraRows).set(key, (extraRows.get(key) ?? 0) + 1);
    const next = allFields.flatMap((field) => definitionsFor(field, rows.get(field.fieldKey) ?? 0));
    const defaults = buildWorksheetCells(record, next);
    const merged = defaults.cells.map((cell) => values.cells.find((entry) => entry.fieldKey === cell.fieldKey && entry.rowIndex === cell.rowIndex && entry.columnKey === cell.columnKey) ?? cell);
    setExtraRows(rows); form.reset({ cells: merged }, { keepDirty: true });
  };
  const openSubmit = () => {
    if (form.formState.isDirty) { setError("Save your entered values before submitting the worksheet."); return; }
    setAction({ kind: "submit", values: form.getValues() });
  };
  return <WorksheetCellContext.Provider value={{ definitions, ...options, instanceId: record.id, require: enter }}>
    <div className="space-y-4"><UnsavedChangesGuard when={form.formState.isDirty} />
      <DropdownButton label="Worksheet actions" items={[
        record.status === 0 && mine && { id: "start", label: "Start worksheet", require: worksheetPermission(record.analysisType, "start"), onSelect: () => setAction({ kind: "start", values: form.getValues() }) },
        record.status === 2 && { id: "approve", label: "Sign worksheet approval", require: worksheetPermission(record.analysisType, "review"), onSelect: () => setAction({ kind: "approve", values: form.getValues() }) },
        record.status === 2 && { id: "reject", label: "Return with signed reason", require: worksheetPermission(record.analysisType, "review"), onSelect: () => setAction({ kind: "reject", values: form.getValues() }) },
        record.status === 0 && { id: "assign", label: "Assign analyst", require: "CanAssignWorksheet", onSelect: () => setAction({ kind: "assign", values: form.getValues() }) },
        record.status !== 4 && Boolean(record.assignedToId) && { id: "reassign", label: "Reassign analyst", require: "CanReassignWorksheet", onSelect: () => setAction({ kind: "reassign", values: form.getValues() }) },
      ]} />
      <p className="text-sm text-muted-foreground">{record.worksheetTemplateCode} · version {record.worksheetTemplateVersion} · {record.analysisType === 0 ? "Chemical" : "Microbial"}. Calculated and reference values remain server-owned.</p>
      {record.oosCases?.some((item) => item.blocksRelease) ? <p role="alert" className="text-sm text-destructive">An open OOS case blocks release. The server retains the hold until its disposition is complete.</p> : null}
      <form noValidate onSubmit={(event) => void submit(event)} className="space-y-4">
        {record.sections.map((section) => <section key={section.id} className="min-w-0 space-y-3 border-t pt-3"><h2 className="font-semibold"><RichTextView html={section.name ?? "Worksheet section"} /></h2>
          {section.fields.map((field) => {
            const fields: WizardField<WorksheetValues>[] = definitions.flatMap((definition, index) => definition.fieldKey === field.fieldKey ? [{ type: InputTypes.CUSTOM, name: `cells.${index}.value`, label: definition.label, required: definition.required, load: loadCell, disabled: !editable }] : []);
            return <section key={field.id} className="min-w-0 space-y-2"><h3 className="font-medium">{field.label ?? field.fieldKey}</h3>
              <WorksheetReadings field={field} instanceId={record.id} />
              {fields.length ? <FormWizard form={form} fields={fields} className="md:grid-cols-2" /> : null}
              {field.type === 8 && editable && !worksheetColumns(field).some((column) => column.fixedValues?.length) ? <Button type="button" size="sm" variant="outline" onClick={() => { try { addRow(field.fieldKey); } catch (failure) { setError(failure instanceof Error ? failure.message : "Could not add a row."); } }}>Add table row</Button> : null}
            </section>;
          })}
        </section>)}
        {error || equipment.error || reagents.error ? <p role="alert" className="text-sm text-destructive">{error || "Equipment or reagent choices could not be loaded. Retry the page before saving."}</p> : null}
        {editable ? <div className="flex flex-wrap justify-end gap-2"><Button type="submit" variant="outline">Save draft values</Button><Button type="button" disabled={!has(worksheetPermission(record.analysisType, "submit"))} onClick={openSubmit}>Submit worksheet</Button></div> : null}
      </form>
      {action ? <WorksheetActionDialog record={record} action={action.kind} values={action.values} onClose={() => setAction(null)} onDone={() => { setAction(null); form.reset(form.getValues()); onDone(); }} /> : null}
    </div>
  </WorksheetCellContext.Provider>;
}
