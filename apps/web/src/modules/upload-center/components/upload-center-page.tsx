import { useState } from "react";
import { skipToken } from "@reduxjs/toolkit/query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { hrApi } from "@/shared/api/generated/hr";
import { identityApi } from "@/shared/api/generated/identity";
import { useCurrentUser } from "@/shared/auth/session-provider";
import { useAccess } from "@/shared/auth/use-access";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { AsyncOptionPicker } from "@/shared/forms/async-option-picker";
import type { SelectOption } from "@/shared/forms/form-wizard-types";
import { SettingsHeader } from "@/modules/settings-support/ui";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { uploadApi } from "../api/upload-api";
import { attendance, materialStock, productStock, shiftSchedule, toSmallestUnits } from "../lib/sheets";
import { uploadPermissions } from "../lib/upload-center";
import { saveUrl } from "../lib/workbook";
import { useDepartments } from "../hooks/use-departments";
import { StockMigrationTab } from "./stock-migration-tab";
import { UploadSheet } from "./upload-sheet";

const audit = { module: "Settings", subModule: "Configurations" } as const;
const divisions = [{ value: "0", label: "Beta-lactam" }, { value: "1", label: "Non-beta-lactam" }] as const;

function Choice({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-1 text-sm"><span>{label}</span>{children}</div>; }
function Fixed({ value }: { value: string }) { return <p className="rounded-md border bg-muted/40 px-3 py-2 text-sm">{value}</p>; }
async function template(request: Promise<{ data: string } | { error: Parameters<typeof apiErrorMessage>[0] }>, name: string) {
  const result = await request;
  if ("error" in result) return apiErrorMessage(result.error);
  saveUrl(result.data, name);
  return null;
}

function MaterialTab() {
  const departments = useDepartments();
  const [chosen, setChosen] = useState<SelectOption | null>(null);
  const [kind, setKind] = useState<"0" | "1">("0");
  const department = departments.own ?? chosen;
  const [upload] = uploadApi.useUploadMaterialStockMutation();
  const [download] = uploadApi.useMaterialTemplateMutation();
  return <UploadSheet profile={materialStock} require={uploadPermissions.material} unitSwitch prepare={toSmallestUnits} ready={department ? null : "Choose the production department."}
    options={<>
      <Choice label="Material kind"><Select value={kind} onValueChange={(value) => setKind(value === "1" ? "1" : "0")}><SelectTrigger aria-label="Material kind" className="w-full"><SelectValue /></SelectTrigger>
        <SelectContent><SelectItem value="0">Raw material</SelectItem><SelectItem value="1">Packaging material</SelectItem></SelectContent></Select></Choice>
      <Choice label="Production department">{departments.own ? <Fixed value={departments.own.label} /> : <AsyncOptionPicker label="Production department" value={chosen} onChange={setChosen} loadOptions={departments.loadOptions} placeholder="Choose a department" />}</Choice>
    </>}
    template={{ label: "Download template", download: () => template(download({ kind: kind === "1" ? 1 : 0, ...(department ? { departmentId: department.value } : {}) }), "material-stock-template.xlsx") }}
    submit={async (file) => { if (!department) return "Choose the production department."; const result = await upload({ file, departmentId: department.value }); return "error" in result ? apiErrorMessage(result.error) : null; }} />;
}

function ProductTab() {
  const user = useCurrentUser();
  const own = identityApi.useGetApiV1DepartmentByDepartmentIdQuery(user?.departmentId ? { ...audit, departmentId: user.departmentId } : skipToken);
  const ownDivision = own.data?.division === 0 || own.data?.division === 1 ? own.data.division : null;
  const [chosen, setChosen] = useState<"0" | "1">("0");
  const division = user?.departmentId ? ownDivision : chosen === "1" ? 1 : 0;
  const [upload] = uploadApi.useUploadProductStockMutation();
  const [download] = uploadApi.useProductTemplateMutation();
  return <UploadSheet profile={productStock} require={uploadPermissions.product} ready={null}
    options={<Choice label="Division">{user?.departmentId ? <Fixed value={division === null ? (own.isLoading ? "Loading…" : "Your department has no division") : divisions[division].label} />
      : <Select value={chosen} onValueChange={(value) => setChosen(value === "1" ? "1" : "0")}><SelectTrigger aria-label="Division" className="w-full"><SelectValue /></SelectTrigger>
        <SelectContent>{divisions.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select>}</Choice>}
    template={{ label: "Download template", download: () => division === null ? Promise.resolve("Your department's division could not be found. Ask an administrator to set it.")
      : template(download({ division, ...(user?.departmentId ? { departmentId: user.departmentId } : {}) }), "product-stock-template.xlsx") }}
    submit={async (file) => { const result = await upload({ file }); return "error" in result ? apiErrorMessage(result.error) : null; }} />;
}

function AttendanceTab() {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [upload] = uploadApi.useUploadAttendanceMutation();
  return <UploadSheet profile={attendance} require={uploadPermissions.attendance} ready={date ? null : "Choose the attendance date."}
    options={<Choice label="Attendance date"><Input type="date" value={date} max={today} onChange={(event) => setDate(event.target.value)} /></Choice>}
    submit={async (file) => { const result = await upload({ file, date: new Date(`${date}T00:00:00`).toISOString() }); return "error" in result ? apiErrorMessage(result.error) : null; }} />;
}

function ScheduleTab() {
  const departments = useDepartments();
  const [department, setDepartment] = useState<SelectOption | null>(null);
  const [shift, setShift] = useState<string>("");
  const shifts = hrApi.useGetApiV1ShiftSchedulesDepartmentByIdQuery(department ? { module: "Management", subModule: "Shift Upload", id: department.value } : skipToken);
  const [upload] = uploadApi.useUploadShiftAssignmentsMutation();
  const options = (shifts.data ?? []).flatMap((item) => item.id ? [{ value: item.id, label: item.scheduleName ?? "Shift schedule" }] : []);
  return <UploadSheet profile={shiftSchedule} require={uploadPermissions.schedule} ready={!department ? "Choose the department." : !shift ? "Choose the shift schedule." : null}
    options={<>
      <Choice label="Department"><AsyncOptionPicker label="Department" value={department} onChange={(next) => { setDepartment(next); setShift(""); }} loadOptions={departments.loadOptions} placeholder="Choose a department" /></Choice>
      <Choice label="Shift schedule"><Select value={shift} onValueChange={setShift} disabled={!department}><SelectTrigger aria-label="Shift schedule" className="w-full"><SelectValue placeholder={department ? options.length ? "Choose a schedule" : "No schedules for this department" : "Choose the department first"} /></SelectTrigger>
        <SelectContent>{options.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select></Choice>
    </>}
    submit={async (file) => { if (!department || !shift) return "Choose the department and shift schedule."; const result = await upload({ file, departmentId: department.value, shiftId: shift }); return "error" in result ? apiErrorMessage(result.error) : null; }} />;
}

const tabs = [
  { id: "material", label: "Material stock", require: uploadPermissions.material, Panel: MaterialTab },
  { id: "migration", label: "Stock migration", require: uploadPermissions.material, Panel: StockMigrationTab },
  { id: "product", label: "Product stock", require: uploadPermissions.product, Panel: ProductTab },
  { id: "attendance", label: "Attendance", require: uploadPermissions.attendance, Panel: AttendanceTab },
  { id: "schedule", label: "Shift schedule", require: uploadPermissions.schedule, Panel: ScheduleTab },
] as const;

/** Bulk uploads of material and product stock, attendance and shift assignments, each checked row by row before it is sent. */
export function UploadCenterPage() {
  const { allows } = useAccess();
  const shown = tabs.filter((tab) => allows(tab.require));
  const [tab, setTab] = useState<string>(shown[0]?.id ?? "material");
  return <section className="min-w-0 space-y-4">
    <SettingsHeader title="Upload Center" description="Upload a filled sheet, check and correct its rows, then submit." />
    {shown.length === 0 ? <p className="text-sm text-muted-foreground">You may not make any of these uploads.</p>
      : <Tabs value={tab} onValueChange={setTab}><TabsList>{shown.map((item) => <TabsTrigger key={item.id} value={item.id}>{item.label}</TabsTrigger>)}</TabsList>
        {shown.map((item) => <TabsContent key={item.id} value={item.id} className="pt-3"><item.Panel /></TabsContent>)}</Tabs>}
  </section>;
}
