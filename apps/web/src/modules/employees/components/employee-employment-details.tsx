import type { Employee } from "../api/employee-api";
import { DetailGroup, DetailItem } from "@/shared/detail/detail-list";
import { formatDate, formatDateTime } from "@/shared/format/dates";
import { employeeTypeLabels, employeeStatusLabels, activeStatusLabels, inactiveStatusLabels } from "../lib/access";
import { religionOptions } from "../lib/employee-payload";
const gender = (value: number | undefined) => (value === 0 ? "Male" : value === 1 ? "Female" : null);
export function EmployeeEmploymentDetails({ employee: e }: { employee: Employee }) {
  return (
    <DetailGroup title="Employment information">
      <DetailItem label="Staff number" value={e.staffNumber} />
      <DetailItem label="Employment type" value={e.type === undefined ? null : employeeTypeLabels[e.type]} />
      <DetailItem label="Status" value={e.status === undefined ? null : employeeStatusLabels[e.status]} />
      <DetailItem label="Active status" value={e.activeStatus === undefined ? null : activeStatusLabels[e.activeStatus]} />
      <DetailItem label="Inactive status" value={e.inactiveStatus === undefined ? null : inactiveStatusLabels[e.inactiveStatus]} />
      <DetailItem label="Department" value={e.department?.name} />
      <DetailItem label="Designation" value={e.designation?.name} />
      <DetailItem label="Grade" value={e.level === undefined ? null : ["Junior staff", "Senior staff", "Senior management"][e.level]} />
      <DetailItem
        label="Reporting manager"
        value={e.reportingManager ? `${e.reportingManager.firstName ?? ""} ${e.reportingManager.lastName ?? ""}`.trim() : null}
      />
      <DetailItem label="Date employed" value={formatDate(e.dateEmployed)} />
      <DetailItem label="Annual leave days" value={e.annualLeaveDays} />
      <DetailItem label="Suspension from" value={formatDate(e.suspensionStartDate)} />
      <DetailItem label="Suspension to" value={formatDate(e.suspensionEndDate)} />
      <DetailItem label="Registered" value={formatDateTime(e.createdAt)} />
      <DetailItem label="Registered by" value={e.createdBy ? `${e.createdBy.firstName ?? ""} ${e.createdBy.lastName ?? ""}`.trim() : null} />
    </DetailGroup>
  );
}
