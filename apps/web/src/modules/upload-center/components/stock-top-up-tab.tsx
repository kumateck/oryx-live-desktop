import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { UnsavedChangesGuard } from "@/shared/navigation/unsaved-changes";
import { migrationAudit, stockMigrationApi } from "../api/stock-migration-api";
import { useDepartments } from "../hooks/use-departments";
import { massUnits, migrationPath, openingBalancePermissions, volumeUnits } from "../lib/stock-migration";
import { topUpLineRequest } from "../lib/stock-top-up";
import { emptyTopUpLine, topUpHeaderSchema, type TopUpHeaderValues } from "../schemas/stock-top-up-schema";
import { StockMigrationHistory } from "./stock-migration-history";
import { StockTopUpLineDialog } from "./stock-top-up-line-dialog";
import { StockTopUpRows, type TopUpRow } from "./stock-top-up-rows";

const options = (units: readonly string[]) => units.map((unit) => ({ value: unit, label: unit }));

export function StockTopUpTab() {
  const departments = useDepartments();
  const navigate = useNavigate();
  const permission = usePermissionAction(openingBalancePermissions.upload);
  const [create, createState] = stockMigrationApi.useCreateTopUpMutation();
  const [upload, uploadState] = stockMigrationApi.useUploadTopUpMutation();
  const [source, setSource] = useState("manual");
  const [rows, setRows] = useState<TopUpRow[]>([]);
  const [editing, setEditing] = useState<TopUpRow | "new" | null>(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const form = useForm<TopUpHeaderValues>({ resolver: zodResolver(topUpHeaderSchema), defaultValues: {
    department: departments.own, reason: "", massUnit: { value: "mg", label: "mg" }, volumeUnit: { value: "ml", label: "ml" }, file: null,
  } });
  const department = useWatch({ control: form.control, name: "department" });
  const ownDepartmentId = departments.own?.value;
  const ownDepartmentLabel = departments.own?.label;
  useEffect(() => {
    if (ownDepartmentId && ownDepartmentLabel)
      form.setValue("department", { value: ownDepartmentId, label: ownDepartmentLabel });
  }, [form, ownDepartmentId, ownDepartmentLabel]);
  const busy = createState.isLoading || uploadState.isLoading;
  const dirty = form.formState.dirtyFields;
  const fields = useMemo((): WizardField<TopUpHeaderValues>[] => [
    ...(departments.own ? [] : [{ type: InputTypes.SELECT, name: "department", label: "Production department", mode: "single", source: "async", loadOptions: departments.loadOptions, required: true } satisfies WizardField<TopUpHeaderValues>]),
    { type: InputTypes.SELECT, name: "massUnit", label: "Weight quantities are in", mode: "single", source: "sync", options: options(massUnits), required: true },
    { type: InputTypes.SELECT, name: "volumeUnit", label: "Liquid quantities are in", mode: "single", source: "sync", options: options(volumeUnits), required: true },
    { type: InputTypes.TEXTAREA, name: "reason", label: "Reason for migration top-up", required: true, className: "md:col-span-3", description: "Explain this individual post-migration case. The reason stays with the stock and its approval." },
    ...(source === "excel" ? [{ type: InputTypes.UPLOAD, name: "file", mode: "single", label: "Stock workbook", accept: ".xlsx", className: "md:col-span-3" } satisfies WizardField<TopUpHeaderValues>] : []),
  ], [departments.own, departments.loadOptions, source]);
  const submit = form.handleSubmit(async (values) => {
    if (!values.department) return;
    if (source === "excel" && !values.file) { setError("Choose the stock workbook."); return; }
    if (source === "manual" && rows.length === 0) { setError("Add at least one stock line."); return; }
    const denied = permission.check();
    if (denied) { setError(denied); return; }
    setError("");
    const common = { departmentId: values.department.value, reason: values.reason, massUnit: values.massUnit.value, volumeUnit: values.volumeUnit.value };
    const result = source === "excel" && values.file
      ? await upload({ ...common, file: values.file })
      : await create({ ...migrationAudit, domainEntitiesMaterialsStockMigrationsCreateStockTopUpRequest: { ...common, lines: rows.map(topUpLineRequest) } });
    if ("error" in result) { setError(apiErrorMessage(result.error)); return; }
    setSaved(true);
    void navigate(migrationPath(result.data));
  });

  return <div className="min-w-0 space-y-4">
    <div><h2 className="font-semibold">Migration stock top-up</h2>
      <p className="text-sm text-muted-foreground">Add stock discovered after migration. Save one list as a draft for approval. Approval adds separate lots and preserves existing stock.</p></div>
    <form noValidate onSubmit={submit} className="space-y-4">
      <fieldset disabled={busy} className="min-w-0 space-y-3">
        {departments.own ? <p className="text-sm">Production department: {departments.own.label}</p> : null}
        <FormWizard form={form} fields={fields.map((field) => "name" in field ? { ...field, disabled: busy || (field.name !== "department" && !permission.allowed) } : field)} className="md:grid-cols-3" />
        <Tabs value={source} onValueChange={setSource}><TabsList><TabsTrigger value="manual">Enter stock lines</TabsTrigger><TabsTrigger value="excel">Upload Excel</TabsTrigger></TabsList></Tabs>
        <p className="text-xs text-muted-foreground">Quantities use the weight and liquid units selected above; counts stay in the base UOM. Dates use manufacturing and expiry months, as in stock migration.</p>
        {source === "manual" ? <>
          <StockTopUpRows rows={rows} disabled={busy || !permission.allowed} edit={setEditing} remove={(id) => setRows((current) => current.filter((row) => row.id !== id))} />
          <Button type="button" variant="outline" disabled={rows.length >= 1000 || !permission.allowed} onClick={() => setEditing("new")}><Plus />Add stock line</Button>
        </> : <p className="text-sm">Use the existing material-stock Excel format, including batch, shelf, quantity, UOM, manufacturing/expiry, GRN and AR columns.</p>}
        {error ? <p role="alert" className="break-words text-sm text-destructive">{error}</p> : null}
        <Button type="submit" disabled={busy || !permission.allowed}>{busy ? <><Spinner />Saving draft…</> : "Save top-up draft"}</Button>
      </fieldset>
    </form>
    {department ? <StockMigrationHistory departmentId={department.value} topUp /> : null}
    {editing ? <StockTopUpLineDialog initial={editing === "new" ? emptyTopUpLine : editing} onClose={() => setEditing(null)} onSave={(line) => {
      setRows((current) => editing === "new" ? [...current, { ...line, id: crypto.randomUUID() }] : current.map((row) => row.id === editing.id ? { ...line, id: row.id } : row));
      setEditing(null);
    }} /> : null}
    <UnsavedChangesGuard when={!saved && (Boolean(dirty.reason || dirty.file || dirty.massUnit || dirty.volumeUnit) || rows.length > 0)} />
  </div>;
}
