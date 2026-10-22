import type { Employee } from "../api/employee-api";
import { employeeFormValues, employeePayload } from "./employee-payload";
/** Stable editable evidence plus employment state; attachment/order metadata cannot silently replace it. */
export function employeeEvidence(employee: Employee): string | null {
  if (!employee.id || employee.type === undefined || employee.status === undefined) return null;
  return JSON.stringify({ id: employee.id, profile: employeePayload(employeeFormValues(employee), employee.type), status: employee.status, active: employee.activeStatus, inactive: employee.inactiveStatus, level: employee.level, start: employee.suspensionStartDate, end: employee.suspensionEndDate, department: employee.department?.id, designation: employee.designation?.id, manager: employee.reportingManagerId });
}
export function preservedEmploymentState(employee: Employee) {
  return { ...(employee.status === undefined ? {} : { status: employee.status }), ...(employee.level === undefined ? {} : { level: employee.level }), ...(employee.activeStatus === undefined ? {} : { activeStatus: employee.activeStatus }), ...(employee.inactiveStatus === undefined ? {} : { inactiveStatus: employee.inactiveStatus }), ...(employee.suspensionStartDate === undefined ? {} : { suspensionStartDate: employee.suspensionStartDate }), ...(employee.suspensionEndDate === undefined ? {} : { suspensionEndDate: employee.suspensionEndDate }) };
}
