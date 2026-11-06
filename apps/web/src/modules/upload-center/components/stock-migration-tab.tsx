import { useState } from "react";
import { useNavigate } from "react-router";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { SearchableSelect } from "@/shared/forms/searchable-select";
import type { SelectOption } from "@/shared/forms/form-wizard-types";
import { stockMigrationApi } from "../api/stock-migration-api";
import { useDepartments } from "../hooks/use-departments";
import { massUnits, migrationPath, openingBalancePermissions, volumeUnits } from "../lib/stock-migration";

import { StockMigrationHistory } from "./stock-migration-history";

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
  const [massUnit, setMassUnit] = useState<string>("mg");
  const [volumeUnit, setVolumeUnit] = useState<string>("ml");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [upload, { isLoading }] = stockMigrationApi.useUploadMutation();
  const permission = usePermissionAction(openingBalancePermissions.upload);

  const submit = async () => {
    const denied = permission.check();
    if (denied) { setError(denied); return; }
    if (!department || !file) { setError("Choose the department and the stock sheet."); return; }
    setError("");
    const result = await upload({ file, departmentId: department.value, massUnit, volumeUnit });
    if ("error" in result) { setError(apiErrorMessage(result.error)); return; }
    void navigate(migrationPath(result.data));
  };

  return <div className="space-y-4">
    <div className="rounded-md border p-4">
      <h2 className="mb-1 font-semibold">Opening balance drafts</h2>
      <p className="mb-3 text-sm text-muted-foreground">Upload material stock as a draft, correct and verify its rows, then approve it as opening balances.
        Drafts do not change available stock. Uploading, correcting and approving use separate permissions.</p>
      <div className="grid gap-3 md:grid-cols-4">
        <Field label="Production department">{departments.own ? <p className="rounded-md border bg-muted/40 px-3 py-2 text-sm">{departments.own.label}</p>
          : <SearchableSelect clearable={false} label="Production department" value={chosen} onChange={(option) => { if (option) setChosen(option); }} loadOptions={departments.loadOptions} placeholder="Choose a department" />}</Field>
        <Field label="Weights in the sheet are in"><UnitSelect label="Weights in the sheet are in" value={massUnit} units={massUnits} onChange={setMassUnit} /></Field>
        <Field label="Liquids in the sheet are in"><UnitSelect label="Liquids in the sheet are in" value={volumeUnit} units={volumeUnits} onChange={setVolumeUnit} /></Field>
        <Field label="Stock sheet"><Input type="file" accept=".xlsx" aria-label="Stock sheet" onChange={(event) => setFile(event.target.files?.[0] ?? null)} /></Field>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button type="button" disabled={isLoading || !permission.allowed} onClick={() => void submit()}>{isLoading ? <><Spinner />Saving draft…</> : <><Upload />Upload and save draft</>}</Button>
        <span className="text-xs text-muted-foreground">Prepared files contain mg and ml. Select kg or L only when the file&apos;s quantities have not been converted.</span>
      </div>
      {error ? <p role="alert" className="mt-2 break-words text-sm text-destructive">{error}</p> : null}
    </div>
    {department ? <StockMigrationHistory departmentId={department.value} /> : null}
  </div>;
}
