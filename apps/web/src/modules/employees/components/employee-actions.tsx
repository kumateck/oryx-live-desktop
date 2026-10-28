import { lazy, Suspense, useState } from "react";
import { Eye, Pencil, Mail, UserRoundCog, ArrowRightLeft } from "lucide-react";
import { TableMenu } from "@/shared/actions";
import type { Employee } from "../api/employee-api";
import { employeeDetailsPath, employeePermissions as p } from "../lib/access";
import type { EmployeeChange } from "./employee-change-dialog";
const ChangeDialog = lazy(() => import("./employee-change-dialog").then((module) => ({ default: module.EmployeeChangeDialog })));
const Assignment = lazy(() => import("./employee-assignment").then((module) => ({ default: module.EmployeeAssignment })));
export function EmployeeActions({ employee, detail = false }: { employee: Employee; detail?: boolean }) {
  const [selected, setSelected] = useState<{ kind: EmployeeChange | "assign"; evidence: Employee } | null>(null);
  if (!employee.id) return null;
  const select = (kind: EmployeeChange | "assign") => setSelected({ kind, evidence: structuredClone(employee) });
  return <><TableMenu label={`Actions for ${employee.firstName ?? "employee"}`} items={[
    ...(!detail ? [{ id: "view", label: "Employee details", icon: Eye, to: employeeDetailsPath(employee.id), require: p.details }] : []),
    { id: "edit", label: "Edit profile", icon: Pencil, to: `/hr/employee-management/${encodeURIComponent(employee.id)}/edit/${employee.type}`, require: p.update, disabled: employee.type === undefined, disabledReason: "Employment type is not recorded." },
    { id: "assign", label: "Assign designation", icon: UserRoundCog, require: p.update, onSelect: () => select("assign") },
    { id: "email", label: "Update email", icon: Mail, require: p.email, onSelect: () => select("email") },
    { id: "type", label: "Change employment type", icon: ArrowRightLeft, require: p.update, onSelect: () => select("type") },
    { id: "status", label: "Change employee status", icon: UserRoundCog, require: p.update, disabled: employee.status === 2, disabledReason: "Activate new employees through designation assignment.", onSelect: () => select("status") },
  ]} />
    {selected ? <Suspense fallback={<p role="status">Loading employee action…</p>}>{selected.kind === "assign" ? <Assignment employee={selected.evidence} onClose={() => setSelected(null)} /> : <ChangeDialog employee={selected.evidence} kind={selected.kind} onClose={() => setSelected(null)} />}</Suspense> : null}
  </>;
}
