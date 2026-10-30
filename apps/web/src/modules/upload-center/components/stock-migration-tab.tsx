import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { skipToken } from "@reduxjs/toolkit/query";
import { Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { ClientDataTable, dataTableColumns } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDateTime } from "@/shared/format/dates";
import { AsyncOptionPicker } from "@/shared/forms/async-option-picker";
import type { SelectOption } from "@/shared/forms/form-wizard-types";
import { migrationAudit, stockMigrationApi, type MigrationDto } from "../api/stock-migration-api";
import { useDepartments } from "../hooks/use-departments";
import { massUnits, migrationPath, migrationPermission, migrationStatusLabels, volumeUnits } from "../lib/stock-migration";

const column = dataTableColumns<MigrationDto>();

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="space-y-1 text-sm"><span>{label}</span>{children}</label>;
}

function UnitSelect({ label, value, units, onChange }: { label: string; value: string; units: readonly string[]; onChange: (unit: string) => void }) {
  return <Select value={value} onValueChange={onChange}><SelectTrigger aria-label={label} className="w-full"><SelectValue /></SelectTrigger>
    <SelectContent>{units.map((unit) => <SelectItem key={unit} value={unit}>{unit}</SelectItem>)}</SelectContent></Select>;
}

/**
 * Opening stock: upload a department's stock count to check it row by row. Approving it on the next page writes off the
 * department's current storage stock and loads the count in its place.
 */
export function StockMigrationTab() {
  const navigate = useNavigate();
  const departments = useDepartments();
  const [chosen, setChosen] = useState<SelectOption | null>(null);
  const department = departments.own ?? chosen;
  const [massUnit, setMassUnit] = useState<string>("kg");
  const [volumeUnit, setVolumeUnit] = useState<string>("L");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [upload, { isLoading }] = stockMigrationApi.useUploadMutation();
  const permission = usePermissionAction(migrationPermission);
  const list = stockMigrationApi.useListQuery(department ? { ...migrationAudit, departmentId: department.value } : skipToken);

  const submit = async () => {
    const denied = permission.check();
    if (denied) { setError(denied); return; }
    if (!department || !file) { setError("Choose the department and the stock sheet."); return; }
    setError("");
    const result = await upload({ file, departmentId: department.value, massUnit, volumeUnit });
    if ("error" in result) { setError(apiErrorMessage(result.error)); return; }
    void navigate(migrationPath(result.data));
  };

  const columns = useMemo(() => column.columns([
    column.accessor((row) => row.fileName ?? "", { id: "file", header: "Sheet", cell: ({ row }) => <span className="break-words font-medium">{row.original.fileName ?? "Stock sheet"}</span> }),
    column.accessor((row) => row.createdAt ?? "", { id: "uploaded", header: "Uploaded", size: 200, cell: ({ row }) =>
      <div><div>{formatDateTime(row.original.createdAt)}</div><div className="text-xs text-muted-foreground">{row.original.createdBy}</div></div> }),
    column.accessor((row) => row.status ?? 0, { id: "status", header: "Status", size: 120, cell: ({ row }) =>
      <Badge variant={row.original.status === 1 ? "default" : row.original.status === 2 ? "outline" : "secondary"}>{migrationStatusLabels[row.original.status ?? 0]}</Badge> }),
    column.accessor((row) => row.total ?? 0, { id: "rows", header: "Rows", size: 260, cell: ({ row }) =>
      <span className="text-xs">{row.original.ok} ready · {row.original.warning} to check · <span className={row.original.blocked ? "text-destructive" : ""}>{row.original.blocked} to fix</span></span> }),
  ]), []);

  return <div className="space-y-4">
    <div className="rounded-md border p-4">
      <p className="mb-3 text-sm text-muted-foreground">Upload the counted stock. Nothing changes until the rows are checked and the migration is approved;
        approving writes off the department&apos;s current raw and packaging stock and loads the count in its place.</p>
      <div className="grid gap-3 md:grid-cols-4">
        <Field label="Production department">{departments.own ? <p className="rounded-md border bg-muted/40 px-3 py-2 text-sm">{departments.own.label}</p>
          : <AsyncOptionPicker label="Production department" value={chosen} onChange={setChosen} loadOptions={departments.loadOptions} placeholder="Choose a department" />}</Field>
        <Field label="Weights in the sheet are in"><UnitSelect label="Weights in the sheet are in" value={massUnit} units={massUnits} onChange={setMassUnit} /></Field>
        <Field label="Liquids in the sheet are in"><UnitSelect label="Liquids in the sheet are in" value={volumeUnit} units={volumeUnits} onChange={setVolumeUnit} /></Field>
        <Field label="Stock sheet"><Input type="file" accept=".xlsx" aria-label="Stock sheet" onChange={(event) => setFile(event.target.files?.[0] ?? null)} /></Field>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button type="button" disabled={isLoading || !permission.allowed} onClick={() => void submit()}>{isLoading ? <><Spinner />Reading the sheet…</> : <><Upload />Upload and check</>}</Button>
        <span className="text-xs text-muted-foreground">Choose what the numbers really are: a sheet headed &quot;mg&quot; that holds kilograms is read as kg.</span>
      </div>
      {error ? <p role="alert" className="mt-2 break-words text-sm text-destructive">{error}</p> : null}
    </div>
    {department ? <ClientDataTable label="Stock migrations" columns={columns} rows={list.data} getRowId={(row) => row.id ?? ""} loading={list.isLoading} refreshing={list.isFetching}
      error={list.error ? apiErrorMessage(list.error) : null} onRetry={() => void list.refetch()} onRowOpen={(row) => row.id && void navigate(migrationPath(row.id))} fill={false}
      emptyTitle="No stock migrations yet" emptyDescription="Upload a stock sheet to check it." /> : null}
  </div>;
}
