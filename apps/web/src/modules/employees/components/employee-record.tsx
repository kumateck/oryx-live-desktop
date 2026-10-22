import type { Employee } from "../api/employee-api";
import { AttachmentList } from "@/shared/attachments/attachment-list";
import { EmployeePersonalDetails } from "./employee-personal-details";
import { EmployeeEmploymentDetails } from "./employee-employment-details";
import { EmployeeFamilyDetails } from "./employee-family-details";
import { EmployeeHistoryDetails } from "./employee-history-details";
export function EmployeeRecord({ employee }: { employee: Employee }) {
  return (
    <div className="space-y-5">
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <EmployeePersonalDetails employee={employee} />
        <EmployeeEmploymentDetails employee={employee} />
        <EmployeeFamilyDetails employee={employee} />
      </div>
      <EmployeeHistoryDetails employee={employee} />
      <AttachmentList
        title="Attachments"
        files={(employee.attachments ?? []).flatMap((file) => (file.id && file.name ? [{ id: file.id, name: file.name, link: file.link ?? null }] : []))}
      />
    </div>
  );
}
